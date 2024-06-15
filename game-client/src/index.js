import { initScene } from './utils/initScene';
import { createPlayer, updatePlayerState, renderBalls } from './components/player';
import { handleSocketConnections, handleEvents, broadcastBallRemoval } from './utils/networking';
import { initPhysics, updatePhysics } from './utils/initPhysics';

document.addEventListener('DOMContentLoaded', () => {
    const scene = initScene();
    const player = createPlayer(scene);
    const balls = [];
    const world = initPhysics();

    console.log('Physics world initialized:', world);  // Add logging to check the world object

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

    handleSocketConnections(scene, player, balls, world);
    handleEvents(scene, player, balls, world);

    function detectCollisions() {
        balls.forEach((ball, index) => {
            const distance = player.position.distanceTo(ball.mesh.position);
            if (distance < 1) {
                // Collision detected
                scene.remove(ball.mesh);
                world.removeBody(ball.body);
                balls.splice(index, 1);

                // Broadcast ball removal
                broadcastBallRemoval(ball.id);
            }
        });
    }

    function gameLoop() {
        updatePlayerState(player, input);
        updatePhysics(world, balls);
        renderBalls(scene, balls);
        detectCollisions();  // Check for collisions
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});
