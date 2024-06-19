import { updatePlayerState, renderBalls, updateAnimation } from '../components/player';
import { updatePhysics } from '../utils/environment';
import { detectCollisions, handleBallCatch, handleBallTouchGround } from '../handlers/collision';
import { updateMarkers } from '../handlers/markerUpdate';
import { broadcastBallRemoval, socket } from '../core/networking';

export function gameLoop(player, input, world, balls, scene, players, markers, camera) {
    if (!player || !player.mesh) {
        console.error('Player or player.mesh is undefined in gameLoop', player);
        return;
    }

    let lastTime = performance.now();

    const loop = () => {
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;

        updatePlayerState(player, input, camera);
        updatePhysics(world, balls);
        renderBalls(scene, balls);
        detectCollisions(balls, players, scene, world, markers, broadcastBallRemoval, handleBallCatch, handleBallTouchGround, socket);
        updateMarkers(balls, markers);
        updateAnimation(deltaTime);

        requestAnimationFrame(loop);
    };

    loop();
}
