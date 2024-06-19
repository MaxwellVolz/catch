import { initEnvironment } from '../utils/environment';
import { initializeSocket, handleEvents, socket } from '../core/networking'; // Import socket here
import { setupEventHandlers } from '../handlers/events';
import { createPlayer } from '../components/player';
import { onWindowResize } from '../utils/window';
import { Raycaster, Vector3 } from 'three';
import * as THREE from 'three';

async function setupPlayer(scene, world) {
    const player = await createPlayer(scene, world);
    if (!player || !player.mesh) {
        throw new Error('Failed to create player or player mesh is missing');
    }
    player.canThrow = true;
    player.catchCount = 0;
    return player;
}

function setupGameEntities(scene, camera, renderer, world) {
    const players = {};
    const balls = [];
    const markers = new Map();
    const raycaster = new Raycaster();
    const mouse = new THREE.Vector3();
    const input = {
        forward: false,
        backward: false,
        left: false,
        right: false,
    };

    return { players, balls, markers, raycaster, mouse, input };
}

export async function initializeGame() {
    try {
        const { scene, camera, renderer, world } = initEnvironment();
        const player = await setupPlayer(scene, world);
        const entities = setupGameEntities(scene, camera, renderer, world);

        // Initialize socket and set up players
        initializeSocket(scene, player, entities.balls, world, entities.markers);
        entities.players[socket.id] = player; // Ensure socket is defined before using it

        // Setup event handlers after socket initialization
        setupEventHandlers(entities.input, player, entities.raycaster, entities.mouse, camera, renderer, socket, entities.balls);
        handleEvents(scene, player, entities.balls, world, entities.players);

        onWindowResize(camera, renderer); // Handle window resize events

        return {
            scene, camera, renderer, world, player, ...entities
        };
    } catch (error) {
        console.error('Error initializing game:', error);
        return null;
    }
}
