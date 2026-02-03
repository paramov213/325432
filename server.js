const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Раздача файлов
app.use(express.static(__dirname));

// Хранилище онлайн-статусов
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Когда юзер заходит в сеть
    socket.on('online', (username) => {
        if (!username) return;
        socket.username = username;
        onlineUsers.set(username, socket.id);
        
        // Оповещаем всех, что юзер в сети
        io.emit('user_status', { username: username, status: 'online' });
    });

    // Личные сообщения
    socket.on('private_msg', (data) => {
        const targetSocketId = onlineUsers.get(data.to);
        if (targetSocketId) {
            // Отправляем конкретному получателю
            io.to(targetSocketId).emit('receive_msg', data);
        }
        // Если это системный бот, сервер может логировать или обрабатывать это тут
    });

    // Индикатор печати
    socket.on('typing', (data) => {
        const targetSocketId = onlineUsers.get(data.to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('display_typing', { from: data.from });
        }
    });

    // Обновление профиля (рассылка всем)
    socket.on('update_profile_broadcast', (userData) => {
        // Рассылаем обновленные данные всем клиентам, чтобы у них обновилась история
        socket.broadcast.emit('user_profile_updated', userData);
    });

    // Отключение
    socket.on('disconnect', () => {
        if (socket.username) {
            onlineUsers.delete(socket.username);
            io.emit('user_status', { username: socket.username, status: 'offline' });
            console.log(`User ${socket.username} disconnected`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
    ======================================
    🚀 Broke Pro Max Server Started!
    📍 Port: ${PORT}
    🛠 Status: Working Perfectly
    ======================================
    `);
});
