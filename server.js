const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { GoogleGenerAI } = require("@google/generative-ai");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Настройка Gemini AI
const genAI = new GoogleGenerAI("ТВОЙ_КЛЮЧ_GEMINI");
const model = genAI.getGenerativeModel({ 
    model: "gemini-pro",
    systemInstruction: "You are a witty friend on TeleClone. Keep responses short (2-3 sentences), use emojis, be informal."
});

let onlineUsers = new Set();
let bannedIPs = new Set();

io.on('connection', (socket) => {
    const userIP = socket.handshake.address;
    if (bannedIPs.has(userIP)) return socket.disconnect();

    socket.on('online', (username) => {
        socket.username = username;
        onlineUsers.add(username);
        io.emit('user_status', { username, status: 'online' });
    });

    socket.on('private_msg', async (data) => {
        // Если сообщение для бота Gemini
        if (data.to === '@gemini_bot') {
            io.emit('typing', { from: '@gemini_bot', to: data.from });
            try {
                const result = await model.generateContent(data.text);
                const response = await result.response;
                socket.emit('receive_msg', {
                    from: '@gemini_bot',
                    text: response.text(),
                    time: Date.now()
                });
            } catch (e) {
                socket.emit('receive_msg', { from: '@gemini_bot', text: "Упс, нейросеть устала. 😴" });
            }
        } else {
            socket.broadcast.emit('receive_msg', data);
        }
    });

    // АДМИН-ФУНКЦИИ ИЗ BROKE PRO
    socket.on('adm_kick_request', (target) => {
        io.emit('kick_signal', target.toLowerCase());
    });

    socket.on('adm_ban_ip', (target) => {
        bannedIPs.add(userIP); // В реальном кейсе нужно искать IP по нику
        io.emit('kick_signal', target.toLowerCase());
    });

    socket.on('update_profile_broadcast', (data) => {
        socket.broadcast.emit('user_profile_updated', data);
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            onlineUsers.delete(socket.username);
            io.emit('user_status', { username: socket.username, status: 'offline' });
        }
    });
});

server.listen(3000, () => console.log('TeleClone Server running on port 3000'));
