// game-client\src\index.js
import { initScene } from './utils/initScene';
import { createPlayer, updatePlayerState, renderBalls } from './components/player';
import { handleSocketConnections, handleEvents } from './utils/networking';

document.addEventListener('DOMContentLoaded', () => {
    const scene = initScene();
    const player = createPlayer(scene);
    const balls = [];

    const input = {
        forward: false,
        backward: false,
        left: false,
        right: false
    };

    window.addEventListener('keydown', (event) => {
        if (event.key === 'w') input.forward = true;
        if (event.key === 's') input.backward = true;
        if (event.key === 'a') input.left = true;
        if (event.key === 'd') input.right = true;
    });

    window.addEventListener('keyup', (event) => {
        if (event.key === 'w') input.forward = false;
        if (event.key === 's') input.backward = false;
        if (event.key === 'a') input.left = false;
        if (event.key === 'd') input.right = false;
    });

    handleSocketConnections(scene, player);
    handleEvents(scene, player);

    function gameLoop() {
        updatePlayerState(player, input);
        renderBalls(scene, balls);
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});
import * as THREE from 'three';

export function createPlayer(scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.5, 0);  // Position the player above the ground
    scene.add(player);
    return player;
}

export function updatePlayerState(player, input) {
    const speed = 0.1;

    if (input.forward) player.position.z -= speed;
    if (input.backward) player.position.z += speed;
    if (input.left) player.position.x -= speed;
    if (input.right) player.position.x += speed;
}

export function renderBalls(scene, balls) {
    balls.forEach(ball => {
        ball.update();
        if (!scene.children.includes(ball.mesh)) {
            scene.add(ball.mesh);
        }
        console.log('Rendering ball at position:', ball.mesh.position);  // Add log to check ball position during render
    });
}

export function createBall(position, rotation, velocity) {
    console.log('Creating ball at position:', position);
    const geometry = new THREE.SphereGeometry(5, 32, 32);  // Increase the size of the ball
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    // Position the ball above the player
    const ballPosition = position.clone();
    ballPosition.y += 5;  // Adjust the value to position the ball higher above the player
    mesh.position.copy(ballPosition);
    mesh.rotation.copy(rotation);

    return {
        mesh,
        velocity,
        update() {
            this.mesh.position.add(this.velocity);
            // Add simple gravity
            this.velocity.y -= 0.01;
            console.log('Ball position during update:', this.mesh.position);
        }
    };
}
// game-client/src/utils/initPhysics.js
import { World, Body, Plane } from 'cannon-es';

export function initPhysics() {
    const world = new World();
    world.gravity.set(0, -9.82, 0);

    // Create ground
    const groundBody = new Body({ mass: 0 });
    groundBody.addShape(new Plane());
    world.addBody(groundBody);

    return world;
}
// game-client\src\utils\initScene.js
import * as THREE from 'three';

export function initScene() {
    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 5);  // Adjust the camera position to ensure the ball is visible
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Ground plane
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Render function
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    return scene;
}
// game-client\src\utils\networking.js
import { io } from 'socket.io-client';
import * as THREE from 'three';
import { createBall } from '../components/player';

const socket = io('http://localhost:3000');
const players = {};
const balls = [];

export function handleSocketConnections(scene, player) {
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
        const position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
        const rotation = new THREE.Euler(data.rotation._x, data.rotation._y, data.rotation._z);
        const velocity = new THREE.Vector3(data.velocity.x, data.velocity.y, data.velocity.z);
        const ball = createBall(position, rotation, velocity);
        balls.push(ball);
    });

    window.addEventListener('beforeunload', () => {
        socket.disconnect();
    });
}

export function handleEvents(scene, player) {
    // Listen for player input and emit events
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
                    position: { x: position.x, y: position.y + 5.0, z: position.z },  // Position the ball high above the player
                    rotation: { _x: rotation.x, _y: rotation.y, _z: rotation.z },
                    velocity: { x: velocity.x, y: velocity.y, z: velocity.z }
                };

                console.log('Emitting ballThrown event:', ballData);
                socket.emit('ballThrown', ballData);

                const ball = createBall(new THREE.Vector3(position.x, position.y + 5.0, position.z), rotation, velocity);
                balls.push(ball);
            }
        }
    });
}
// game - server\src\server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    }
});

let players = [];

io.on('connection', (socket) => {
    console.log('A player connected');

    socket.on('playerUpdate', (data) => {
        const existingPlayer = players.find(player => player.id === data.id);
        if (existingPlayer) {
            existingPlayer.position = data.position;
        } else {
            players.push(data);
        }

        io.emit('playerUpdate', players);
    });

    socket.on('ballThrown', (data) => {
        console.log('Received ballThrown event:', data);
        io.emit('ballThrown', data);
    });

    socket.on('disconnect', () => {
        console.log('A player disconnected');
        players = players.filter(player => player.id !== socket.id);
        io.emit('playerUpdate', players);
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
