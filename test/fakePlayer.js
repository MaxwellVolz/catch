const { io } = require('socket.io-client');

const serverUrl = 'http://localhost:3000'; // Update with your server URL if different

function simulatePlayer() {
    const socket = io(serverUrl);

    socket.on('connect', () => {
        console.log(`Fake player connected with ID: ${socket.id}`);

        let input = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        // Simulate player movement inputs every 500ms
        const movementInterval = setInterval(() => {
            // Randomly decide the direction to move
            input = {
                forward: Math.random() > 0.5,
                backward: Math.random() > 0.5,
                left: Math.random() > 0.5,
                right: Math.random() > 0.5
            };

            socket.emit('playerUpdate', { id: socket.id, input });
            console.log(`Fake player ${socket.id} input:`, input);
        }, 500);

        // Disconnect after 10 seconds and reconnect after 5 seconds
        setTimeout(() => {
            clearInterval(movementInterval);
            console.log(`Fake player ${socket.id} disconnecting...`);
            socket.disconnect();

            setTimeout(() => {
                console.log('Reconnecting fake player...');
                simulatePlayer(); // Reconnect by calling the function again
            }, 5000);
        }, 10000);
    });

    socket.on('disconnect', () => {
        console.log(`Fake player ${socket.id} disconnected`);
    });

    socket.on('playerUpdate', (players) => {
        console.log('Received player updates:', players);
    });

    socket.on('ballThrown', (data) => {
        console.log('Received ball thrown event:', data);
    });

    socket.on('ballRemoved', (data) => {
        console.log('Received ball removed event:', data);
    });

    socket.on('catchUpdate', (data) => {
        console.log('Received catch update:', data);
    });

    socket.on('playerDisconnected', (data) => {
        console.log('A player disconnected:', data);
    });
}

// Start simulating the player
simulatePlayer();
