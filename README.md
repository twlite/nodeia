# Nodeia

Nodeia is a simplified networking api for Node. It is based on [Bun.serve](https://bun.sh/docs/api/http) api and is designed to be easy to use and understand.

> **Note:** Nodeia is still in development and is not yet ready for production use. You can help by testing it and reporting any issues you find.

## Installation

```sh
npm install nodeia
```

## Usage

Nodeia is designed to be simple and easy to use. Here is an example of a simple HTTP server that responds with "Hello, world!" to all requests. It also supports WebSocket connections.

By default, Nodeia listens on `0.0.0.0` and port `3000`. You can change this by passing the `hostname` and `port` options to the `serve` function. If the port given is already in use, Nodeia will use a random port. You can also manually pass port `0` to let the OS choose a random port.

```js
import { serve } from 'nodeia';

serve({
  fetch(req, server) {
    // Upgrade to WebSocket if the request is a WebSocket upgrade request
    // do not return a response if the request is upgraded
    if (server.upgrade(req)) return;

    return new Response('Hello, world!', {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  },
  listening(hostname, port, server) {
    // 👂 We are now listening to the requests
    console.log(`Listening on ${server.url}`);
  },
  websocket: {
    // Called when a WebSocket connection is opened
    open(ws) {
      ws.send('Hello, websocket!');
    },
    // Called when a WebSocket message is received
    message(ws, message) {
      const msg = String(message);
      console.log('WebSocket message:', msg);
      // Close the WebSocket connection if the message is 'close'
      if (msg === 'close') ws.close(1000, 'Goodbye!');
    },
    // Called when a WebSocket connection is closed
    close(ws, code, message) {
      console.log('WebSocket closed');
    },
  },
});
```
