import http from 'node:http';
import {
  ErrorHandler,
  FetchHandler,
  WebsocketCloseHandler,
  WebsocketDrainHandler,
  WebsocketErrorHandler,
  WebsocketMessageHandler,
  WebsocketOpenHandler,
} from '../types/http';
import { createErrorResponse } from './error';
import { Readable } from 'node:stream';
import { WebSocketServer } from 'ws';
import { AnyListeningCallback, IDisposable } from '../types/common';

export interface WebsocketOptions {
  message?: WebsocketMessageHandler;
  open?: WebsocketOpenHandler;
  close?: WebsocketCloseHandler;
  drain?: WebsocketDrainHandler;
  error?: WebsocketErrorHandler;
}

export interface Serve {
  port?: number;
  hostname?: string;
  development?: boolean;
  fetch?: FetchHandler;
  error?: ErrorHandler;
  listen?: boolean;
  listening?: AnyListeningCallback<Server>;
  websocket?: WebsocketOptions;
}

const getEnv = (key: string) =>
  typeof process !== 'undefined' ? process.env[key] : undefined;

const DEFAULT_PORT = Number(
  getEnv('NODE_PORT') ?? getEnv('PORT') ?? getEnv('BUN_PORT') ?? 3000
);

const BodyLess = new Set([
  'GET',
  'HEAD',
  'OPTIONS',
  'TRACE',
  'CONNECT',
  'PURGE',
  'LINK',
  'UNLINK',
]);

export class Server implements IDisposable {
  #server: http.Server;
  #websocket: WebSocketServer | null = null;
  #retried = false;

  public constructor(private readonly options: Serve) {
    this.options.port ??= DEFAULT_PORT;
    this.options.hostname ??= '0.0.0.0';
    this.options.listen ??= true;
    this.#server = this.#create();

    if (this.options.listen) this.listen();
  }

  public get listening() {
    return this.#server.listening;
  }

  public get port(): number {
    const address = this.#server.address();
    if (address && typeof address !== 'string') return address.port;
    return this.options.port!;
  }

  public get hostname(): string {
    const address = this.#server.address();
    if (address && typeof address !== 'string') return address.address;
    return this.options.hostname!;
  }

  public get url(): string {
    return `http://${this.hostname}:${this.port}`;
  }

  public listen() {
    this.#server.listen(this.port, this.hostname);
  }

  public unref() {
    this.#server.unref();
  }

  public close() {
    return new Promise<void>((resolve, reject) => {
      this.#server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  public shutdown() {
    return this.close();
  }

  public ref() {
    this.#server.ref();
  }

  public upgrade(request: Request): boolean {
    try {
      const upgrade = request.headers.get('upgrade');

      if (!upgrade || upgrade.toLowerCase() !== 'websocket') return false;

      const req = Reflect.get(request, '_upgradeMetadata') as {
        socket: http.IncomingMessage['socket'];
        head: Buffer;
        req: http.IncomingMessage;
      };

      if (!req) return false;

      if (!this.#websocket) this.#createWebsocket();

      this.#websocket!.handleUpgrade(req.req, req.socket, req.head, (ws) => {
        this.#websocket?.emit('connection', ws, request);
      });

      return true;
    } catch {
      return false;
    }
  }

  #createWebsocket() {
    if (this.#websocket) return;

    const wss = (this.#websocket = new WebSocketServer({
      noServer: true,
    }));

    const { message, open, close, drain, error } = this.options.websocket ?? {};

    wss.on('connection', (ws) => {
      if (message) {
        ws.on('message', (m) => {
          message(ws, m);
        });
      }

      if (close) {
        ws.on('close', (code, message) => {
          close(ws, code, message);
        });
      }

      if (drain) {
        ws.on('drain', () => {
          drain(ws);
        });
      }

      if (error) {
        ws.on('error', (e) => {
          error(ws, e);
        });
      }

      open?.(ws);
    });
  }

  #handleRequest(request: Request) {
    const { fetch } = this.options;

    if (!fetch) {
      return new Response('Route not found', { status: 404 });
    }

    return fetch(request, this);
  }

  #handleError(error: Error, req: Request) {
    const { error: ErrorHandler } = this.options;

    if (!ErrorHandler) {
      if (this.options.development) return createErrorResponse(error);
      console.error(error);
      return new Response('Internal Server Error', { status: 500 });
    }

    return ErrorHandler(error, req, this);
  }

  #prepareRequest(req: http.IncomingMessage) {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      headers.set(key, value as string);
    }

    const body =
      req.method && BodyLess.has(req.method)
        ? null
        : (Readable.toWeb(req) as BodyInit);

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    return request;
  }

  async #emitResponse(res: http.ServerResponse, request: Request) {
    let response: Response | undefined | void;

    try {
      response = await this.#handleRequest(request);
    } catch (e) {
      response = await this.#handleError(e as Error, request);
    }

    if (response) {
      res.statusCode = response.status;

      // @ts-ignore
      for (const [key, value] of response.headers) {
        res.appendHeader(key, value);
      }

      if (response.body && !response.bodyUsed) {
        // @ts-ignore
        Readable.fromWeb(response.body).pipe(res);
      } else {
        res.end();
      }
    }
  }

  #create() {
    const server = http.createServer(async (req, res) => {
      try {
        const request = this.#prepareRequest(req);
        this.#emitResponse(res, request);
      } catch {
        res.end();
      }
    });

    server.on('upgrade', async (req, socket, head) => {
      const request = this.#prepareRequest(req);

      try {
        const metadata = {
          socket,
          head,
          req,
        };

        Reflect.set(request, '_upgradeMetadata', metadata);

        const res = await this.#handleRequest(request);

        if (res?.body && !res.bodyUsed) {
          Readable.fromWeb(res.body as any).pipe(socket, { end: true });
        }
      } catch (e) {
        const res = await this.#handleError(e as Error, request);
        if (res?.body && !res.bodyUsed) {
          Readable.fromWeb(res.body as any).pipe(socket, { end: true });
        }
      }
    });

    server.on('error', (error) => {
      if ('code' in error && error.code === 'EADDRINUSE') {
        if (!this.#retried && this.options.port === DEFAULT_PORT) {
          this.options.port = 0;
          this.#server.close();
          this.#retried = true;
          this.listen();
          return;
        }

        this.#server.close();
      }

      throw error;
    });

    server.on('listening', () => {
      const { listening } = this.options;

      if (!listening) return;

      const hostname = this.hostname;
      const port = this.port;

      listening(hostname, port, this);
    });

    server.on('close', () => {
      this.#websocket?.close();
    });

    return server;
  }

  public [Symbol.dispose]() {
    return this.#server.close();
  }

  public [Symbol.asyncDispose]() {
    return this.close();
  }
}

/**
 * Create a new http or websocket server.
 * @param options The server options.
 * @returns A new server.
 */
export function serve(options: Serve) {
  const server = new Server(options);

  return server;
}
