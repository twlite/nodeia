import net from 'node:net';
import type { TcpServerErrorHandler, TcpSocketOptions } from '../types/tcp';
import { AnyListeningCallback, IDisposable } from '../types/common';

export interface Listen {
  port: number;
  hostname?: string;
  socket?: TcpSocketOptions;
  listening?: AnyListeningCallback<TCP>;
  error?: TcpServerErrorHandler;
  listen?: boolean;
}

export class TCP implements IDisposable {
  #server: net.Server;

  public constructor(private readonly options: Listen) {
    this.options.hostname ??= 'localhost';
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
    return `tcp://${this.hostname}:${this.port}`;
  }

  public listen() {
    this.#server.listen(this.port, this.hostname);
  }

  public unref() {
    this.#server.unref();
  }

  public stop() {
    return this.close();
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

  #create() {
    const { close, data, drain, error, open } = this.options.socket ?? {};

    const server = net.createServer(async (socket) => {
      if (close) {
        socket.on('close', () => close(socket));
      }

      if (data) {
        socket.on('data', (buffer) => data(socket, buffer));
      }

      if (drain) {
        socket.on('drain', () => drain(socket));
      }

      if (error) {
        socket.on('error', (err) => error(socket, err));
      }

      if (open) {
        socket.on('ready', () => open(socket));
      }
    });

    server.on('error', async (error) => {
      await this.close();
      if (!this.options.error) {
        throw error;
      }
      this.options.error?.(error);
    });

    server.on('listening', () => {
      const { listening } = this.options;

      if (!listening) return;

      const hostname = this.hostname;
      const port = this.port;

      listening(hostname, port, this);
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
 * Create a TCP server. This is a low-level server that allows you to handle raw TCP connections.
 * @param options The options for the TCP server.
 * @returns A TCP server.
 */
export function listen(options: Listen) {
  return new TCP(options);
}
