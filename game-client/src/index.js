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
