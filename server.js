const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let bannedIPs = new Set();

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    const clientIP = socket.handshake.address;
    if (bannedIPs.has(clientIP)) return socket.disconnect();

    socket.on('online', (username) => {
        socket.username = username;
        io.emit('user_status', { username, status: 'online' });
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('user_typing', data);
    });

    socket.on('private_msg', (data) => {
        socket.broadcast.emit('receive_msg', data);
    });

    // Новое: Редактирование сообщения
    socket.on('edit_msg', (data) => {
        socket.broadcast.emit('msg_edited', data);
    });

    // Новое: Удаление сообщения
    socket.on('delete_msg', (data) => {
        socket.broadcast.emit('msg_deleted', data);
    });

    socket.on('update_profile_broadcast', (userData) => {
        socket.broadcast.emit('user_profile_updated', userData);
    });

    socket.on('adm_kick_request', (target) => {
        io.emit('kick_signal', target.toLowerCase());
    });

    socket.on('adm_ban_ip', (target) => {
        bannedIPs.add(clientIP); 
        io.emit('kick_signal', target.toLowerCase());
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('user_status', { username: socket.username, status: 'offline' });
        }
    });
});

server.listen(3000, () => console.log(`TeleClone Ultimate: 3000`));
