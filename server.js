const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const ROOT = path.resolve(__dirname);
app.use(express.static(ROOT));

app.get('*', (req, res) => {
    res.sendFile(path.join(ROOT, 'index.html'));
});

let onlineUsers = {}; // username -> socketId

io.on('connection', (socket) => {
    socket.on('online', (username) => {
        onlineUsers[username] = socket.id;
    });

    socket.on('private_msg', (data) => {
        const targetSid = onlineUsers[data.to];
        if (targetSid) io.to(targetSid).emit('receive_msg', data);
    });

    socket.on('disconnect', () => {
        for (let user in onlineUsers) {
            if (onlineUsers[user] === socket.id) delete onlineUsers[user];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Broke Pro running on ${PORT}`));
