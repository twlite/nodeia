import net from 'node:net';

import { TcpClientSocketOptions } from '../types/tcp';

export interface Connect {
  hostname: string;
  port: number;
  socket?: TcpClientSocketOptions;
  options?: Omit<net.TcpSocketConnectOpts, 'host' | 'port'>;
}

export type BufferLike = string | Uint8Array | Buffer;

export class TCPClient {
  #socket: net.Socket;

  public constructor(private readonly options: Connect) {
    this.#socket = this.#create();
  }

  public get connecting() {
    return this.#socket.connecting;
  }

  public get pending() {
    return this.#socket.pending;
  }

  public connect() {
    return new Promise<void>((resolve) => {
      this.#socket.connect(this.options.port, this.options.hostname, resolve);
    });
  }

  public write(data: BufferLike) {
    return new Promise<void>((resolve, reject) => {
      this.#socket.write(data, (e) => {
        if (e) return reject(e);
        resolve();
      });
    });
  }

  public end() {
    return new Promise<void>((resolve) => {
      this.#socket.end(resolve);
    });
  }

  public close() {
    return this.end();
  }

  public destroy() {
    this.#socket.destroy();
  }

  public pause() {
    this.#socket.pause();
  }

  public resume() {
    this.#socket.resume();
  }

  public setEncoding(encoding: BufferEncoding) {
    this.#socket.setEncoding(encoding);
  }

  public setKeepAlive(enable?: boolean, initialDelay?: number) {
    this.#socket.setKeepAlive(enable, initialDelay);
  }

  public setNoDelay(noDelay?: boolean) {
    this.#socket.setNoDelay(noDelay);
  }

  public setTimeout(timeout: number, callback?: () => void) {
    this.#socket.setTimeout(timeout, callback);
  }

  public ref() {
    this.#socket.ref();
  }

  public unref() {
    this.#socket.unref();
  }

  public address() {
    return this.#socket.address();
  }

  public get destroyed() {
    return this.#socket.destroyed;
  }

  public get remoteAddress() {
    return this.#socket.remoteAddress;
  }

  public get remoteFamily() {
    return this.#socket.remoteFamily;
  }

  public get remotePort() {
    return this.#socket.remotePort;
  }

  public get localAddress() {
    return this.#socket.localAddress;
  }

  public get localPort() {
    return this.#socket.localPort;
  }

  public get localFamily() {
    return this.#socket.localFamily;
  }

  public get errored() {
    return this.#socket.errored;
  }

  public get closed() {
    return this.#socket.closed;
  }

  public get readyState() {
    return this.#socket.readyState;
  }

  #create() {
    const { close, connectError, data, drain, end, error, open, timeout } =
      this.options.socket ?? {};

    const client = net.createConnection(
      {
        ...this.options.options,
        host: this.options.hostname,
        port: this.options.port,
      },
      () => {
        open?.(this);
      }
    );

    if (close) client.on('close', () => close(this));
    if (data) client.on('data', (chunk) => data(this, chunk));
    if (drain) client.on('drain', () => drain(this));
    if (end) client.on('end', () => end(this));
    if (error) client.on('error', (err) => error(this, err));
    if (timeout) client.on('timeout', () => timeout(this));
    if (connectError)
      client.on('connectionAttemptFailed', (ip, port, family) =>
        connectError(
          this,
          new Error(`Failed to connect to ${ip}:${port} (family ${family})`)
        )
      );

    return client;
  }
}

/**
 * Connect to a TCP server.
 * @param options The connection options.
 * @returns The TCP client.
 */
export function connect(options: Connect) {
  return new TCPClient(options);
}
