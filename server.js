const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

let users = new Map();

io.on('connection', (socket) => {
    socket.on('online', (username) => {
        socket.username = username;
        users.set(username, socket.id);
        console.log(`User ${username} connected`);
    });

    socket.on('private_msg', (data) => {
        const targetSid = users.get(data.to);
        if (targetSid) io.to(targetSid).emit('receive_msg', data);
        socket.emit('receive_msg', data); 
    });

    socket.on('typing', (data) => {
        const targetSid = users.get(data.to);
        if (targetSid) io.to(targetSid).emit('is_typing', data);
    });

    socket.on('disconnect', () => {
        if (socket.username) users.delete(socket.username);
    });
});

server.listen(3000, () => console.log('Broke Server 2026 Ready'));
