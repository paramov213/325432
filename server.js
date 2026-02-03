const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// База забаненных IP (сохраняется в файл)
let banList = [];
const BAN_FILE = 'bans.json';
if (fs.existsSync(BAN_FILE)) {
    try { banList = JSON.parse(fs.readFileSync(BAN_FILE)); } catch (e) { banList = []; }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Хранилище активных сессий (Username -> {SocketID, IP})
const activeSessions = {}; 

io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;

    // Мгновенная проверка на бан при входе
    if (banList.includes(clientIp)) {
        socket.emit('banned_permanently');
        socket.disconnect();
        return;
    }

    socket.on('online', (username) => {
        socket.username = username;
        activeSessions[username] = { id: socket.id, ip: clientIp };
        io.emit('user_status', { username, status: 'online' });
    });

    socket.on('private_msg', (data) => {
        if (activeSessions[data.to]) {
            io.to(activeSessions[data.to].id).emit('receive_msg', data);
        }
    });

    socket.on('typing', (data) => {
        if (activeSessions[data.to]) {
            io.to(activeSessions[data.to].id).emit('display_typing', { from: data.from });
        }
    });

    socket.on('update_profile_broadcast', (userData) => {
        socket.broadcast.emit('user_profile_updated', userData);
    });

    // АДМИН-ЛОГИКА: СНОС И БАН
    socket.on('adm_kick_request', (targetUser) => {
        io.emit('kick_signal', targetUser.toLowerCase());
    });

    socket.on('adm_ban_ip', (targetUser) => {
        const session = activeSessions[targetUser];
        if (session) {
            const ip = session.ip;
            if (!banList.includes(ip)) {
                banList.push(ip);
                fs.writeFileSync(BAN_FILE, JSON.stringify(banList));
                console.log(`[BAN] IP заблокирован: ${ip} (User: ${targetUser})`);
            }
            io.emit('kick_signal', targetUser.toLowerCase());
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            delete activeSessions[socket.username];
            io.emit('user_status', { username: socket.username, status: 'offline' });
        }
    });
});

server.listen(3000, () => {
    console.log('--- Broke Pro Max Server Started ---');
    console.log('Адрес: http://localhost:3000');
});
