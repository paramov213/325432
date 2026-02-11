const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

// Файлы для хранения базы данных
const USERS_FILE = './users.json';
const MSGS_FILE = './messages.json';

// Загрузка данных при запуске
let users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];
let messages = fs.existsSync(MSGS_FILE) ? JSON.parse(fs.readFileSync(MSGS_FILE)) : [];

// Раздача твоего HTML файла
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Логика сокетов
io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);

    // 1. Обработка статуса "В сети"
    socket.on('online', (username) => {
        socket.username = username;
        // Сообщаем всем, что этот юзер теперь онлайн
        io.emit('user_status', { username: username, status: 'online' });
        
        // При входе отправляем юзеру актуальную историю (опционально, так как у тебя есть localStorage)
        // Но полезно для синхронизации, если localStorage очищен
        socket.emit('sync_data', { history: users, messages: messages });
    });

    // 2. Личные сообщения
    socket.on('private_msg', (data) => {
        messages.push(data);
        fs.writeFileSync(MSGS_FILE, JSON.stringify(messages)); // Сохраняем на диск
        io.emit('receive_msg', data); // Отправляем получателю (фильтрация идет на клиенте)
    });

    // 3. Индикатор печати
    socket.on('typing', (data) => {
        socket.broadcast.emit('display_typing', data);
    });

    // 4. Обновление профиля (Смена авы, выдача NFT и т.д.)
    socket.on('update_profile_broadcast', (userData) => {
        // Ищем юзера в базе и обновляем
        const idx = users.findIndex(u => u.username === userData.username);
        if (idx !== -1) {
            users[idx] = userData;
        } else {
            users.push(userData);
        }
        
        fs.writeFileSync(USERS_FILE, JSON.stringify(users)); // Сохраняем базу юзеров
        io.emit('user_profile_updated', userData); // Рассылаем всем новый профиль
    });

    // 5. Удаление пользователя (Админка)
    socket.on('adm_delete_user', (username) => {
        users = users.filter(u => u.username !== username);
        messages = messages.filter(m => m.from !== username && m.to !== username);
        
        fs.writeFileSync(USERS_FILE, JSON.stringify(users));
        fs.writeFileSync(MSGS_FILE, JSON.stringify(messages));
        
        // Отправляем сигнал клиентам, чтобы удалить его из списков
        io.emit('user_deleted', username); 
    });

    // 6. Отключение
    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('user_status', { username: socket.username, status: 'offline' });
        }
    });
});

// --- АНТИ-СОН (Чтобы сервер жил вечно) ---
// Если используешь Render/Glitch, раскомментируй строки ниже и установи axios (npm install axios)
/*
const axios = require('axios');
setInterval(() => {
   axios.get('https://ТВОЙ-ПРОЕКТ.onrender.com')
   .then(() => console.log('Пинг успешный'))
   .catch(err => console.log('Пинг ошибка'));
}, 600000); // каждые 10 минут
*/

// Запуск сервера
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер Broke Pro Max запущен на порту ${PORT}`);
});
