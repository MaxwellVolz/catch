import { initializeGame } from './core/init';
import { gameLoop } from './core/gameLoop';

document.addEventListener('DOMContentLoaded', async () => {
    const game = await initializeGame();

    if (!game) {
        console.error('Failed to initialize the game');
        return;
    }

    const { scene, camera, renderer, world, player, players, balls, markers, input } = game;

    gameLoop(player, input, world, balls, scene, players, markers, camera); // Pass camera to gameLoop
});
