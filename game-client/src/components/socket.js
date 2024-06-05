// game-client/src/components/socket.js
import { updateDudePositionById, createDudeForUser, removeDudeById, updateBaseball } from './scene.js';

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
        console.log('Received data:', data);

        if (data.type === 'init') {
            console.log('Initial users and positions:', data.users);
            userId = data.userId; // Store the assigned user ID
            data.users.forEach(user => {
                updateDudePositionById(user.id, user.position, user.rotation, user.action);
            });
            if (data.ball) {
                updateBaseball(data.ball.position, data.ball.velocity, data.ball.holder);
            }
        } else if (data.type === 'lobby') {
            console.log('Current users in the lobby:', data.users);
        } else if (data.type === 'message') {
            console.log(`Message from ${data.from}: ${data.content}`);
        } else if (data.type === 'updatePosition') {
            if (data.id !== userId) {
                updateDudePositionById(data.id, data.position, data.rotation, data.action);
            }
        } else if (data.type === 'removeUser') {
            removeDudeById(data.id);
        } else if (data.type === 'newUser') {
            console.log(`New user joined: ${data.user.id}`);
            createDudeForUser(data.user.id, data.user.position, data.user.rotation, data.user.action);
        } else if (data.type === 'ballUpdate') {
            handleBallUpdate(data.ball);
        }
    });

    socket.addEventListener('close', () => {
        console.log('Disconnected from WebSocket server');
        if (userId) {
            socket.send(JSON.stringify({ type: 'removeUser', id: userId }));
        }
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
    });
}

export function updateDudePosition(position, rotation, action) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'updatePosition', id: userId, position, rotation, action }));
        // console.log('Sent updatePosition data:', { id: userId, position, rotation, action });
    }
}

export function broadcastBallUpdate(ball) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ballUpdate', ball }));
        console.log('Sent ballUpdate data:', ball);
    }
}

function handleBallUpdate(ball) {
    if (ball && ball.position && ball.velocity) {
        if (!ballBody) {
            createBaseball(ball.position);
        } else {
            ballBody.position.set(ball.position.x, ball.position.y, ball.position.z);
            ballBody.velocity.set(ball.velocity.x, ball.velocity.y, ball.velocity.z);
            updateBaseball(ball.position, ball.velocity);
        }
        console.log('Handled ball update with Cannon.js physics:', ball);
    } else {
        console.error('Invalid ball update data:', ball);
    }
}
