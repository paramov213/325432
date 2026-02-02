const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Раздаем файлы прямо из текущей папки
app.use(express.static(__dirname));

// При заходе на главную страницу отдаем index.html из корня
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Хранилище активных соединений
const users = {};

io.on('connection', (socket) => {
    console.log('Подключен новый клиент:', socket.id);

    // Вход пользователя в сеть
    socket.on('online', (username) => {
        socket.username = username;
        users[username] = socket.id;
        console.log(`@${username} в сети`);
    });

    // Рассылка обновлений профиля (аватар, цвет, описание) другим пользователям
    socket.on('update_profile_broadcast', (userData) => {
        // Пересылаем данные всем, кроме отправителя
        socket.broadcast.emit('user_profile_updated', userData);
        console.log(`Профиль ${userData.username} обновлен для всех`);
    });

    // Личные сообщения
    socket.on('private_msg', (data) => {
        const targetSocketId = users[data.to];
        if (targetSocketId) {
            // Отправляем сообщение только конкретному получателю
            io.to(targetSocketId).emit('receive_msg', data);
        }
        console.log(`[Чат] ${data.from} -> ${data.to}: ${data.text}`);
    });

    // Обработка отключения
    socket.on('disconnect', () => {
        if (socket.username) {
            delete users[socket.username];
            console.log(`@${socket.username} вышел из сети`);
        }
    });
});

// Запуск сервера на порту 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`=============================`);
    console.log(`Broke Pro Max Server started!`);
    console.log(`Ссылка: http://localhost:${PORT}`);
    console.log(`Файлы должны быть в одной папке.`);
    console.log(`=============================`);
});
