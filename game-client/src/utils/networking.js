import { io } from 'socket.io-client';
import * as THREE from 'three';
import { createBall } from '../components/player';

const socket = io('http://localhost:3000');
const players = {};
const ballMap = new Map();
const markers = new Map();  // Use a Map to track markers by ball id

export function handleSocketConnections(scene, player, balls, world, markers, createMarker) {
    console.log('World in handleSocketConnections:', world);

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('playerUpdate', (data) => {
        data.forEach(update => {
            if (update.id !== socket.id) {
                let otherPlayer = players[update.id];
                if (!otherPlayer) {
                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                    otherPlayer = new THREE.Mesh(geometry, material);
                    otherPlayer.position.set(update.position.x, update.position.y, update.position.z);
                    players[update.id] = otherPlayer;
                    scene.add(otherPlayer);
                } else {
                    otherPlayer.position.set(update.position.x, update.position.y, update.position.z);
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
            const ball = createBall(data.id, position, rotation, velocity, world);
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

    window.addEventListener('beforeunload', () => {
        socket.disconnect();
    });
}

export function handleEvents(scene, player, balls, world) {
    console.log('World in handleEvents:', world);

    function emitPlayerUpdate() {
        socket.emit('playerUpdate', {
            id: socket.id,
            position: {
                x: player.position.x,
                y: player.position.y,
                z: player.position.z
            }
        });
    }

    setInterval(emitPlayerUpdate, 100);

    window.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            // No-op since throwing is now handled by mouse events
        }
    });
}

export function broadcastBallRemoval(ballId) {
    console.log('Broadcasting ball removal:', ballId);
    socket.emit('ballRemoved', { id: ballId });
}

function createMarker() {
    const geometry = new THREE.CircleGeometry(0.5, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const marker = new THREE.Mesh(geometry, material);
    marker.rotation.x = -Math.PI / 2;
    return marker;
}
