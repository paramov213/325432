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
        // Принудительно подписываем сокет на комнату с именем пользователя
        socket.join(username);
    });

    socket.on('private_msg', (data) => {
        // Отправляем получателю
        io.to(data.to).emit('receive_msg', data);
        // Отправляем отправителю (чтобы оба видели)
        io.to(data.from).emit('receive_msg', data);
    });

    socket.on('typing', (data) => {
        io.to(data.to).emit('is_typing', data);
    });

    socket.on('disconnect', () => {
        if (socket.username) users.delete(socket.username);
    });
});

server.listen(3000, () => console.log('Broke Server 2026 Ready'));
