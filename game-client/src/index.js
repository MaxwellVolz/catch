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

    handleSocketConnections(scene, player, balls);
    handleEvents(scene, player, balls);

    function gameLoop() {
        updatePlayerState(player, input);
        renderBalls(scene, balls);
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});
