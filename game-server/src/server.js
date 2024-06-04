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
    const user = { id: userId, socket: ws, position: { x: 0, y: 0, z: 0 }, rotation: 0, action: 'Idle' };
    clients.push(user);

    // Send initial lobby state and positions to the new client
    ws.send(JSON.stringify({
        type: 'init',
        userId, // Send userId to the client
        users: clients.filter(client => client.id !== userId).map(client => ({
            id: client.id,
            position: client.position,
            rotation: client.rotation,
            action: client.action
        }))
    }));
    console.log(`Sent init data to ${userId}:`, clients.filter(client => client.id !== userId).map(client => ({
        id: client.id,
        position: client.position,
        rotation: client.rotation,
        action: client.action
    })));

    // Broadcast the new user to all existing clients
    clients.forEach(client => {
        if (client.socket !== ws && client.socket.readyState === WebSocket.OPEN) {
            client.socket.send(JSON.stringify({
                type: 'newUser',
                user: { id: userId, position: user.position, rotation: user.rotation, action: user.action }
            }));
            console.log(`Broadcasted newUser data for ${userId} to ${client.id}`);
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

            // Update user's position, rotation, and action
            user.position = data.position;
            user.rotation = data.rotation;
            user.action = data.action;

            // Broadcast the new position, rotation, and action to all clients except the sender
            clients.forEach(client => {
                if (client.socket !== ws && client.socket.readyState === WebSocket.OPEN) {
                    client.socket.send(JSON.stringify({
                        type: 'updatePosition',
                        id: userId,
                        position: data.position,
                        rotation: data.rotation,
                        action: data.action
                    }));
                    console.log(`Broadcasted updatePosition data for ${userId} to ${client.id}`);
                }
            });
        } else if (data.type === 'removeUser') {
            console.log(`${userId} is disconnecting`);
            ws.close();
        }
    });

    ws.on('close', () => {
        console.log(`${userId} disconnected`);
        clients = clients.filter(client => client.socket !== ws);
        // Notify all clients about the removed user
        clients.forEach(client => {
            if (client.socket.readyState === WebSocket.OPEN) {
                client.socket.send(JSON.stringify({ type: 'removeUser', id: userId }));
                console.log(`Notified ${client.id} about removal of ${userId}`);
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
