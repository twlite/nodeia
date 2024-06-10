# Nodeia

Nodeia is a simplified networking api for Node. It is based on [Bun.serve](https://bun.sh/docs/api/http) api and is designed to be easy to use and understand.

> **Note:** Nodeia is still in development and is not yet ready for production use. You can help by testing it and reporting any issues you find.

## Installation

```sh
npm install nodeia
```

## Current features

- ✅ HTTP server
- ✅ WebSocket server
- ✅ TCP server
- ✅ TCP client
- ❌ UDP server (todo)
- ❌ UDP client (todo)

## Usage

### Simple HTTP server with WebSocket support

Here is an example of a simple HTTP server that responds with "Hello, world!" to all requests. It also supports WebSocket connections.

By default, Nodeia listens on `0.0.0.0` and port `3000`. You can change this by passing the `hostname` and `port` options to the `serve` function. If the port given is already in use, Nodeia will use a random port. You can also manually pass port `0` to let the OS choose a random port.

```js
import Nodeia from 'nodeia';

Nodeia.serve({
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

### Simple TCP server

Here is an example of a simple TCP server that responds with "Hello, world!" to all connections.

```js
import Nodeia from 'nodeia';

Nodeia.listen({
  port: 8080,
  hostname: 'localhost',
  socket: {
    open(socket) {
      console.log('Socket opened');
      socket.write('Hello, world!\n');
    },
    close(socket) {
      console.log('Socket closed');
    },
    data(socket, data) {
      const msg = String(data);
      console.log('Socket sent a data:', msg);

      if (msg === 'close') socket.end();
    },
    drain(socket) {
      console.log('Socket drained');
    },
    error(socket, err) {
      console.error('Socket error:', err);
    },
  },
});
```

### Simple TCP client

Here is an example of a simple TCP client that connects to a TCP server and sends a message.

```js
import Nodeia from 'nodeia';

Nodeia.connect({
  hostname: 'localhost',
  port: 3000,
  socket: {
    data(socket, data) {
      console.log('Server sent data:', String(data));

      if (String(data) === 'Hello, world!') socket.write('close');
    },
    open(socket) {
      console.log('Connection opened');
    },
    close(socket) {
      console.log('Connection closed');
    },
    drain(socket) {},
    error(socket, error) {},

    // client-specific handlers
    connectError(socket, error) {}, // connection failed
    end(socket) {}, // connection closed by server
    timeout(socket) {}, // connection timed out
  },
});
```
