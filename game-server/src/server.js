const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { LobbyManager, CharacterManager, BallManager } = require('./managers');
const cors = require('cors');

const app = express();
app.subscribe(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

app.use(express.static('public'));

// Initialize managers for lobby, character, and ball handling
const lobbyManager = new LobbyManager(io);
const characterManager = new CharacterManager(io);
const ballManager = new BallManager(io);

// Setup Socket.io event handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle player joining the lobby
    socket.on('joinLobby', (data) => lobbyManager.handleJoinLobby(socket, data));

    // Handle character state updates
    socket.on('updateCharacter', (data) => characterManager.handleUpdateCharacter(socket, data));

    // Handle ball throwing
    socket.on('throwBall', (data) => ballManager.handleThrowBall(socket, data));

    // Handle ball catching
    socket.on('ballCaught', (data) => ballManager.handleBallCaught(socket, data));

    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        lobbyManager.handleDisconnect(socket);
        characterManager.handleDisconnect(socket);
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
