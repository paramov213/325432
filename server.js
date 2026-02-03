const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e7 });

app.use(express.static(__dirname));

const USERS_FILE = 'users.json';
const BANS_FILE = 'bans.json';

let usersDb = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];
let banList = fs.existsSync(BANS_FILE) ? JSON.parse(fs.readFileSync(BANS_FILE)) : [];

io.on('connection', (socket) => {
    const ip = socket.handshake.address;
    if (banList.includes(ip)) return socket.disconnect();

    socket.on('online', (u) => {
        socket.username = u;
        socket.join(u);
        if (!usersDb.find(user => user.username === u)) {
            usersDb.push({ username: u, firstSeen: new Date().toLocaleString(), ip: ip });
            fs.writeFileSync(USERS_FILE, JSON.stringify(usersDb, null, 2));
        }
        io.emit('user_status', { username: u, status: 'online' });
    });

    socket.on('get_admin_stats', () => { socket.emit('receive_admin_stats', usersDb); });
    socket.on('private_msg', (d) => io.to(d.to).emit('receive_msg', d));
    socket.on('typing', (d) => io.to(d.to).emit('display_typing', { from: d.from }));
    socket.on('delete_msg', (d) => io.to(d.to).emit('msg_deleted', d.id));
    socket.on('add_reaction', (d) => io.to(d.to).emit('update_reaction', d));
    socket.on('update_profile_broadcast', (userData) => {
        // Синхронизация профиля в глобальной базе
        const idx = usersDb.findIndex(u => u.username === userData.username);
        if(idx !== -1) usersDb[idx] = {...usersDb[idx], ...userData};
        socket.broadcast.emit('user_profile_updated', userData);
    });

    socket.on('adm_kick_request', (u) => io.emit('kick_signal', u.toLowerCase()));
    socket.on('adm_ban_ip', (u) => {
        const target = usersDb.find(user => user.username === u);
        if(target && !banList.includes(target.ip)) {
            banList.push(target.ip);
            fs.writeFileSync(BANS_FILE, JSON.stringify(banList));
        }
        io.emit('kick_signal', u.toLowerCase());
    });

    socket.on('disconnect', () => {
        if (socket.username) io.emit('user_status', { username: socket.username, status: 'offline' });
    });
});

server.listen(3000, () => console.log('Broke Pro Max: FULL VERSION'));
