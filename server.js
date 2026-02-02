const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let onlineUsers = {};

io.on('connection', (socket) => {
    socket.on('online', (username) => {
        onlineUsers[username] = socket.id;
        console.log(`${username} в сети`);
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
http.listen(PORT, () => console.log(`Broke Server запущен на порту ${PORT}`));