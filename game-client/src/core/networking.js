import * as THREE from 'three';
import { createBall } from '../controllers/ball';
import { createMarker } from '../utils/createMarker'; // Import createMarker
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');
const ballMap = new Map();
const playerBallMap = new Map(); // Map to track which ball belongs to which player

function handlePlayerUpdates(socket, players, scene) {
    socket.on('playerUpdate', (data) => {
        if (!data || !Array.isArray(data)) {
            console.error('Invalid player update data received:', data);
            return;
        }

        console.log('Player update data received:', data);

        data.forEach(update => {
            if (!update || !update.id || !update.position) {
                console.error('Invalid player update received:', update);
                return;
            }

            if (update.id !== socket.id) {
                let otherPlayer = players[update.id];
                if (!otherPlayer) {
                    console.log('Creating new player for ID:', update.id);
                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.position.copy(update.position);
                    otherPlayer = { mesh, catchCount: 0, canThrow: true };
                    players[update.id] = otherPlayer;
                    scene.add(mesh);
                } else {
                    console.log('Updating player position for ID:', update.id);
                    if (otherPlayer.mesh) {
                        otherPlayer.mesh.position.copy(update.position);
                    } else {
                        console.error('Player mesh is undefined for ID:', update.id);
                    }
                }
            }
        });

        // Log the current state of players
        console.log('Current state of players:', players);
    });

    socket.on('playerDisconnected', (data) => {
        if (!data || !data.id) {
            console.error('Invalid player disconnect data received:', data);
            return;
        }

        console.log('Player disconnected:', data.id);

        const disconnectedPlayer = players[data.id];
        if (disconnectedPlayer) {
            scene.remove(disconnectedPlayer.mesh);
            delete players[data.id];
        }

        // Log the current state of players after disconnect
        console.log('Current state of players after disconnect:', players);
    });
}

function handleBallUpdates(socket, balls, world, markers, scene) {
    socket.on('ballThrown', (data) => {
        if (!data || !data.id || !data.position || !data.rotation || !data.velocity) {
            console.error('Invalid ball thrown data received:', data);
            return;
        }

        console.log('Ball thrown data received:', data);

        // Remove existing ball if the player already has one
        if (playerBallMap.has(data.thrower)) {
            const existingBallId = playerBallMap.get(data.thrower);
            const existingBall = ballMap.get(existingBallId);
            if (existingBall) {
                scene.remove(existingBall.mesh);
                scene.remove(markers.get(existingBallId));
                world.removeBody(existingBall.body);
                balls.splice(balls.indexOf(existingBall), 1);
                ballMap.delete(existingBallId);
                markers.delete(existingBallId);
                playerBallMap.delete(data.thrower);
                socket.emit('ballRemoved', { id: existingBallId });
            }
        }

        // Create and track the new ball
        const position = new THREE.Vector3().copy(data.position);
        const rotation = new THREE.Euler().copy(data.rotation);
        rotation.order = 'XYZ'; // Ensure order is set correctly
        const velocity = new THREE.Vector3().copy(data.velocity);
        const ball = createBall(data.id, position, rotation, velocity, world, data.thrower);
        balls.push(ball);
        ballMap.set(data.id, ball);
        playerBallMap.set(data.thrower, data.id);

        const marker = createMarker();
        markers.set(data.id, marker);
        scene.add(marker);
    });

    socket.on('ballRemoved', (data) => {
        if (!data || !data.id) {
            console.error('Invalid ball removed data received:', data);
            return;
        }

        console.log('Ball removed data received:', data);

        const ball = ballMap.get(data.id);
        if (ball) {
            scene.remove(ball.mesh);
            scene.remove(markers.get(data.id));
            world.removeBody(ball.body);
            balls.splice(balls.indexOf(ball), 1);
            ballMap.delete(data.id);
            markers.delete(data.id);
            playerBallMap.delete(ball.thrower); // Ensure to remove the ball from the player's map
        }
    });
}

function initializeSocket(scene, player, balls, world, markers) {
    const players = {}; // Initialize players object here
    socket.on('connect', () => {
        console.log('Connected to server with socket ID:', socket.id);
        players[socket.id] = player;
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    handlePlayerUpdates(socket, players, scene);
    handleBallUpdates(socket, balls, world, markers, scene);

    window.addEventListener('beforeunload', () => socket.disconnect());

    return players; // Return the initialized players object
}

function broadcastBallRemoval(ballId) {
    console.log('Broadcasting ball removal:', ballId);
    socket.emit('ballRemoved', { id: ballId });
}

function handleEvents(scene, player, balls, world, players) {
    function emitPlayerUpdate() {
        if (player && player.mesh && player.mesh.position) {
            socket.emit('playerUpdate', {
                id: socket.id,
                position: player.mesh.position
            });
        }
    }

    setInterval(emitPlayerUpdate, 1000); // Less frequent updates, adjust as needed
}

export {
    initializeSocket,
    broadcastBallRemoval,
    handleEvents,
    socket // Ensure this is exported
};
