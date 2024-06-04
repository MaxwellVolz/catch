// game-server/src/server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];
let userCounter = 1;

wss.on('connection', (ws) => {
    console.log('New client connected');
    const userId = `User${userCounter++}`;
    const user = { id: userId, socket: ws, position: { x: 0, y: 0, z: 0 } };
    clients.push(user);

    // Send initial lobby state and positions to the new client
    ws.send(JSON.stringify({
        type: 'init',
        userId, // Send userId to the client
        users: clients.map(client => ({ id: client.id, position: client.position }))
    }));

    // Broadcast the new user to all existing clients
    clients.forEach(client => {
        if (client.socket !== ws && client.socket.readyState === WebSocket.OPEN) {
            client.socket.send(JSON.stringify({
                type: 'newUser',
                user: { id: userId, position: user.position }
            }));
        }
    });

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log(`Received from ${userId}:`, message);

        if (data.type === 'updatePosition') {
            // Validate the user sending the update
            if (data.id !== userId) {
                console.log(`Invalid update attempt by ${userId}`);
                return;
            }

            // Update user's position
            user.position = data.position;

            // Broadcast the new position to all clients
            clients.forEach(client => {
                if (client.socket.readyState === WebSocket.OPEN) {
                    client.socket.send(JSON.stringify({
                        type: 'updatePosition',
                        id: userId,
                        position: data.position
                    }));
                }
            });
        } else {
            // Broadcast the message to all clients
            clients.forEach(client => {
                if (client.socket.readyState === WebSocket.OPEN) {
                    client.socket.send(JSON.stringify({ type: 'message', from: userId, content: message }));
                }
            });
        }
    });

    ws.on('close', () => {
        console.log(`${userId} disconnected`);
        clients = clients.filter(client => client.socket !== ws);
        // Notify all clients about the updated lobby state
        clients.forEach(client => {
            if (client.socket.readyState === WebSocket.OPEN) {
                client.socket.send(JSON.stringify({ type: 'lobby', users: clients.map(client => client.id) }));
            }
        });
    });
});

app.get('/', (req, res) => {
    res.send('WebSocket server is running');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
