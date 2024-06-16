// game-client\src\index.js
import { initScene } from './utils/initScene';
import { createPlayer, updatePlayerState, renderBalls, createBall } from './components/player';
import { handleSocketConnections, handleEvents, broadcastBallRemoval } from './utils/networking';
import { initPhysics, updatePhysics } from './utils/initPhysics';
import { Vector3, Raycaster, Plane, Mesh, MeshBasicMaterial, CircleGeometry } from 'three';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');  // Initialize socket

document.addEventListener('DOMContentLoaded', () => {
    const { scene, camera, renderer } = initScene();
    const player = createPlayer(scene);  // Ensure scene is passed correctly
    const balls = [];
    const markers = new Map();
    const world = initPhysics();
    const raycaster = new Raycaster();
    const mouse = new Vector3();
    const ballMap = new Map();  // Use a Map to track balls by unique identifier

    console.log('Physics world initialized:', world);

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
        if (!canThrow) return;
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

        const throwPower = 50

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersectPoint = new Vector3();
        const plane = new Plane(new Vector3(0, 1, 0), 0);
        raycaster.ray.intersectPlane(plane, intersectPoint);

        const distance = player.position.distanceTo(intersectPoint);
        let angle = 80 - (distance / 10) * 70; // Linearly interpolate angle based on distance
        angle = Math.max(angle, 20); // Ensure the minimum angle is 10 degrees

        const direction = new Vector3().subVectors(intersectPoint, player.position).normalize();
        const horizontalDistance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        direction.y = Math.tan(angle * (Math.PI / 180)) * horizontalDistance;
        direction.normalize();

        const velocity = direction.multiplyScalar(throwPower * chargeFactor); // Base speed plus charge-based speed

        const ballData = {
            id: socket.id + Date.now(),
            position: { x: player.position.x, y: player.position.y + 1.0, z: player.position.z },
            rotation: { _x: player.rotation.x, _y: player.rotation.y, _z: player.rotation.z },
            velocity: { x: velocity.x, y: velocity.y, z: velocity.z }
        };

        console.log('Emitting ballThrown event:', ballData);
        socket.emit('ballThrown', ballData);

        // Set cooldown
        canThrow = false;
        setTimeout(() => {
            canThrow = true;
        }, 5000); // 5 seconds cooldown
    });

    function createMarker() {
        const geometry = new CircleGeometry(0.5, 32);
        const material = new MeshBasicMaterial({ color: 0xffff00 });
        const marker = new Mesh(geometry, material);
        marker.rotation.x = -Math.PI / 2;
        return marker;
    }

    handleSocketConnections(scene, player, balls, world, markers, createMarker);
    handleEvents(scene, player, balls, world);

    function detectCollisions() {
        balls.forEach((ball, index) => {
            const distance = player.position.distanceTo(ball.mesh.position);
            if (distance < 1) {
                scene.remove(ball.mesh);
                scene.remove(markers.get(ball.id));  // Remove marker from scene
                world.removeBody(ball.body);
                balls.splice(index, 1);
                markers.delete(ball.id);  // Remove marker from map
                broadcastBallRemoval(ball.id);

                // Reset cooldown
                canThrow = true;
            }
        });
    }

    function updateMarkers() {
        balls.forEach(ball => {
            const marker = markers.get(ball.id);
            if (marker) {
                marker.position.set(ball.mesh.position.x, 0.01, ball.mesh.position.z);  // Update marker position below the ball
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
import * as THREE from 'three';
import { Body, Sphere } from 'cannon-es';

export function createPlayer(scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.5, 0);  // Position the player above the ground
    scene.add(player);  // Ensure scene is used correctly
    return player;
}

export function updatePlayerState(player, input) {
    const speed = 0.1;
    const turnSpeed = 0.05;

    // Calculate forward and right vectors based on player rotation
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(player.quaternion);

    if (input.forward) player.position.add(forward.multiplyScalar(speed));
    if (input.backward) player.position.add(forward.multiplyScalar(-speed));
    if (input.left) player.position.add(right.multiplyScalar(-speed));
    if (input.right) player.position.add(right.multiplyScalar(speed));
    if (input.turnLeft) player.rotation.y += turnSpeed;
    if (input.turnRight) player.rotation.y -= turnSpeed;
}

export function renderBalls(scene, balls) {
    balls.forEach(ball => {
        ball.update();
        if (!scene.children.includes(ball.mesh)) {
            scene.add(ball.mesh);
        }
        // console.log('Rendering ball at position:', ball.mesh.position);  // Add log to check ball position during render
    });
}

export function createBall(id, position, rotation, velocity, world) {
    console.log('Creating ball at position:', position);
    console.log('World in createBall:', world);  // Add logging to check the world object

    const geometry = new THREE.SphereGeometry(0.5, 32, 32);  // Adjust the size of the ball
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    // Position the ball above the player
    const ballPosition = position.clone();
    ballPosition.y += 1;  // Adjust the value to position the ball higher above the player
    mesh.position.copy(ballPosition);
    mesh.rotation.copy(rotation);

    // Create physics body with reduced weight
    const shape = new Sphere(0.5);
    const body = new Body({ mass: 0.05, position: ballPosition });  // Reduced mass for floating effect
    body.addShape(shape);
    body.velocity.set(velocity.x, velocity.y, velocity.z);
    world.addBody(body);  // Ensure world is used here

    return {
        id,
        mesh,
        body,
        update() {
            // Sync mesh position with physics body
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
            // console.log('Ball position during update:', this.mesh.position);
        }
    };
}
// game-client\src\utils\initPhysics.js
import { World, Body, Plane, Vec3 } from 'cannon-es';

export function initPhysics() {
    const world = new World();
    world.gravity.set(0, -9.82, 0);

    // Create ground
    const groundBody = new Body({ mass: 0 });
    groundBody.addShape(new Plane());
    groundBody.position.set(0, 0, 0);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    return world;
}

export function updatePhysics(world, balls) {
    world.step(1 / 60);  // Step the physics world

    // Update all ball positions based on physics simulation
    balls.forEach(ball => ball.update());
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


    // Invisible plane for mouse interaction
    const invisiblePlaneGeometry = new THREE.PlaneGeometry(100, 100);
    const invisiblePlaneMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const invisiblePlane = new THREE.Mesh(invisiblePlaneGeometry, invisiblePlaneMaterial);
    invisiblePlane.position.y = 0;
    invisiblePlane.rotation.x = -Math.PI / 2;
    scene.add(invisiblePlane);

    // Render function
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    return { scene, camera, renderer };
}
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

    socket.on('disconnect', () => {
        console.log('A player disconnected');
        players = players.filter(player => player.id !== socket.id);
        io.emit('playerUpdate', players);
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
