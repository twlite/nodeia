export type Awaitable<T> = T | Promise<T>;
export type Maybe<T> = T | undefined | void;
export type IDisposable = Disposable & AsyncDisposable;
export type AnyListeningCallback<T> = (
  hostname: string,
  port: number,
  context: T
) => void;
