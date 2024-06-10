import Nodeia from '../../src/index.ts';

const tcp = Nodeia.listen({
  port: 8080,
  listening(hostname, port, server) {
    console.log(`Listening on ${server.url}`);
    client();
  },
  socket: {
    open(socket) {
      console.log('Socket opened');
    },
    close(socket) {
      console.log('Socket closed');
    },
    data(socket, data) {
      const msg = String(data);
      console.log('Socket data:', msg);
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

function client() {
  Nodeia.connect({
    hostname: tcp.hostname,
    port: tcp.port,
    socket: {
      data(socket, data) {
        console.log('Client data:', String(data));
      },
      open(socket) {
        console.log('Client opened');
        socket.write('Hello, world!');
        setTimeout(() => socket.write('close'), 1500);
      },
      close(socket) {
        console.log('Client closed');
      },
      drain(socket) {},
      error(socket, error) {},

      // client-specific handlers
      connectError(socket, error) {}, // connection failed
      end(socket) {
        console.log('Client ended');
      }, // connection closed by server
      timeout(socket) {}, // connection timed out
    },
  });
}
