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

let players = {};
let balls = {};

io.on('connection', (socket) => {
    console.log('A player connected: ' + socket.id);

    socket.on('playerUpdate', (data) => {
        if (!data || !data.id || !data.position) {
            console.error('Invalid player update data received:', data);
            return;
        }

        players[socket.id] = data;
        io.emit('playerUpdate', Object.values(players));
    });

    socket.on('ballThrown', (data) => {
        if (!data || !data.id || !data.position || !data.rotation || !data.velocity) {
            console.error('Invalid ball thrown data received:', data);
            return;
        }

        balls[data.id] = data;
        io.emit('ballThrown', data);
    });

    socket.on('ballRemoved', (data) => {
        if (!data || !data.id) {
            console.error('Invalid ball removed data received:', data);
            return;
        }

        delete balls[data.id];
        io.emit('ballRemoved', data);
    });

    socket.on('catchUpdate', (data) => {
        if (!data || !data.catcherId || !data.catchCount) {
            console.error('Invalid catch update data received:', data);
            return;
        }

        if (players[data.catcherId]) {
            players[data.catcherId].catchCount = data.catchCount;
            io.emit('catchUpdate', data);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        console.log(`Player disconnected: ${socket.id}`);
        io.emit('playerDisconnected', { id: socket.id });
        io.emit('playerUpdate', Object.values(players));
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
