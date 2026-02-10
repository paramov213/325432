const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

const USERS_FILE = './users.json';
const MSGS_FILE = './messages.json';

// Загрузка данных
let users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];
let messages = fs.existsSync(MSGS_FILE) ? JSON.parse(fs.readFileSync(MSGS_FILE)) : [];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    // Синхронизация
    socket.on('request_sync', (username) => {
        socket.emit('sync_data', {
            history: users,
            messages: messages.filter(m => m.from === username || m.to === username)
        });
    });

    // Обновление профиля
    socket.on('update_profile_broadcast', (userData) => {
        const idx = users.findIndex(u => u.username === userData.username);
        if (idx !== -1) users[idx] = userData;
        else users.push(userData);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users));
        io.emit('sync_data', { history: users, messages: [] }); 
    });

    // Личные сообщения
    socket.on('private_msg', (data) => {
        messages.push(data);
        fs.writeFileSync(MSGS_FILE, JSON.stringify(messages));
        io.emit('receive_msg', data);
    });

    // ИСПРАВЛЕННОЕ УДАЛЕНИЕ (Серверная часть)
    socket.on('adm_delete_user', (username) => {
        users = users.filter(u => u.username !== username);
        messages = messages.filter(m => m.from !== username && m.to !== username);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users));
        fs.writeFileSync(MSGS_FILE, JSON.stringify(messages));
        io.emit('user_deleted', username); // Сигнал всем клиентам
    });

    socket.on('typing', (data) => socket.broadcast.emit('display_typing', data));
});

http.listen(3000, () => console.log('Сервер запущен: http://localhost:3000'));
