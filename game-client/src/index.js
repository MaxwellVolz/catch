// src/index.js
import { connectWebSocket } from './components/socket.js';
import { initScene, animate } from './components/scene.js';

console.log('Initializing game client...');
connectWebSocket();
initScene();
animate();
