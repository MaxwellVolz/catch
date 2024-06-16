// game-client\src\utils\networking.js

import * as THREE from 'three';
import { createBall } from '../components/player';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');
const ballMap = new Map();
const markers = new Map();  // Use a Map to track markers by ball id

function initializeSocket(scene, player, balls, world, markers, createMarker, players) {
    console.log('World in initializeSocket:', world);

    socket.on('connect', () => {
        console.log('Connected to server');
        players[socket.id] = player;  // Add the player to the players object
    });

    socket.on('playerUpdate', (data) => {
        data.forEach(update => {
            if (update.id !== socket.id) {
                let otherPlayer = players[update.id];
                if (!otherPlayer) {
                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(update.position.x, update.position.y, update.position.z);
                    otherPlayer = { mesh, catchCount: 0, canThrow: true };
                    players[update.id] = otherPlayer;
                    scene.add(mesh);
                } else {
                    otherPlayer.mesh.position.set(update.position.x, update.position.y, update.position.z);
                }
            }
        });
    });

    socket.on('ballThrown', (data) => {
        console.log('Ball thrown event received:', data);
        if (!ballMap.has(data.id)) {
            const position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
            const rotation = new THREE.Euler(data.rotation._x, data.rotation._y, data.rotation._z);
            const velocity = new THREE.Vector3(data.velocity.x, data.velocity.y, data.velocity.z);
            const ball = createBall(data.id, position, rotation, velocity, world, data.thrower);
            ball.initialPosition = new THREE.Vector3(data.initialPosition.x, data.initialPosition.y, data.initialPosition.z);
            balls.push(ball);
            ballMap.set(data.id, ball);

            // Add marker below the ball
            const marker = createMarker();
            markers.set(data.id, marker);
            scene.add(marker);
        }
    });

    socket.on('ballRemoved', (data) => {
        console.log('Ball removed event received:', data);
        const ball = ballMap.get(data.id);
        if (ball) {
            scene.remove(ball.mesh);
            scene.remove(markers.get(data.id));  // Remove marker from scene
            world.removeBody(ball.body);
            balls.splice(balls.indexOf(ball), 1);
            ballMap.delete(data.id);
            markers.delete(data.id);  // Remove marker from map
        }
    });

    socket.on('catchUpdate', (data) => {
        console.log('Catch update received:', data);
        if (players[data.catcherId]) {
            players[data.catcherId].catchCount = data.catchCount;
            // Optionally update UI to reflect new catch count
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    window.addEventListener('beforeunload', () => {
        socket.disconnect();
    });
}

function broadcastBallRemoval(ballId) {
    console.log('Broadcasting ball removal:', ballId);
    socket.emit('ballRemoved', { id: ballId });
}

function handleEvents(scene, player, balls, world, players) {
    console.log('World in handleEvents:', world);

    function emitPlayerUpdate() {
        if (player && player.mesh && player.mesh.position) {
            socket.emit('playerUpdate', {
                id: socket.id,
                position: {
                    x: player.mesh.position.x,
                    y: player.mesh.position.y,
                    z: player.mesh.position.z
                }
            });
        }
    }

    setInterval(emitPlayerUpdate, 100);

    window.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            // No-op since throwing is now handled by mouse events
        }
    });
}

export {
    initializeSocket,
    broadcastBallRemoval,
    handleEvents,
    socket // Export socket
};
