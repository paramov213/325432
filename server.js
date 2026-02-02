const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path');

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname)));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Логика чата
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
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
