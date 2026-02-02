const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" },
    pingTimeout: 60000 
});

app.use(express.static(__dirname));

let users = new Map();

io.on('connection', (socket) => {
    socket.on('online', (username) => {
        socket.username = username;
        users.set(username, socket.id);
        socket.join(username);
    });

    socket.on('private_msg', (data) => {
        io.to(data.to).emit('receive_msg', data);
        io.to(data.from).emit('receive_msg', data);
    });

    socket.on('typing', (data) => {
        io.to(data.to).emit('is_typing', data);
    });

    socket.on('disconnect', () => {
        if (socket.username) users.delete(socket.username);
    });
});

// Хостинг сам назначит PORT через process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Broke Server is running on port ${PORT}`);
});
