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

let onlineUsers = {};

io.on('connection', (socket) => {
    socket.on('online', (username) => {
        onlineUsers[username] = socket.id;
        console.log(`User ${username} is now online`);
    });

    socket.on('private_msg', (data) => {
        const targetSid = onlineUsers[data.to];
        // Отправка получателю
        if (targetSid) {
            io.to(targetSid).emit('receive_msg', data);
        }
        // Отправка отправителю для синхронизации интерфейса
        socket.emit('receive_msg', data); 
    });

    socket.on('disconnect', () => {
        for (let user in onlineUsers) {
            if (onlineUsers[user] === socket.id) delete onlineUsers[user];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Broke Server Started'));
