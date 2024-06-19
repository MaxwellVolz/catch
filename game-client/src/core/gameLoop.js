import { updatePlayerState, renderBalls, updateAnimation } from '../components/player';
import { updatePhysics } from '../utils/environment';
import { detectCollisions, handleBallCatch, handleBallTouchGround } from '../handlers/collision';
import { updateMarkers } from '../handlers/markerUpdate';
import { broadcastBallRemoval, socket } from '../core/networking';

function gameLoopInitializationCheck(player) {
    if (!player || !player.mesh) {
        console.error('Player or player.mesh is undefined at game loop start', player);
        return false;
    }
    return true;
}

export function gameLoop(player, input, world, balls, scene, players, markers, camera) {
    if (!gameLoopInitializationCheck(player)) return;

    let lastTime = performance.now();

    const loop = () => {
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000; // Convert milliseconds to seconds
        lastTime = currentTime;

        try {
            updatePlayerState(player, input, camera);
            updatePhysics(world, balls);
            renderBalls(scene, balls);
            detectCollisions(balls, players, scene, world, markers, broadcastBallRemoval, handleBallCatch, handleBallTouchGround, socket);
            updateMarkers(balls, markers);
            updateAnimation(deltaTime);
        } catch (error) {
            console.error('Error during game loop:', error);
            return; // Optionally add a mechanism to restart or recover the game loop
        }

        requestAnimationFrame(loop);
    };

    loop();
}
