const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const app = express();
const server = http.createServer(app);

// Настройка Socket.io с увеличенным лимитом для передачи фото/аудио
const io = new Server(server, { 
    maxHttpBufferSize: 1e7 // 10MB
});

app.use(express.static(__dirname));

// Пути к файлам базы данных
const USERS_FILE = 'users.json';
const BANS_FILE = 'bans.json';

// Инициализация файлов, если они отсутствуют
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(BANS_FILE)) fs.writeFileSync(BANS_FILE, JSON.stringify([]));

// Загрузка данных в память
let usersDb = JSON.parse(fs.readFileSync(USERS_FILE));
let banList = JSON.parse(fs.readFileSync(BANS_FILE));

io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;

    // Проверка на бан по IP
    if (banList.includes(clientIp)) {
        console.log(`[БАН] Попытка входа с заблокированного IP: ${clientIp}`);
        return socket.disconnect();
    }

    // Обработка входа пользователя (Online)
    socket.on('online', (username) => {
        socket.username = username;
        socket.join(username);
        
        // Регистрация в базе данных
        const existingUser = usersDb.find(u => u.username === username);
        if (!existingUser) {
            usersDb.push({ 
                username: username, 
                ip: clientIp, 
                firstSeen: new Date().toLocaleString() 
            });
            fs.writeFileSync(USERS_FILE, JSON.stringify(usersDb, null, 2));
        }
        
        // Оповещаем всех, что юзер в сети
        io.emit('user_status', { username: username, status: 'online' });
        console.log(`[ONLINE] ${username} подключился`);
    });

    // --- ФУНКЦИИ МЕССЕНДЖЕРА ---

    // Личные сообщения (текст, фото, голос)
    socket.on('private_msg', (data) => {
        io.to(data.to).emit('receive_msg', data);
    });

    // Статус "печатает..."
    socket.on('typing', (data) => {
        io.to(data.to).emit('display_typing', { from: data.from });
    });

    // Реакции (лайки)
    socket.on('add_reaction', (data) => {
        io.to(data.to).emit('update_reaction', data);
    });

    // Удаление сообщения
    socket.on('delete_msg', (data) => {
        io.to(data.to).emit('msg_deleted', data.id);
    });

    // Глобальное обновление профиля (смена авы, ника, NFT)
    socket.on('update_profile_broadcast', (userData) => {
        // Обновляем данные в локальной базе сервера
        const idx = usersDb.findIndex(u => u.username === userData.username);
        if (idx !== -1) {
            usersDb[idx] = { ...usersDb[idx], ...userData };
            fs.writeFileSync(USERS_FILE, JSON.stringify(usersDb, null, 2));
        }
        // Рассылаем всем обновленные данные профиля
        socket.broadcast.emit('user_profile_updated', userData);
    });

    // --- АДМИН ПАНЕЛЬ ---

    // Запрос списка всех пользователей для админа
    socket.on('get_admin_stats', () => {
        // Отправляем всю базу (можно добавить проверку на админа по socket.username)
        socket.emit('receive_admin_stats', usersDb);
    });

    // Снести аккаунт (Кик)
    socket.on('adm_kick_request', (targetUser) => {
        console.log(`[ADMIN] Кик пользователя: ${targetUser}`);
        io.emit('kick_signal', targetUser.toLowerCase());
    });

    // Полный бан по IP
    socket.on('adm_ban_ip', (targetUser) => {
        const target = usersDb.find(u => u.username === targetUser.toLowerCase());
        if (target && !banList.includes(target.ip)) {
            banList.push(target.ip);
            fs.writeFileSync(BANS_FILE, JSON.stringify(banList, null, 2));
            console.log(`[ADMIN] IP забанен: ${target.ip} (${targetUser})`);
        }
        io.emit('kick_signal', targetUser.toLowerCase());
    });

    // Обработка отключения
    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('user_status', { username: socket.username, status: 'offline' });
            console.log(`[OFFLINE] ${socket.username} вышел`);
        }
    });
});

// Запуск сервера
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`
    ======================================
    🚀 Broke Pro Max Server запущен!
    📍 Адрес: http://localhost:${PORT}
    🛠 Статус: Админ-панель активна
    ======================================
    `);
});
