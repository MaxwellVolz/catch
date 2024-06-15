import { io } from 'socket.io-client';
import * as THREE from 'three';
import { createBall } from '../components/player';

const socket = io('http://localhost:3000');
const players = {};
const ballMap = new Map();

export function handleSocketConnections(scene, player, balls, world) {
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
        }
    });

    socket.on('ballRemoved', (data) => {
        console.log('Ball removed event received:', data);
        const ball = ballMap.get(data.id);
        if (ball) {
            scene.remove(ball.mesh);
            world.removeBody(ball.body);
            balls.splice(balls.indexOf(ball), 1);
            ballMap.delete(data.id);
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
                    id: socket.id + Date.now(),
                    position: { x: position.x, y: position.y + 1.0, z: position.z },
                    rotation: { _x: rotation.x, _y: rotation.y, _z: rotation.z },
                    velocity: { x: velocity.x, y: velocity.y, z: velocity.z }
                };

                console.log('Emitting ballThrown event:', ballData);
                socket.emit('ballThrown', ballData);

                if (!ballMap.has(ballData.id)) {
                    const ball = createBall(ballData.id, new THREE.Vector3(position.x, position.y + 1.0, position.z), rotation, velocity, world);
                    balls.push(ball);
                    ballMap.set(ballData.id, ball);
                }
            }
        }
    });
}

export function broadcastBallRemoval(ballId) {
    console.log('Broadcasting ball removal:', ballId);
    socket.emit('ballRemoved', { id: ballId });
}
