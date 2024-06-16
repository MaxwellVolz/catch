// game-client\src\index.js

import { initEnvironment, updatePhysics } from './utils/initEnvironment';
import { createPlayer, updatePlayerState, renderBalls, createBall } from './components/player';
import { initializeSocket, handleEvents, broadcastBallRemoval, socket } from './utils/networking';
import { setupEventHandlers } from './utils/eventHandlers';
import { createMarker } from './utils/createMarker';
import { updateCatchDisplay } from './utils/textUtils';
import { Vector3, Raycaster } from 'three';

document.addEventListener('DOMContentLoaded', () => {
    const { scene, camera, renderer, world, player } = initEnvironment();
    player.canThrow = true;
    player.catchCount = 0; // Add catchCount to player state
    const players = {};
    players[socket.id] = player;
    const balls = [];
    const markers = new Map();
    const raycaster = new Raycaster();
    const mouse = new Vector3();
    const ballMap = new Map();

    console.log('Environment initialized:', world);

    const input = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        turnLeft: false,
        turnRight: false
    };

    let isCharging = false;
    let chargeStartTime = 0;
    let chargeEndTime = 0;
    let canThrow = true;

    setupEventHandlers(input, player, raycaster, mouse, camera, renderer, socket, balls, canThrow, isCharging, chargeStartTime, chargeEndTime);

    initializeSocket(scene, player, balls, world, markers, createMarker, players);
    handleEvents(scene, player, balls, world, players);

    function detectCollisions() {
        balls.forEach(ball => {
            Object.values(players).forEach(p => {
                const distance = p.mesh.position.distanceTo(ball.mesh.position);
                if (distance < 1.5) { // Increase the collision radius
                    console.log(`Collision detected between player ${p.mesh.name} and ball ${ball.id}`);
                    handleBallCatch(ball.id, p);
                }
            });

            // Check if the ball touches the ground
            if (ball.mesh.position.y <= 0.5) {
                console.log(`Ball ${ball.id} touched the ground`);
                handleBallTouchGround(ball.id);
            }
        });
    }

    function handleBallCatch(ballId, catcher) {
        const ballIndex = balls.findIndex(b => b.id === ballId);
        if (ballIndex === -1) return; // Ball not found

        const ball = balls[ballIndex];
        if (ball.processed) return; // Ball already processed

        ball.processed = true;

        // Always remove the ball from the scene and physics world
        scene.remove(ball.mesh);
        scene.remove(markers.get(ball.id));  // Remove marker from scene
        world.removeBody(ball.body);
        balls.splice(ballIndex, 1);
        markers.delete(ball.id);  // Remove marker from map
        broadcastBallRemoval(ball.id);

        if (ball.hitGround) {
            // Log ground hit event
            console.log(`Ball caught by player ${catcher.mesh.name} which had already hit the ground, thrown by player ${ball.thrower}`);
            return; // Do not update the catch count
        }

        // Log catch event
        console.log(`Ball caught by player ${catcher.mesh.name}, thrown by player ${ball.thrower}`);

        // Update catch count
        if (players[ball.thrower]) {
            catcher.catchCount++;
            players[ball.thrower].catchCount = catcher.catchCount; // Sync both players' catch count
            updateCatchDisplay(ball.thrower, ball.initialPosition, catcher.mesh.position, catcher.catchCount, scene);
        }

        // Emit catch update
        socket.emit('catchUpdate', {
            catcherId: catcher.mesh.name,
            throwerId: ball.thrower,
            catchCount: catcher.catchCount
        });

        // Reset cooldown
        catcher.canThrow = true;
    }

    function handleBallTouchGround(ballId) {
        const ball = balls.find(b => b.id === ballId);
        if (!ball) return;

        // Log ground hit event
        console.log(`Ball thrown by player ${ball.thrower} hit the ground`);

        // Mark the ball as having hit the ground
        ball.hitGround = true;

        // Reset thrower's catch count if exists
        if (players[ball.thrower]) {
            players[ball.thrower].catchCount = 0; // Reset thrower's catch count
        }
    }

    function updateMarkers() {
        balls.forEach(ball => {
            const marker = markers.get(ball.id);
            if (marker) {
                const yPosition = ball.mesh.position.y;
                marker.position.set(ball.mesh.position.x, 0.01, ball.mesh.position.z);  // Update marker position below the ball

                // Adjust marker opacity based on y position
                const opacity = Math.min(0.8, yPosition / 10 * 0.8);
                marker.material.opacity = opacity;

                const scale = Math.max(0.5, yPosition / 10);  // Scale based on Y position, with a minimum scale
                marker.scale.set(scale, scale, scale);
            }
        });
    }

    function gameLoop() {
        updatePlayerState(player, input);
        updatePhysics(world, balls);
        renderBalls(scene, balls);
        detectCollisions();
        updateMarkers();  // Update marker positions
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});
// game-client\src\components\player.js

import * as THREE from 'three';
import { Body, Box, Sphere } from 'cannon-es';

export function createPlayer(scene, world) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.5, 0);
    scene.add(player);

    const shape = new Box(new THREE.Vector3(0.5, 0.5, 0.5));
    const body = new Body({ mass: 1 });
    body.addShape(shape);
    body.position.set(0, 0.5, 0);
    world.addBody(body);

    return { mesh: player, body };
}

export function updatePlayerState(player, input) {
    const speed = 0.1;
    const turnSpeed = 0.05;

    // Calculate forward and right vectors based on player rotation
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.mesh.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(player.mesh.quaternion);

    if (input.forward) player.mesh.position.add(forward.multiplyScalar(speed));
    if (input.backward) player.mesh.position.add(forward.multiplyScalar(-speed));
    if (input.left) player.mesh.position.add(right.multiplyScalar(-speed));
    if (input.right) player.mesh.position.add(right.multiplyScalar(speed));
    if (input.turnLeft) player.mesh.rotation.y += turnSpeed;
    if (input.turnRight) player.mesh.rotation.y -= turnSpeed;
}

export function renderBalls(scene, balls) {
    balls.forEach(ball => {
        ball.update();
        if (!scene.children.includes(ball.mesh)) {
            scene.add(ball.mesh);
        }
    });
}

export function createBall(id, position, rotation, velocity, world, thrower) {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    const ballPosition = position.clone();
    ballPosition.y += 1;
    mesh.position.copy(ballPosition);
    mesh.rotation.copy(rotation);

    const shape = new Sphere(0.5);
    const body = new Body({ mass: 0.05, position: ballPosition });
    body.addShape(shape);
    body.velocity.set(velocity.x, velocity.y, velocity.z);
    world.addBody(body);

    return {
        id,
        mesh,
        body,
        thrower, // Add thrower information
        update() {
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
        }
    };
}
// game-client\src\utils\initEnvironment.js

import * as THREE from 'three';
import { World, Body, Plane, Vec3, Cylinder, Sphere, Box } from 'cannon-es';

function createTree(scene, world, position) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(position.x, position.y + 1, position.z);

    const leavesGeometry = new THREE.SphereGeometry(1);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(position.x, position.y + 2.5, position.z);

    scene.add(trunk);
    scene.add(leaves);

    const trunkShape = new Cylinder(0.2, 0.2, 2, 8);
    const trunkBody = new Body({ mass: 0 });
    trunkBody.addShape(trunkShape);
    trunkBody.position.set(position.x, position.y + 1, position.z);
    world.addBody(trunkBody);

    const leavesShape = new Sphere(1);
    const leavesBody = new Body({ mass: 0 });
    leavesBody.addShape(leavesShape);
    leavesBody.position.set(position.x, position.y + 2.5, position.z);
    world.addBody(leavesBody);
}

function createBush(scene, world, position) {
    const bushGeometry = new THREE.SphereGeometry(0.5);
    const bushMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(position.x, position.y + 0.5, position.z);

    scene.add(bush);

    const bushShape = new Sphere(0.5);
    const bushBody = new Body({ mass: 0 });
    bushBody.addShape(bushShape);
    bushBody.position.set(position.x, position.y + 0.5, position.z);
    world.addBody(bushBody);
}

function createPlaceholderObject(scene, world, position) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff00ff });
    const placeholder = new THREE.Mesh(geometry, material);
    placeholder.position.set(position.x, position.y + 0.5, position.z);

    scene.add(placeholder);

    const shape = new Box(new Vec3(0.5, 0.5, 0.5));
    const body = new Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(position.x, position.y + 0.5, position.z);
    world.addBody(body);
}

function seededRandom(seed) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

export function initEnvironment() {
    const scene = new THREE.Scene();
    const world = new World();
    world.gravity.set(0, -9.82, 0);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 25, 25);
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
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    const groundBody = new Body({ mass: 0 });
    groundBody.addShape(new Plane());
    groundBody.position.set(0, 0, 0);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Add trees, bushes, and placeholders
    const seed = 12345; // example seed
    for (let x = -50; x <= 50; x += 10 + seededRandom(seed) * 10) {
        for (let z = -50; z <= 50; z += 10 + seededRandom(seed + x * z) * 10) {
            if (seededRandom(seed + x + z) > 0.7) {
                createTree(scene, world, new Vec3(x, 0, z));
            } else if (seededRandom(seed + x + z * 2) > 0.4) {
                createBush(scene, world, new Vec3(x, 0, z));
            } else {
                createPlaceholderObject(scene, world, new Vec3(x, 0, z));
            }
        }
    }

    // Create player
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 0.5, 0);
    scene.add(player);

    const playerShape = new Box(new Vec3(0.5, 0.5, 0.5));
    const playerBody = new Body({ mass: 1 });
    playerBody.addShape(playerShape);
    playerBody.position.set(0, 0.5, 0);
    world.addBody(playerBody);

    // Render function
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    return { scene, camera, renderer, world, player: { mesh: player, body: playerBody } };
}

export function updatePhysics(world, objects) {
    world.step(1 / 60);  // Step the physics world

    // Update all object positions based on physics simulation
    objects.forEach(object => object.update());
}
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
let balls = [];

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
        balls.push(data);
        io.emit('ballThrown', data);
    });

    socket.on('ballRemoved', (data) => {
        console.log('Received ballRemoved event:', data);
        balls = balls.filter(ball => ball.id !== data.id);
        io.emit('ballRemoved', data);
    });

    socket.on('catchUpdate', (data) => {
        console.log('Catch update received:', data);
        io.emit('catchUpdate', data);
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
// game-client\src\utils\eventHandlers.js
import * as THREE from 'three';

export function setupEventHandlers(input, player, raycaster, mouse, camera, renderer, socket, balls, canThrow, isCharging, chargeStartTime, chargeEndTime) {
    window.addEventListener('keydown', (event) => {
        if (event.key === 'w') input.forward = true;
        if (event.key === 's') input.backward = true;
        if (event.key === 'a') input.left = true;
        if (event.key === 'd') input.right = true;
        if (event.key === 'q') input.turnLeft = true;
        if (event.key === 'e') input.turnRight = true;
    });

    window.addEventListener('keyup', (event) => {
        if (event.key === 'w') input.forward = false;
        if (event.key === 's') input.backward = false;
        if (event.key === 'a') input.left = false;
        if (event.key === 'd') input.right = false;
        if (event.key === 'q') input.turnLeft = false;
        if (event.key === 'e') input.turnRight = false;
    });

    window.addEventListener('mousedown', (event) => {
        if (!player.canThrow) return; // Check player state
        isCharging = true;
        chargeStartTime = Date.now();
    });

    window.addEventListener('mouseup', (event) => {
        if (!isCharging) return;
        isCharging = false;
        chargeEndTime = Date.now();

        const chargeDuration = (chargeEndTime - chargeStartTime) / 1000; // in seconds
        const maxChargeDuration = 3; // Max charge duration in seconds
        const chargeFactor = Math.min(chargeDuration / maxChargeDuration, 1); // Value between 0 and 1

        const throwPower = 50;

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersectPoint = new THREE.Vector3();
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        raycaster.ray.intersectPlane(plane, intersectPoint);

        const distance = player.mesh.position.distanceTo(intersectPoint);
        let angle = 80 - (distance / 10) * 70; // Linearly interpolate angle based on distance
        angle = Math.max(angle, 20); // Ensure the minimum angle is 10 degrees

        const direction = new THREE.Vector3().subVectors(intersectPoint, player.mesh.position).normalize();
        const horizontalDistance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        direction.y = Math.tan(angle * (Math.PI / 180)) * horizontalDistance;
        direction.normalize();

        const velocity = direction.multiplyScalar(throwPower * chargeFactor); // Base speed plus charge-based speed

        const ballData = {
            id: socket.id + Date.now(),
            position: { x: player.mesh.position.x, y: player.mesh.position.y + 1.0, z: player.mesh.position.z },
            rotation: { _x: player.mesh.rotation.x, _y: player.mesh.rotation.y, _z: player.mesh.rotation.z },
            velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
            thrower: socket.id,  // Add thrower information
            initialPosition: player.mesh.position.clone()  // Add initial position
        };

        console.log('Emitting ballThrown event:', ballData);
        socket.emit('ballThrown', ballData);

        // Set cooldown
        player.canThrow = false;
        setTimeout(() => {
            player.canThrow = true;
        }, 2000); // 5 seconds cooldown
    });
}
