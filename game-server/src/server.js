const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    }
});

let players = [];
let balls = [];

io.on('connection', (socket) => {
    console.log('A player connected');

    socket.on('playerUpdate', (data) => {
        const existingPlayer = players.find(player => player.id === data.id);
        if (existingPlayer) {
            existingPlayer.position = data.position;
        } else {
            players.push(data);
        }

        io.emit('playerUpdate', players);
    });

    socket.on('ballThrown', (data) => {
        console.log('Received ballThrown event:', data);
        balls.push(data);
        io.emit('ballThrown', data);
    });

    socket.on('ballRemoved', (data) => {
        console.log('Received ballRemoved event:', data);
        balls = balls.filter(ball => ball.id !== data.id);
        io.emit('ballRemoved', data);
    });

    socket.on('disconnect', () => {
        console.log('A player disconnected');
        players = players.filter(player => player.id !== socket.id);
        io.emit('playerUpdate', players);
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
