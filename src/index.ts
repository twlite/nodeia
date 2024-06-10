import { serve } from './serve/server';
import { listen } from './tcp/server';
import { connect } from './tcp/client';

export const Nodeia = {
  serve,
  listen,
  connect,
};

export default Nodeia;

// http
export * from './serve/server';
export * from './serve/error';

// tcp
export * from './tcp/server';
export * from './tcp/client';

// types
export * from './types/http';
export * from './types/tcp';
export * from './types/common';
