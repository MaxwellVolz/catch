
'C:\Users\narfa\Documents\_git\catch\game-client\src\controllers\ball.js'

```js
import * as THREE from 'three';
import { Body, Sphere } from 'cannon-es';

export function createBall(id, position, rotation, velocity, world, thrower) {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    const ballPosition = position.clone();
    ballPosition.y += 1;
    mesh.position.copy(ballPosition);

    // Ensure rotation order is set correctly
    rotation.order = 'XYZ';
    mesh.rotation.copy(rotation);

    const shape = new Sphere(0.5);
    const body = new Body({ mass: 0.05, position: ballPosition });
    body.addShape(shape);
    body.velocity.set(velocity.x, velocity.y, velocity.z);
    world.addBody(body);

    return {
        id,
        mesh,
        body,
        thrower,
        initialPosition: position.clone(), // Ensure initial position is set
        update() {
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
        }
    };
}
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\controllers\player.js'

```js
import * as THREE from 'three';
import { Body, Sphere } from 'cannon-es';
import { setupAnimationModels, playAction, updateMixer, playOnce } from '../utils/animation';
import { handlePlayerMovement } from './playerMovement';

let mixer, actions = {};

export async function createPlayer(scene, world) {
    try {
        const { model, mixer: playerMixer, animations } = await setupAnimationModels(scene);
        mixer = playerMixer;
        actions = animations;

        const shape = new Sphere(0.5);
        const body = new Body({ mass: 1 });
        body.addShape(shape);
        body.position.set(0, 0.5, 0);
        world.addBody(body);

        const player = {
            mesh: new THREE.Object3D(),
            body,
            char_model: model,
            velocity: new THREE.Vector3(),
            currentAction: 'run',
            actions // Ensure actions are correctly set here
        };

        player.mesh.add(player.char_model);
        scene.add(player.mesh);

        playAction('run', player);  // Play the default run animation

        console.log('Player created:', player);

        return player;
    } catch (error) {
        console.error('Error creating player:', error);
    }
}

export function updatePlayerState(player, input, camera) {
    const moving = handlePlayerMovement(player, input, camera);

    if (moving) {
        if (player.currentAction !== 'run') {
            playAction('run', player);
            player.currentAction = 'run';
        }
    } else {
        if (player.currentAction !== 'idle') {
            playAction('idle', player);
            player.currentAction = 'idle';
        }
    }
}

export function renderBalls(scene, balls) {
    balls.forEach(ball => {
        ball.update();
        if (!scene.children.includes(ball.mesh)) {
            scene.add(ball.mesh);
        }
    });
}

export function updateAnimation(deltaTime) {
    updateMixer(deltaTime, mixer);
}

export { playAction, playOnce };
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\controllers\playerMovement.js'

```js
import * as THREE from 'three';

export function handlePlayerMovement(player, input, camera) {
    if (!player || !player.mesh) {
        console.error('Player or player.mesh is undefined', player);
        return;
    }

    const speed = 0.1;
    const moveDirection = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    const forward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    let moving = false;

    if (input.forward) {
        player.mesh.position.add(forward.clone().multiplyScalar(speed));
        moveDirection.add(forward);
        moving = true;
    }
    if (input.backward) {
        player.mesh.position.add(forward.clone().negate().multiplyScalar(speed));
        moveDirection.add(forward.clone().negate());
        moving = true;
    }
    if (input.left) {
        player.mesh.position.add(right.clone().negate().multiplyScalar(speed));
        moveDirection.add(right.clone().negate());
        moving = true;
    }
    if (input.right) {
        player.mesh.position.add(right.clone().multiplyScalar(speed));
        moveDirection.add(right);
        moving = true;
    }

    if (moving) {
        moveDirection.normalize();
        player.velocity.copy(player.mesh.position).sub(player.body.position);
        player.body.position.copy(player.mesh.position);

        // Update character model orientation based on movement direction
        const angle = Math.atan2(moveDirection.x, moveDirection.z);
        player.char_model.rotation.y = angle;
    }

    return moving;
}
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\index.js'

```js
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

```

'C:\Users\narfa\Documents\_git\catch\game-client\src\core\gameLoop.js'

```js
import { updatePlayerState, renderBalls, updateAnimation } from '../controllers/player';
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
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\core\init.js'

```js
import { initEnvironment } from '../utils/environment';
import { initializeSocket, handleEvents, socket } from '../core/networking';
import { setupEventHandlers } from '../handlers/events';
import { createMarker } from '../utils/createMarker';
import { Raycaster, Vector3 } from 'three';
import { createPlayer } from '../controllers/player';
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
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\core\networking.js'

```js
import * as THREE from 'three';
import { createBall } from '../controllers/ball';
import { createMarker } from '../utils/createMarker'; // Import createMarker
import { setupAnimationModels, playAction } from '../utils/animation';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');
const ballMap = new Map();
const playerBallMap = new Map(); // Map to track which ball belongs to which player

async function handlePlayerUpdates(socket, players, scene) {
    socket.on('playerUpdate', async (data) => {
        if (!data || !Array.isArray(data)) {
            console.error('Invalid player update data received:', data);
            return;
        }

        console.log('Player update data received:', data);

        for (const update of data) {
            if (!update || !update.id || !update.position) {
                console.error('Invalid player update received:', update);
                continue;
            }

            if (update.id !== socket.id) {
                let otherPlayer = players[update.id];
                if (!otherPlayer) {
                    console.log('Creating new player for ID:', update.id);

                    const { model, mixer, animations } = await setupAnimationModels(scene);
                    const playerMesh = new THREE.Object3D();
                    playerMesh.add(model);
                    playerMesh.position.copy(update.position);

                    otherPlayer = {
                        mesh: playerMesh,
                        mixer,
                        actions: animations,
                        catchCount: 0,
                        canThrow: true,
                        currentAction: 'run'
                    };

                    playAction('run', otherPlayer);  // Play the default run animation

                    players[update.id] = otherPlayer;
                    scene.add(playerMesh);
                } else {
                    console.log('Updating player position for ID:', update.id);
                    if (otherPlayer.mesh) {
                        otherPlayer.mesh.position.copy(update.position);
                        otherPlayer.mesh.rotation.copy(update.rotation);
                        // otherPlayer.currentAction.copy(update.currentAction);
                    } else {
                        console.error('Player mesh is undefined for ID:', update.id);
                    }
                }
            }
        }

        // Log the current state of players
        console.log('Current state of players:', players);
    });

    socket.on('playerDisconnected', (data) => {
        if (!data || !data.id) {
            console.error('Invalid player disconnect data received:', data);
            return;
        }

        console.log('Player disconnected:', data.id);

        const disconnectedPlayer = players[data.id];
        if (disconnectedPlayer) {
            scene.remove(disconnectedPlayer.mesh);
            delete players[data.id];
        }

        // Log the current state of players after disconnect
        console.log('Current state of players after disconnect:', players);
    });
}

function handleBallUpdates(socket, balls, world, markers, scene) {
    socket.on('ballThrown', (data) => {
        if (!data || !data.id || !data.position || !data.rotation || !data.velocity) {
            console.error('Invalid ball thrown data received:', data);
            return;
        }

        console.log('Ball thrown data received:', data);

        // Remove existing ball if the player already has one
        if (playerBallMap.has(data.thrower)) {
            const existingBallId = playerBallMap.get(data.thrower);
            const existingBall = ballMap.get(existingBallId);
            if (existingBall) {
                scene.remove(existingBall.mesh);
                scene.remove(markers.get(existingBallId));
                world.removeBody(existingBall.body);
                balls.splice(balls.indexOf(existingBall), 1);
                ballMap.delete(existingBallId);
                markers.delete(existingBallId);
                playerBallMap.delete(data.thrower);
                socket.emit('ballRemoved', { id: existingBallId });
            }
        }

        // Create and track the new ball
        const position = new THREE.Vector3().copy(data.position);
        const rotation = new THREE.Euler().copy(data.rotation);
        rotation.order = 'XYZ'; // Ensure order is set correctly
        const velocity = new THREE.Vector3().copy(data.velocity);
        const ball = createBall(data.id, position, rotation, velocity, world, data.thrower);
        balls.push(ball);
        ballMap.set(data.id, ball);
        playerBallMap.set(data.thrower, data.id);

        const marker = createMarker();
        markers.set(data.id, marker);
        scene.add(marker);
    });

    socket.on('ballRemoved', (data) => {
        if (!data || !data.id) {
            console.error('Invalid ball removed data received:', data);
            return;
        }

        console.log('Ball removed data received:', data);

        const ball = ballMap.get(data.id);
        if (ball) {
            scene.remove(ball.mesh);
            scene.remove(markers.get(data.id));
            world.removeBody(ball.body);
            balls.splice(balls.indexOf(ball), 1);
            ballMap.delete(data.id);
            markers.delete(data.id);
            playerBallMap.delete(ball.thrower); // Ensure to remove the ball from the player's map
        }
    });
}

function initializeSocket(scene, player, balls, world, markers) {
    const players = {}; // Initialize players object here
    socket.on('connect', () => {
        console.log('Connected to server with socket ID:', socket.id);
        players[socket.id] = player;
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    handlePlayerUpdates(socket, players, scene);
    handleBallUpdates(socket, balls, world, markers, scene);

    window.addEventListener('beforeunload', () => socket.disconnect());

    return players; // Return the initialized players object
}

function broadcastBallRemoval(ballId) {
    console.log('Broadcasting ball removal:', ballId);
    socket.emit('ballRemoved', { id: ballId });
}

function handleEvents(scene, player, balls, world, players) {
    function emitPlayerUpdate() {
        if (player && player.mesh && player.mesh.position) {
            socket.emit('playerUpdate', {
                id: socket.id,
                position: player.mesh.position,
                rotation: player.mesh.rotation,
                currentAction: player.currentAction,
            });
        }
    }

    setInterval(emitPlayerUpdate, 1000); // Less frequent updates, adjust as needed
}

export {
    initializeSocket,
    broadcastBallRemoval,
    handleEvents,
    socket // Ensure this is exported
};
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\utils\animation.js'

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

const gltfLoader = new GLTFLoader();
const publicDir = '/assets/';

export async function setupAnimationModels(scene) {
    try {
        const modelUrl = 'man.glb';
        const fullUrl = publicDir + 'models/' + modelUrl;
        console.log('Fetching model from URL:', fullUrl);

        const gltf = await gltfLoader.loadAsync(fullUrl);
        const model = gltf.scene;

        model.traverse((n) => {
            if (n.isMesh) {
                n.castShadow = true;
                n.receiveShadow = true;
            }
        });

        scene.add(model);

        const mixer = new THREE.AnimationMixer(model);
        const animations = await loadAnimations(mixer);
        return { model, mixer, animations };
    } catch (error) {
        console.error('Error loading model:', error);
        throw error;
    }
}

async function loadAnimations(mixer) {
    try {
        const animGlbs = [
            'idle.glb',
            'run.glb',
            'pickup.glb',
            'catch.glb',
            'throw.glb'
        ];

        const actions = {};

        for (const url of animGlbs) {
            const fullUrl = publicDir + 'anims/' + url;
            console.log('Fetching animation from URL:', fullUrl);

            const animGltf = await gltfLoader.loadAsync(fullUrl);
            const clip = animGltf.animations[0];
            const actionName = url.split('.')[0];
            const action = mixer.clipAction(clip);
            action.loop = (actionName === 'idle' || actionName === 'run') ? THREE.LoopRepeat : THREE.LoopOnce;
            actions[actionName] = action;
            console.log(`Loaded animation: ${actionName}, duration: ${clip.duration}`);
        }

        console.log('All loaded actions:', Object.keys(actions));
        return actions;
    } catch (error) {
        console.error('Error loading animations:', error);
        throw error;
    }
}

export function playAction(actionName, player) {
    console.log(`Attempting to play action: ${actionName}`);
    if (!player.actions) {
        console.error('Player actions are undefined');
        return;
    }

    const action = player.actions[actionName];
    if (action) {
        console.log(`Playing action: ${actionName}`);
        action.reset().fadeIn(0.1).play();
        action.paused = false;
        if (player.currentAction && player.currentAction !== actionName) {
            const currentAction = player.actions[player.currentAction];
            if (currentAction) {
                currentAction.fadeOut(0.5);
                currentAction.paused = true;
            }
        }
        player.currentAction = actionName;
    } else {
        console.error(`Action not found: ${actionName}`);
    }
}

export function updateMixer(deltaTime, mixer) {
    if (mixer) {
        mixer.update(deltaTime);
    } else {
        console.error('Mixer not defined');
    }
}

export function resetAction(actionName, actions) {
    const action = actions[actionName];
    if (action) {
        action.stop();
    }
}

export function playOnce(actionName, player) {
    console.log(`Attempting to play action once: ${actionName}`);
    if (!player.actions) {
        console.error('Player actions are undefined');
        return;
    }

    const action = player.actions[actionName];
    if (action) {
        action.reset().fadeIn(0.5).play();
        action.paused = false;
        action.clampWhenFinished = false;
        action.loop = THREE.LoopOnce;

        action.onFinished = () => {
            resetAction(actionName, player.actions);
            playAction('idle', player);
        };
    } else {
        console.error(`Action not found: ${actionName}`);
    }
}
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\utils\createMarker.js'

```js
// game-client\src\utils\createMarker.js

import * as THREE from 'three';

export function createMarker() {
    const geometry = new THREE.CircleGeometry(0.5, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0 }); // Initial opacity 0
    const marker = new THREE.Mesh(geometry, material);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(0, -1000, 0); // Set initial position out of view
    return marker;
}
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\utils\environment.js'

```js
import * as THREE from 'three';
import { World, Body, Plane, Vec3, Box } from 'cannon-es';
import { createTree, createBush, createPlaceholderObject } from './objects';

function createLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
}

function createGround(scene, world) {
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x005203 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    const groundBody = new Body({ mass: 0 });
    groundBody.addShape(new Plane());
    groundBody.position.set(0, 0, 0);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);
}

function createEnvironmentObjects(scene, world, seed) {
    for (let x = -50; x <= 50; x += 10 + seededRandom(seed) * 10) {
        for (let z = -50; z <= 50; z += 10 + seededRandom(seed + x * z) * 10) {
            if (seededRandom(seed + x + z) > 0.7) {
                createTree(scene, world, new Vec3(x, 0, z));
            } else if (seededRandom(seed + x + z * 2) > 0.4) {
                createBush(scene, world, new Vec3(x, 0, z));
            } else {
                createPlaceholderObject(scene, world, new Vec3(x, 0, z));
            }
        }
    }
}

function createPlayer(scene, world) {
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 0.5, 0);
    scene.add(player);

    const playerShape = new Box(new Vec3(0.5, 0.5, 0.5));
    const playerBody = new Body({ mass: 1 });
    playerBody.addShape(playerShape);
    playerBody.position.set(0, 0.5, 0);
    world.addBody(playerBody);

    return { mesh: player, body: playerBody };
}

function seededRandom(seed) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

export function initEnvironment() {
    const scene = new THREE.Scene();
    const world = new World();
    world.gravity.set(0, -9.82, 0);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createLighting(scene);
    createGround(scene, world);
    createEnvironmentObjects(scene, world, 12345);

    const player = createPlayer(scene, world);

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    return { scene, camera, renderer, world, player };
}

export function updatePhysics(world, objects) {
    if (!world) {
        console.error('World is undefined in updatePhysics'); // Log if world is undefined
        return;
    }
    world.step(1 / 60);
    objects.forEach(object => object.update());
}
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\utils\objects.js'

```js
import * as THREE from 'three';
import { Body, Cylinder, Sphere } from 'cannon-es';

export function createTree(scene, world, position) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(position.x, position.y + 1, position.z);

    const leavesGeometry = new THREE.SphereGeometry(1);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(position.x, position.y + 2.5, position.z);

    scene.add(trunk);
    scene.add(leaves);

    const trunkShape = new Cylinder(0.2, 0.2, 2, 8);
    const trunkBody = new Body({ mass: 0 });
    trunkBody.addShape(trunkShape);
    trunkBody.position.set(position.x, position.y + 1, position.z);
    world.addBody(trunkBody);

    const leavesShape = new Sphere(1);
    const leavesBody = new Body({ mass: 0 });
    leavesBody.addShape(leavesShape);
    leavesBody.position.set(position.x, position.y + 2.5, position.z);
    world.addBody(leavesBody);
}

export function createBush(scene, world, position) {
    const bushGeometry = new THREE.SphereGeometry(0.8);
    const bushMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(position.x, position.y + 0.1, position.z);
    scene.add(bush);

    const bushShape = new Sphere(0.8);
    const bushBody = new Body({ mass: 0 });
    bushBody.addShape(bushShape);
    bushBody.position.set(position.x, position.y + 0.1, position.z);
    world.addBody(bushBody);
}


export function createPlaceholderObject(scene, world, position) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(position.x, position.y + 1, position.z);

    const leavesGeometry = new THREE.SphereGeometry(1);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(position.x, position.y + 2.5, position.z);

    scene.add(trunk);
    scene.add(leaves);

    const trunkShape = new Cylinder(0.2, 0.2, 2, 8);
    const trunkBody = new Body({ mass: 0 });
    trunkBody.addShape(trunkShape);
    trunkBody.position.set(position.x, position.y + 1, position.z);
    world.addBody(trunkBody);

    const leavesShape = new Sphere(1);
    const leavesBody = new Body({ mass: 0 });
    leavesBody.addShape(leavesShape);
    leavesBody.position.set(position.x, position.y + 2.5, position.z);
    world.addBody(leavesBody);
}
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\utils\textUtils.js'

```js
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

export function createTextMesh(text, position, scene) {
    const loader = new FontLoader();
    loader.load('/assets/fonts/Tiny5_Regular.json', function (font) {
        const geometry = new TextGeometry(text, {
            font: font,
            size: 8, // Increased size for better readability
            height: 1, // Increased height for better readability
        });
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        scene.add(mesh);

        // Remove the text after a short duration
        setTimeout(() => {
            scene.remove(mesh);
        }, 2000); // Display for 2 seconds
    });
}

export function updateCatchDisplay(throwerId, throwPosition, catchPosition, count, scene) {
    if (!throwPosition || !catchPosition) {
        console.error('Invalid throw or catch position:', throwPosition, catchPosition);
        return;
    }

    const midPoint = new THREE.Vector3().addVectors(throwPosition, catchPosition).multiplyScalar(0.5);
    createTextMesh(count.toString(), midPoint, scene);
}
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\utils\window.js'

```js
// game-client/src/utils/resizeHandler.js

export function onWindowResize(camera, renderer) {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\handlers\collision.js'

```js
import { updateCatchDisplay } from '../utils/textUtils';
import { playAction, playOnce } from '../controllers/player';

export function detectCollisions(balls, players, scene, world, markers, broadcastBallRemoval, handleBallCatch, handleBallTouchGround, socket) {
    balls.forEach(ball => {
        Object.values(players).forEach(p => {
            if (!p.mesh || !ball.mesh) {
                console.error('Player mesh or ball mesh is undefined');
                return;
            }

            const distance = p.mesh.position.distanceTo(ball.mesh.position);
            if (distance < 1.5) {
                console.log(`Collision detected between player ${p.mesh.name} and ball ${ball.id}`);
                if (ball.hitGround) {
                    handleBallCatch(ball.id, p, balls, scene, markers, world, players, broadcastBallRemoval, socket);
                    playOnce('pickup', players); // Play pickup animation once
                } else {
                    handleBallCatch(ball.id, p, balls, scene, markers, world, players, broadcastBallRemoval, socket);
                    playOnce('catch', p); // Play catch animation once
                }
            }
        });

        // Check if the ball touches the ground
        if (ball.mesh.position.y <= 0.5) {
            console.log(`Ball ${ball.id} touched the ground`);
            handleBallTouchGround(ball.id, balls, players);
        }
    });
}

export function handleBallCatch(ballId, catcher, balls, scene, markers, world, players, broadcastBallRemoval, socket) {
    const ballIndex = balls.findIndex(b => b.id === ballId);
    if (ballIndex === -1) return;

    const ball = balls[ballIndex];
    if (ball.processed) return;

    ball.processed = true;

    scene.remove(ball.mesh);
    scene.remove(markers.get(ball.id));
    world.removeBody(ball.body);
    balls.splice(ballIndex, 1);
    markers.delete(ball.id);
    broadcastBallRemoval(ball.id);

    if (ball.hitGround) {
        console.log(`Ball caught by player ${catcher.mesh.name} which had already hit the ground, thrown by player ${ball.thrower}`);
        return;
    }

    console.log(`Ball caught by player ${catcher.mesh.name}, thrown by player ${ball.thrower}`);

    // Ensure that the initial position and catch position are valid
    if (ball.initialPosition && catcher.mesh.position) {
        updateCatchDisplay(ball.thrower, ball.initialPosition, catcher.mesh.position, catcher.catchCount, scene);
    } else {
        console.error('Invalid initial or catch position:', ball.initialPosition, catcher.mesh.position);
    }

    if (players[ball.thrower]) {
        catcher.catchCount++;
        players[ball.thrower].catchCount = catcher.catchCount;
    }

    socket.emit('catchUpdate', {
        catcherId: catcher.mesh.name,
        throwerId: ball.thrower,
        catchCount: catcher.catchCount
    });

    catcher.canThrow = true;
}

export function handleBallTouchGround(ballId, balls, players) {
    const ball = balls.find(b => b.id === ballId);
    if (!ball) return;

    // console.log(`Ball thrown by player ${ball.thrower} hit the ground`);
    ball.hitGround = true;

    if (players[ball.thrower]) {
        players[ball.thrower].catchCount = 0;
    }
}
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\handlers\events.js'

```js
import * as THREE from 'three';
import { playAction, playOnce } from '../controllers/player';

function setupKeyboardEventHandlers(input) {
    const keyDownHandler = (event) => {
        switch (event.key) {
            case 'w': input.forward = true; break;
            case 's': input.backward = true; break;
            case 'a': input.left = true; break;
            case 'd': input.right = true; break;
        }
    };

    const keyUpHandler = (event) => {
        switch (event.key) {
            case 'w': input.forward = false; break;
            case 's': input.backward = false; break;
            case 'a': input.left = false; break;
            case 'd': input.right = false; break;
        }
    };

    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);

    // Clean up event listeners on unload
    window.addEventListener('beforeunload', () => {
        window.removeEventListener('keydown', keyDownHandler);
        window.removeEventListener('keyup', keyUpHandler);
    });
}

function setupMouseEventHandlers(player, raycaster, mouse, camera, renderer, socket, balls) {
    let isCharging = false;
    let chargeStartTime = 0;

    const mouseDownHandler = () => {
        if (!player || !player.canThrow) return;
        isCharging = true;
        chargeStartTime = Date.now();
    };


    const mouseUpHandler = (event) => {
        if (!isCharging) return;
        isCharging = false;
        const chargeEndTime = Date.now();

        if (!player || !player.mesh || !player.mesh.position || !player.mesh.rotation) {
            console.error('Player or player properties are undefined');
            return;
        }

        const chargeDuration = (chargeEndTime - chargeStartTime) / 1000;
        const maxChargeDuration = 3;
        const chargeFactor = Math.min(chargeDuration / maxChargeDuration, 1);
        const throwPower = 50;

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersectPoint = new THREE.Vector3();
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        raycaster.ray.intersectPlane(plane, intersectPoint);

        const distance = player.mesh.position.distanceTo(intersectPoint);
        let angle = 80 - (distance / 10) * 70;
        angle = Math.max(angle, 20);

        const direction = new THREE.Vector3().subVectors(intersectPoint, player.mesh.position).normalize();
        const horizontalDistance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        direction.y = Math.tan(angle * (Math.PI / 180)) * horizontalDistance;
        direction.normalize();

        const velocity = direction.multiplyScalar(throwPower * chargeFactor);

        // Make the character face the throw direction
        player.char_model.rotation.y = Math.atan2(direction.x, direction.z);

        // Play throw animation
        playOnce('throw', player);

        // Delay the throw event to sync with the throw animation
        setTimeout(() => {
            const ballData = {
                id: socket.id + Date.now().toString(),
                position: { x: player.mesh.position.x, y: player.mesh.position.y + 1.0, z: player.mesh.position.z },
                rotation: { _x: player.mesh.rotation.x, _y: player.mesh.rotation.y, _z: player.mesh.rotation.z },
                velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
                thrower: socket.id,
                initialPosition: player.mesh.position.clone()
            };

            console.log('Emitting ballThrown event:', ballData);
            socket.emit('ballThrown', ballData);

            player.canThrow = false;
            setTimeout(() => {
                player.canThrow = true;
            }, 2000);
        }, 750); // Adjust the delay as needed to sync with the throw animation
    };

    window.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('mouseup', mouseUpHandler);

    // Clean up event listeners on unload
    window.addEventListener('beforeunload', () => {
        window.removeEventListener('mousedown', mouseDownHandler);
        window.removeEventListener('mouseup', mouseUpHandler);
    });
}

export function setupEventHandlers(input, player, raycaster, mouse, camera, renderer, socket, balls) {
    setupKeyboardEventHandlers(input);
    setupMouseEventHandlers(player, raycaster, mouse, camera, renderer, socket, balls);
}
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\handlers\markerUpdate.js'

```js
// src/handlers/markerUpdate.js

export function updateMarkers(balls, markers) {
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
```

'C:\Users\narfa\Documents\_git\catch\game-server\src\server.js'

```js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    }
});

let players = {};
let balls = {};

io.on('connection', (socket) => {
    console.log('A player connected: ' + socket.id);

    socket.on('playerUpdate', (data) => {
        if (!data || !data.id || !data.position) {
            console.error('Invalid player update data received:', data);
            return;
        }

        players[socket.id] = data;
        io.emit('playerUpdate', Object.values(players));
    });

    socket.on('ballThrown', (data) => {
        if (!data || !data.id || !data.position || !data.rotation || !data.velocity) {
            console.error('Invalid ball thrown data received:', data);
            return;
        }

        balls[data.id] = data;
        io.emit('ballThrown', data);
    });

    socket.on('ballRemoved', (data) => {
        if (!data || !data.id) {
            console.error('Invalid ball removed data received:', data);
            return;
        }

        delete balls[data.id];
        io.emit('ballRemoved', data);
    });

    socket.on('catchUpdate', (data) => {
        if (!data || !data.catcherId || !data.catchCount) {
            console.error('Invalid catch update data received:', data);
            return;
        }

        if (players[data.catcherId]) {
            players[data.catcherId].catchCount = data.catchCount;
            io.emit('catchUpdate', data);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        console.log(`Player disconnected: ${socket.id}`);
        io.emit('playerDisconnected', { id: socket.id });
        io.emit('playerUpdate', Object.values(players));
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
```
