import { Server, Serve } from './server';

export function serve(options: Serve) {
  const server = new Server(options);

  return server;
}
