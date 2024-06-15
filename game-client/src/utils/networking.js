import { io } from 'socket.io-client';
import * as THREE from 'three';
import { createBall } from '../components/player';

const socket = io('http://localhost:3000');
const players = {};
const ballMap = new Map();  // Use a Map to track balls by unique identifier

export function handleSocketConnections(scene, player, balls, world) {
    console.log('World in handleSocketConnections:', world);  // Add logging to check the world object

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
        if (!ballMap.has(data.id)) {  // Check if the ball with this id already exists
            const position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
            const rotation = new THREE.Euler(data.rotation._x, data.rotation._y, data.rotation._z);
            const velocity = new THREE.Vector3(data.velocity.x, data.velocity.y, data.velocity.z);
            const ball = createBall(data.id, position, rotation, velocity, world);  // Pass world here
            balls.push(ball);
            ballMap.set(data.id, ball);  // Add ball to map
        }
    });

    window.addEventListener('beforeunload', () => {
        socket.disconnect();
    });
}

export function handleEvents(scene, player, balls, world) {
    console.log('World in handleEvents:', world);  // Add logging to check the world object

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

    let canThrow = true;

    window.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            if (canThrow) {
                canThrow = false;
                setTimeout(() => canThrow = true, 5000);

                const position = player.position.clone();
                const rotation = player.rotation.clone();
                const velocity = new THREE.Vector3(0, 0, -0.1).applyQuaternion(player.quaternion);

                const ballData = {
                    id: socket.id + Date.now(),  // Use a combination of socket id and timestamp as a unique id
                    position: { x: position.x, y: position.y + 1.0, z: position.z },  // Position the ball high above the player
                    rotation: { _x: rotation.x, _y: rotation.y, _z: rotation.z },
                    velocity: { x: velocity.x, y: velocity.y, z: velocity.z }
                };

                console.log('Emitting ballThrown event:', ballData);
                socket.emit('ballThrown', ballData);

                if (!ballMap.has(ballData.id)) {  // Check if the ball with this id already exists
                    const ball = createBall(ballData.id, new THREE.Vector3(position.x, position.y + 1.0, position.z), rotation, velocity, world);  // Pass world here
                    balls.push(ball);
                    ballMap.set(ballData.id, ball);  // Add ball to map
                }
            }
        }
    });
}
