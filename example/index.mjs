import { serve } from '../dist/index.mjs';

serve({
  development: false,
  fetch(req, server) {
    if (server.upgrade(req)) {
      console.log('WebSocket upgraded');
      return;
    }

    return new Response('Hello, world!', {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  },
  listening(hostname, port, server) {
    console.log(`Listening on ${server.url}`);
  },
  websocket: {
    open(ws) {
      ws.send('Hello, websocket!');
    },
    message(ws, message) {
      const msg = String(message);
      console.log('WebSocket message:', msg);
      if (msg === 'close') ws.close(1000, 'Goodbye!');
    },
    close(ws, code, message) {
      console.log('WebSocket closed');
    },
  },
});
