const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

// Файлы "базы данных"
const USERS_FILE = './users.json';
const MSGS_FILE = './messages.json';

// Загрузка данных при старте
let users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];
let messages = fs.existsSync(MSGS_FILE) ? JSON.parse(fs.readFileSync(MSGS_FILE)) : [];

io.on('connection', (socket) => {
    // Синхронизация данных при входе
    socket.on('request_sync', (username) => {
        socket.emit('sync_data', {
            history: users,
            messages: messages.filter(m => m.from === username || m.to === username)
        });
    });

    // Регистрация/Обновление профиля
    socket.on('update_profile_broadcast', (userData) => {
        const idx = users.findIndex(u => u.username === userData.username);
        if (idx !== -1) users[idx] = userData;
        else users.push(userData);
        
        fs.writeFileSync(USERS_FILE, JSON.stringify(users));
        io.emit('user_profile_updated', userData);
    });

    // Личные сообщения
    socket.on('private_msg', (data) => {
        messages.push(data);
        fs.writeFileSync(MSGS_FILE, JSON.stringify(messages));
        socket.broadcast.emit('receive_msg', data);
    });

    socket.on('typing', (data) => socket.broadcast.emit('display_typing', data));
});

http.listen(3000, () => console.log('Сервер запущен на порту 3000'));
