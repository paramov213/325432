const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

const USERS_FILE = './users.json';
const MSGS_FILE = './messages.json';

let users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];
let messages = fs.existsSync(MSGS_FILE) ? JSON.parse(fs.readFileSync(MSGS_FILE)) : [];

io.on('connection', (socket) => {
    socket.on('request_sync', (username) => {
        socket.emit('sync_data', { history: users, messages: messages.filter(m => m.from === username || m.to === username) });
    });

    socket.on('update_profile_broadcast', (userData) => {
        const idx = users.findIndex(u => u.username === userData.username);
        if (idx !== -1) users[idx] = userData; else users.push(userData);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users));
        io.emit('sync_data', { history: users, messages: [] });
    });

    socket.on('adm_give_nft', (data) => {
        const u = users.find(u => u.username === data.username);
        if(u) { u.nfts.push(data.nft); fs.writeFileSync(USERS_FILE, JSON.stringify(users)); io.emit('sync_data', { history: users, messages: [] }); }
    });

    socket.on('adm_delete_user', (username) => {
        users = users.filter(u => u.username !== username);
        messages = messages.filter(m => m.from !== username && m.to !== username);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users));
        io.emit('user_deleted', username);
    });

    socket.on('private_msg', (data) => {
        messages.push(data);
        fs.writeFileSync(MSGS_FILE, JSON.stringify(messages));
        io.emit('receive_msg', data);
    });

    socket.on('typing', (d) => socket.broadcast.emit('display_typing', d));
});

http.listen(3000, () => console.log('Server OK'));
