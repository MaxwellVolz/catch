const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Serve static files from the 'dist' directory of game-client
app.use(express.static(path.join(__dirname, '..', 'game-client', 'dist')));

let players = {};

io.on('connection', (socket) => {
    console.log('a user connected: ', socket.id);

    // Add new player to the players object
    players[socket.id] = {
        playerId: socket.id,
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
    };

    // Send the current players to the new player
    socket.emit('currentPlayers', players);

    // Notify existing players about the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Handle player movement
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            // Notify all players about the movement
            io.emit('playerMoved', players[socket.id]);
        }
    });

    // Handle player disconnect
    socket.on('disconnect', () => {
        console.log('user disconnected: ', socket.id);
        // Remove player from players object
        delete players[socket.id];
        // Notify all players about the disconnected player
        io.emit('playerDisconnected', socket.id);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
