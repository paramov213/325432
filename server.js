const express = require('express');const http = require('http');const { Server } = require('socket.io');const path = require('path');const app = express();const server = http.createServer(app);const io = new Server(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });const users = {};

io.on('connection', (socket) => {

socket.on('online', (username) => {

socket.username = username;

users[username] = socket.id;

socket.broadcast.emit('user_status', { username, status: 'online' });

});

socket.on('typing', (data) => {

if (users[data.to]) { io.to(users[data.to]).emit('display_typing', { from: data.from }); }

});

socket.on('update_profile_broadcast', (userData) => {

socket.broadcast.emit('user_profile_updated', userData);

});

socket.on('private_msg', (data) => {

if (users[data.to]) { io.to(users[data.to]).emit('receive_msg', data); }

});

socket.on('disconnect', () => {

if (socket.username) {

delete users[socket.username];

socket.broadcast.emit('user_status', { username: socket.username, status: 'offline' });

}

});

});

server.listen(3000, () => { console.log('Broke Pro Max: http://localhost:3000'); });
