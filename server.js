const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  // Listen for a new user connecting
  socket.on('user connected', (clientId) => {
    socket.clientId = clientId;
    console.log(clientId + ' connected');
    // Welcome the new user
    socket.emit('welcome', clientId);
    // Notify all other clients that a new user has joined
    socket.broadcast.emit('user joined', clientId);
  });

  socket.on('disconnect', () => {
    if (socket.clientId) {
      console.log(socket.clientId + ' disconnected');
      // Notify all clients that a user has left
      io.emit('user left', socket.clientId);
    }
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

server.listen(8080, () => {
  console.log('listening on *:8080');
});