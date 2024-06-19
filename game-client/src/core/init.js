import { initEnvironment } from '../utils/environment';
import { initializeSocket, handleEvents, socket } from '../core/networking';
import { setupEventHandlers } from '../handlers/events';
import { createMarker } from '../utils/createMarker';
import { Raycaster, Vector3 } from 'three';
import { createPlayer } from '../components/player';
import { onWindowResize } from '../utils/window';

export async function initializeGame() {
    try {
        const { scene, camera, renderer, world } = initEnvironment();
        const player = await createPlayer(scene, world);

        if (!player || !player.mesh) {
            throw new Error('Player or player.mesh is not defined');
        }

        player.canThrow = true;
        player.catchCount = 0;
        const players = {};
        players[socket.id] = player;
        const balls = [];
        const markers = new Map();
        const raycaster = new Raycaster();
        const mouse = new Vector3();
        const ballMap = new Map();

        const input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
        };

        setupEventHandlers(input, player, raycaster, mouse, camera, renderer, socket, balls);
        initializeSocket(scene, player, balls, world, markers, createMarker, players);
        handleEvents(scene, player, balls, world, players);

        onWindowResize(camera, renderer);

        return { scene, camera, renderer, world, player, players, balls, markers, raycaster, mouse, ballMap, input };
    } catch (error) {
        console.error('Error initializing game:', error);
        return null;
    }
}
