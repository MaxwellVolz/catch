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
        balls.forEach((ball, index) => {
            Object.values(players).forEach(p => {
                const distance = p.mesh.position.distanceTo(ball.mesh.position);
                if (distance < 1.5) { // Increase the collision radius
                    handleBallCatch(ball, index, p);
                }
            });

            // Check if the ball touches the ground
            if (ball.mesh.position.y <= 0.5) {
                handleBallTouchGround(ball, index);
            }
        });
    }

    function handleBallCatch(ball, index, catcher) {
        scene.remove(ball.mesh);
        scene.remove(markers.get(ball.id));  // Remove marker from scene
        world.removeBody(ball.body);
        balls.splice(index, 1);
        markers.delete(ball.id);  // Remove marker from map
        broadcastBallRemoval(ball.id);

        // Log catch event
        console.log(`Ball caught by player ${catcher.mesh.name}, thrown by player ${ball.thrower}`);

        // Update catch count
        if (players[ball.thrower]) {
            catcher.catchCount++;
            players[ball.thrower].catchCount = catcher.catchCount; // Sync both players' catch count
            updateCatchDisplay(ball.thrower, ball.initialPosition, catcher.mesh.position, catcher.catchCount, scene);
        }

        // Reset cooldown
        catcher.canThrow = true;
    }

    function handleBallTouchGround(ball, index) {
        // Log ground hit event
        console.log(`Ball thrown by player ${ball.thrower} hit the ground`);

        // Reset thrower's catch count if exists
        if (players[ball.thrower]) {
            players[ball.thrower].catchCount = 0; // Reset thrower's catch count
        }

        // Remove the ball from tracking structures
        scene.remove(ball.mesh);
        scene.remove(markers.get(ball.id));  // Remove marker from scene
        world.removeBody(ball.body);
        balls.splice(index, 1);
        markers.delete(ball.id);  // Remove marker from map
        broadcastBallRemoval(ball.id);
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
