// index.js

// Import necessary modules
import { initializeGame } from './core/init';
import { gameLoop } from './core/gameLoop';

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the game environment, networking, and initial game state
    const game = await initializeGame();

    // Check if the game was initialized successfully
    if (!game) {
        console.error('Failed to initialize the game');
        return;
    }

    // Extract necessary components from the initialized game object
    const { scene, camera, renderer, world, player, players, balls, markers, input } = game;

    // Start the game loop
    gameLoop(player, input, world, balls, scene, players, markers, camera);
});

