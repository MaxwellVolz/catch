// game-client\src\index.js

import { initEnvironment, updatePhysics } from './utils/initEnvironment';
import { createPlayer, updatePlayerState, renderBalls, createBall } from './components/player';
import { handleSocketConnections, handleEvents, broadcastBallRemoval } from './utils/networking';
import { setupEventHandlers } from './utils/eventHandlers';
import { createMarker } from './utils/createMarker';
import { Vector3, Raycaster } from 'three';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

document.addEventListener('DOMContentLoaded', () => {
    const { scene, camera, renderer, world, player } = initEnvironment();
    player.canThrow = true;
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

    handleSocketConnections(scene, player, balls, world, markers, createMarker);
    handleEvents(scene, player, balls, world);

    function detectCollisions() {
        balls.forEach((ball, index) => {
            const distance = player.mesh.position.distanceTo(ball.mesh.position);
            if (distance < 1) {
                scene.remove(ball.mesh);
                scene.remove(markers.get(ball.id));  // Remove marker from scene
                world.removeBody(ball.body);
                balls.splice(index, 1);
                markers.delete(ball.id);  // Remove marker from map
                broadcastBallRemoval(ball.id);

                // Reset cooldown
                player.canThrow = true;
            }
        });
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
