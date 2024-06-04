// src/components/socket.js
import { updateDudePositionById, createDudeForUser } from './scene.js';

const SOCKET_URL = 'ws://localhost:3000';
let socket;
let userId = null;

export function connectWebSocket() {
    socket = new WebSocket(SOCKET_URL);

    socket.addEventListener('open', () => {
        console.log('Connected to WebSocket server');
    });

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'init') {
            console.log('Initial users and positions:', data.users);
            userId = data.userId; // Store the assigned user ID
            data.users.forEach(user => {
                updateDudePositionById(user.id, user.position);
            });
        } else if (data.type === 'lobby') {
            console.log('Current users in the lobby:', data.users);
        } else if (data.type === 'message') {
            console.log(`Message from ${data.from}: ${data.content}`);
        } else if (data.type === 'updatePosition') {
            updateDudePositionById(data.id, data.position);
        } else if (data.type === 'newUser') {
            console.log(`New user joined: ${data.user.id}`);
            createDudeForUser(data.user.id, data.user.position);
        }
    });

    socket.addEventListener('close', () => {
        console.log('Disconnected from WebSocket server');
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
    });
}

export function updateDudePosition(position) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("Sending")
        console.log(JSON.stringify({ type: 'updatePosition', id: userId, position }))

        socket.send(JSON.stringify({ type: 'updatePosition', id: userId, position }));
    }
}
