import type { Socket } from 'node:net';
import type { TCPClient } from '../tcp/client';

export type TcpDataHandler<T> = (socket: T, data: Buffer) => void;
export type TcpOpenHandler<T> = (socket: T) => void;
export type TcpCloseHandler<T> = (socket: T) => void;
export type TcpDrainHandler<T> = (socket: T) => void;
export type TcpErrorHandler<T> = (socket: T, error: Error) => void;

export type TcpServerErrorHandler = (error: Error) => void;

export interface TcpSocketOptions<T = Socket> {
  data?: TcpDataHandler<T>;
  open?: TcpOpenHandler<T>;
  close?: TcpCloseHandler<T>;
  drain?: TcpDrainHandler<T>;
  error?: TcpErrorHandler<T>;
}

export interface TcpClientSocketOptions extends TcpSocketOptions<TCPClient> {
  connectError?: TcpErrorHandler<TCPClient>;
  end?: TcpCloseHandler<TCPClient>;
  timeout?: TcpCloseHandler<TCPClient>;
}
