const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Указываем путь к статике явно
const publicPath = path.join(__dirname);
app.use(express.static(publicPath));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// ЛОВУШКА ДЛЯ NOT FOUND: если любой другой путь — отдаем index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

let onlineUsers = {};

io.on('connection', (socket) => {
    socket.on('online', (username) => {
        onlineUsers[username] = socket.id;
        console.log(`User ${username} connected`);
    });

    socket.on('private_msg', (data) => {
        const targetSid = onlineUsers[data.to];
        if (targetSid) {
            io.to(targetSid).emit('receive_msg', data);
        }
    });

    socket.on('disconnect', () => {
        for (let user in onlineUsers) {
            if (onlineUsers[user] === socket.id) delete onlineUsers[user];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Broke Messenger server is running on port ${PORT}`);
});
