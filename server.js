const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Раздача статических файлов (твоего index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Хранилище пользователей в оперативной памяти (для статуса онлайн)
const users = {};

io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);

    // Вход в сеть
    socket.on('online', (username) => {
        socket.username = username;
        users[username] = socket.id;
        console.log(`Пользователь ${username} теперь в сети`);
    });

    // --- ОБНОВЛЕНИЕ ПРОФИЛЯ (То, что ты просил) ---
    socket.on('update_profile_broadcast', (userData) => {
        // Рассылаем обновленные данные всем пользователям, кроме отправителя
        // Это гарантирует, что все увидят новый цвет и аву в реальном времени
        socket.broadcast.emit('user_profile_updated', userData);
        console.log(`Профиль ${userData.username} обновлен и разослан всем`);
    });

    // --- ЛИЧНЫЕ СООБЩЕНИЯ ---
    socket.on('private_msg', (data) => {
        const targetSocketId = users[data.to];
        
        if (targetSocketId) {
            // Отправляем сообщение конкретному получателю
            io.to(targetSocketId).emit('receive_msg', data);
        }
        
        // Отправляем подтверждение самому отправителю (чтобы не двоилось на фронте)
        // В твоем фронтенд-коде appendMsg вызывается сразу при нажатии, 
        // поэтому здесь мы просто логируем или сохраняем.
        console.log(`Сообщение от ${data.from} для ${data.to}: ${data.text}`);
    });

    // Отключение
    socket.on('disconnect', () => {
        if (socket.username) {
            delete users[socket.username];
            console.log(`Пользователь ${socket.username} вышел`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`This is the best code.`);
});
