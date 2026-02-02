const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let users = new Map();

io.on('connection', (socket) => {
    socket.on('online', (username) => {
        socket.username = username;
        users.set(username, socket.id);
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Broke Server 2026 Ready'));
