import type ws from 'ws';

import type { Server } from '../serve/server';

export type Awaitable<T> = T | Promise<T>;
export type MaybeResponse = Response | void | undefined;

export type FetchHandler = (
  request: Request,
  server: Server
) => Awaitable<MaybeResponse>;

export type ErrorHandler = (
  error: Error,
  request: Request,
  server: Server
) => Awaitable<Response>;

export type WebsocketMessageHandler = (
  ws: ws,
  message: ws.RawData
) => Awaitable<void>;

export type WebsocketOpenHandler = (ws: ws) => Awaitable<void>;

export type WebsocketCloseHandler = (
  ws: ws,
  code: number,
  message: Buffer
) => Awaitable<void>;

export type WebsocketDrainHandler = (ws: ws) => Awaitable<void>;

export type WebsocketErrorHandler = (ws: ws, error: Error) => Awaitable<void>;
