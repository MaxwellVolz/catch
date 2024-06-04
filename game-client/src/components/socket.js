// src/components/socket.js
import { updateBallPositionById, createBallForUser } from './scene.js';

const SOCKET_URL = 'ws://localhost:3000';
let socket;

export function connectWebSocket() {
    socket = new WebSocket(SOCKET_URL);

    socket.addEventListener('open', () => {
        console.log('Connected to WebSocket server');
        socket.send(JSON.stringify({ type: 'join' }));
    });

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'init') {
            console.log('Initial users and positions:', data.users);
            data.users.forEach(user => {
                updateBallPositionById(user.id, user.position);
            });
        } else if (data.type === 'lobby') {
            console.log('Current users in the lobby:', data.users);
        } else if (data.type === 'message') {
            console.log(`Message from ${data.from}: ${data.content}`);
        } else if (data.type === 'updatePosition') {
            updateBallPositionById(data.id, data.position);
        } else if (data.type === 'newUser') {
            console.log(`New user joined: ${data.user.id}`);
            createBallForUser(data.user.id, data.user.position);
        }
    });

    socket.addEventListener('close', () => {
        console.log('Disconnected from WebSocket server');
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
    });
}

export function updateBallPosition(position) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'updatePosition', position }));
    }
}
