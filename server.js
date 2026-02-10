const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path'); // Добавлено

// Раздача статических файлов (твоего HTML)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Файлы "базы данных"
const USERS_FILE = './users.json';
const MSGS_FILE = './messages.json';

let users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];
let messages = fs.existsSync(MSGS_FILE) ? JSON.parse(fs.readFileSync(MSGS_FILE)) : [];

io.on('connection', (socket) => {
    socket.on('request_sync', (username) => {
        socket.emit('sync_data', {
            history: users,
            messages: messages.filter(m => m.from === username || m.to === username)
        });
    });

    socket.on('update_profile_broadcast', (userData) => {
        const idx = users.findIndex(u => u.username === userData.username);
        if (idx !== -1) users[idx] = userData;
        else users.push(userData);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users));
        io.emit('user_profile_updated', userData);
    });

    socket.on('private_msg', (data) => {
        messages.push(data);
        fs.writeFileSync(MSGS_FILE, JSON.stringify(messages));
        io.emit('receive_msg', data); // Отправляем всем, клиент сам отфильтрует
    });

    socket.on('typing', (data) => socket.broadcast.emit('display_typing', data));
});

http.listen(3000, () => console.log('Сервер: http://localhost:3000'));
