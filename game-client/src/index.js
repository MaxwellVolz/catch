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
