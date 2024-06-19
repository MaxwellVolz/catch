

lets rework animation.js

its not a good design

events will trigger animation states

depending on state we will play the animation one time (catch, pickup)

or loop continuously (idle, run)




we broke the player...lets try again...first

1. player moves with WASD
   1. this is needs to be in relation to the camera. 
   2. W moves away from the camera
   3. S moves towards the camera
   4. A moves parallel to the camera to the left
   5. D moves parallel to the camera to the right
2. the invisible "ball" that is used for the character position should not rotationOffset
3. the visible mesh for the character should rotate


lets simplify our animation controller and fix it

the character should default to looping on the idle animation

if the character is moving loop the running animation

if the character touches a ball that has touched the ground play pickup once
if the character touches a ball that has not touched the ground play catch once


'C:\Users\narfa\Documents\_git\catch\game-client\src\index.js'

```js
import { initializeGame } from './core/init';
import { gameLoop } from './core/gameLoop';
import { handleBallCatch, handleBallTouchGround } from './handlers/collision';
import { broadcastBallRemoval, socket } from './core/networking';
import { onWindowResize } from './utils/window';
import { updateAnimation } from './components/player';

document.addEventListener('DOMContentLoaded', async () => {
    const game = await initializeGame();

    if (!game) {
        console.error('Failed to initialize the game');
        return;
    }

    const { scene, camera, renderer, world, player, players, balls, markers, input } = game;

    // Handle window resize
    onWindowResize(camera, renderer);

    let lastTime = performance.now();

    const animate = () => {
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;

        renderer.render(scene, camera);
        updateAnimation(deltaTime); // Update animations
        requestAnimationFrame(animate);
    };

    animate();

    gameLoop(player, input, world, balls, scene, players, markers, broadcastBallRemoval, handleBallCatch, handleBallTouchGround, socket);
});
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\utils\animation.js'

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

const gltfLoader = new GLTFLoader();
const AllActions = {};
const publicDir = '/assets/';

export async function setupAnimationModels(scene) {
    try {
        const modelUrl = 'iron_man.glb';  // Update to your model file name
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
        ];

        for (const url of animGlbs) {
            const fullUrl = publicDir + 'anims/' + url;
            console.log('Fetching animation from URL:', fullUrl);

            const animGltf = await gltfLoader.loadAsync(fullUrl);
            const clip = animGltf.animations[0];
            const actionName = url.split('.')[0]; // Use file name as action name
            const action = mixer.clipAction(clip);
            action.loop = THREE.LoopRepeat; // Set the action to loop continuously
            AllActions[actionName] = action;
            console.log(`Loaded animation: ${actionName}`);
        }

        console.log('All loaded actions:', Object.keys(AllActions));
        return AllActions;
    } catch (error) {
        console.error('Error loading animations:', error);
        throw error;
    }
}

export function playAction(actionName) {
    console.log(`Attempting to play action: ${actionName}`);
    const action = AllActions[actionName];
    if (action) {
        console.log(`Playing action: ${actionName}`);
        action.reset().fadeIn(0.5).play();
        for (const name in AllActions) {
            if (name !== actionName) {
                AllActions[name].fadeOut(0.5);
            }
        }
    } else {
        console.error(`Action not found: ${actionName}`);
    }
}

export function updateMixer(mixer, deltaTime) {
    if (mixer) {
        mixer.update(deltaTime);
    } else {
        console.error('Mixer not defined');
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
    camera.position.set(0, 25, 25);
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
// game-client\src\utils\textUtils.js
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

'C:\Users\narfa\Documents\_git\catch\game-client\src\components\player.js'

```js
import * as THREE from 'three';
import { Body, Box, Sphere, Vec3 } from 'cannon-es';
import { setupAnimationModels, playAction, updateMixer } from '../utils/animation';

let mixer, actions = {};

export async function createPlayer(scene, world) {
    try {
        const { model, mixer: playerMixer, animations } = await setupAnimationModels(scene);
        mixer = playerMixer;
        actions = animations;

        const shape = new Box(new Vec3(0.5, 0.5, 0.5));
        const body = new Body({ mass: 1 });
        body.addShape(shape);
        body.position.set(0, 0.5, 0);
        world.addBody(body);

        const player = {
            mesh: new THREE.Object3D(), // Placeholder for the player object
            body,
            char_model: model, // Separate character model
            velocity: new THREE.Vector3(),
            currentAction: 'idle',
            rotationOffset: Math.PI / 2 // Example offset, adjust as needed
        };

        player.mesh.add(player.char_model); // Attach the char_model to the player mesh
        scene.add(player.mesh);

        playAction('idle');

        console.log('Player created:', player); // Log the player object

        return player;
    } catch (error) {
        console.error('Error creating player:', error); // Log if there's an error creating the player
    }
}

export function updatePlayerState(player, input) {
    if (!player || !player.mesh) {
        console.error('Player or player.mesh is undefined', player); // Log if player or player.mesh is undefined
        return;
    }

    const speed = 0.1;
    const turnSpeed = 0.05;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.mesh.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(player.mesh.quaternion);

    let moving = false;

    if (input.forward) {
        player.mesh.position.add(forward.multiplyScalar(speed));
        moving = true;
    }
    if (input.backward) {
        player.mesh.position.add(forward.multiplyScalar(-speed));
        moving = true;
    }
    if (input.left) {
        player.mesh.position.add(right.multiplyScalar(-speed));
        moving = true;
    }
    if (input.right) {
        player.mesh.position.add(right.multiplyScalar(speed));
        moving = true;
    }
    if (input.turnLeft) {
        player.mesh.rotation.y += turnSpeed;
    }
    if (input.turnRight) {
        player.mesh.rotation.y -= turnSpeed;
    }

    player.velocity.copy(player.mesh.position).sub(player.body.position);
    player.body.position.copy(player.mesh.position);

    // Update rotation to face the direction of movement without affecting controls
    if (moving) {
        const angle = Math.atan2(-player.velocity.z, player.velocity.x);
        player.char_model.rotation.y = angle + Math.PI / 2; // Adjust the offset as needed
    }

    if (moving && player.currentAction !== 'run') {
        playAction('run');
        player.currentAction = 'run';
    } else if (!moving && player.currentAction !== 'idle') {
        playAction('idle');
        player.currentAction = 'idle';
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
    updateMixer(mixer, deltaTime);
}

export { playAction };

export function createBall(id, position, rotation, velocity, world, thrower) {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    const ballPosition = position.clone();
    ballPosition.y += 1;
    mesh.position.copy(ballPosition);
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
        update() {
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
        }
    };
}
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\handlers\collision.js'

```js
// src/handlers/collision.js

import { updateCatchDisplay } from '../utils/textUtils';
import { playAction } from '../components/player'; // Import playAction

export function detectCollisions(balls, players, scene, world, markers, broadcastBallRemoval, handleBallCatch, handleBallTouchGround, socket) {
    balls.forEach(ball => {
        Object.values(players).forEach(p => {
            const distance = p.mesh.position.distanceTo(ball.mesh.position);
            if (distance < 1.5) { // Increase the collision radius
                console.log(`Collision detected between player ${p.mesh.name} and ball ${ball.id}`);
                handleBallCatch(ball.id, p, balls, scene, markers, world, players, broadcastBallRemoval, socket);
                playAction('catch'); // Play catch animation
            }
        });

        // Check if the ball touches the ground
        if (ball.mesh.position.y <= 0.5) {
            console.log(`Ball ${ball.id} touched the ground`);
            handleBallTouchGround(ball.id, balls, players);
            playAction('pickup'); // Play pickup animation
        }
    });
}

export function handleBallCatch(ballId, catcher, balls, scene, markers, world, players, broadcastBallRemoval, socket) {
    const ballIndex = balls.findIndex(b => b.id === ballId);
    if (ballIndex === -1) return; // Ball not found

    const ball = balls[ballIndex];
    if (ball.processed) return; // Ball already processed

    ball.processed = true;

    // Always remove the ball from the scene and physics world
    scene.remove(ball.mesh);
    scene.remove(markers.get(ball.id));  // Remove marker from scene
    world.removeBody(ball.body);
    balls.splice(ballIndex, 1);
    markers.delete(ball.id);  // Remove marker from map
    broadcastBallRemoval(ball.id);

    if (ball.hitGround) {
        // Log ground hit event
        console.log(`Ball caught by player ${catcher.mesh.name} which had already hit the ground, thrown by player ${ball.thrower}`);
        return; // Do not update the catch count
    }

    // Log catch event
    console.log(`Ball caught by player ${catcher.mesh.name}, thrown by player ${ball.thrower}`);

    // Update catch count
    if (players[ball.thrower]) {
        catcher.catchCount++;
        players[ball.thrower].catchCount = catcher.catchCount; // Sync both players' catch count
        updateCatchDisplay(ball.thrower, ball.initialPosition, catcher.mesh.position, catcher.catchCount, scene);
    }

    // Emit catch update
    socket.emit('catchUpdate', {
        catcherId: catcher.mesh.name,
        throwerId: ball.thrower,
        catchCount: catcher.catchCount
    });

    // Reset cooldown
    catcher.canThrow = true;
}

export function handleBallTouchGround(ballId, balls, players) {
    const ball = balls.find(b => b.id === ballId);
    if (!ball) return;

    // Log ground hit event
    console.log(`Ball thrown by player ${ball.thrower} hit the ground`);

    // Mark the ball as having hit the ground
    ball.hitGround = true;

    // Reset thrower's catch count if exists
    if (players[ball.thrower]) {
        players[ball.thrower].catchCount = 0; // Reset thrower's catch count
    }
}
```

'C:\Users\narfa\Documents\_git\catch\game-client\src\handlers\events.js'

```js
// game-client/src/utils/eventHandlers.js
import * as THREE from 'three';

function setupKeyboardEventHandlers(input) {
    window.addEventListener('keydown', (event) => {
        if (event.key === 'w') input.forward = true;
        if (event.key === 's') input.backward = true;
        if (event.key === 'a') input.left = true;
        if (event.key === 'd') input.right = true;
        if (event.key === 'q') input.turnLeft = true;
        if (event.key === 'e') input.turnRight = true;
    });

    window.addEventListener('keyup', (event) => {
        if (event.key === 'w') input.forward = false;
        if (event.key === 's') input.backward = false;
        if (event.key === 'a') input.left = false;
        if (event.key === 'd') input.right = false;
        if (event.key === 'q') input.turnLeft = false;
        if (event.key === 'e') input.turnRight = false;
    });
}

function setupMouseEventHandlers(player, raycaster, mouse, camera, renderer, socket, balls) {
    let isCharging = false;
    let chargeStartTime = 0;
    let chargeEndTime = 0;

    window.addEventListener('mousedown', (event) => {
        if (!player.canThrow) return;
        isCharging = true;
        chargeStartTime = Date.now();
    });

    window.addEventListener('mouseup', (event) => {
        if (!isCharging) return;
        isCharging = false;
        chargeEndTime = Date.now();

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

        const ballData = {
            id: socket.id + Date.now(),
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
    });
}

export function setupEventHandlers(input, player, raycaster, mouse, camera, renderer, socket, balls, canThrow, isCharging, chargeStartTime, chargeEndTime) {
    setupKeyboardEventHandlers(input);
    setupMouseEventHandlers(player, raycaster, mouse, camera, renderer, socket, balls, canThrow, isCharging, chargeStartTime, chargeEndTime);
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

'C:\Users\narfa\Documents\_git\catch\game-server\src\bones_fix.js'

```js
const fs = require('fs');
const path = require('path');
const gltfPipeline = require('gltf-pipeline');

const directory = './gltf_output';
const pattern = /mixa\w*:/g;

function processGlbFile(filePath) {
    const fileData = fs.readFileSync(filePath);
    gltfPipeline.gltfToGlb(fileData)
        .then(results => {
            let json = JSON.stringify(results.gltf);
            json = json.replace(pattern, '');

            gltfPipeline.glbToGltf(Buffer.from(json))
                .then(newResults => {
                    fs.writeFileSync(filePath, Buffer.from(newResults.glb));
                    console.log(`Processed file: ${filePath}`);
                })
                .catch(err => {
                    console.error(`Error converting GLTF to GLB for file ${filePath}: ${err}`);
                });
        })
        .catch(err => {
            console.error(`Error processing file ${filePath}: ${err}`);
        });
}

fs.readdirSync(directory).forEach(file => {
    if (path.extname(file) === '.glb') {
        processGlbFile(path.join(directory, file));
    }
});
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

let players = [];
let balls = [];

io.on('connection', (socket) => {
    console.log('A player connected');

    socket.on('playerUpdate', (data) => {
        const existingPlayer = players.find(player => player.id === data.id);
        if (existingPlayer) {
            existingPlayer.position = data.position;
        } else {
            players.push(data);
        }

        io.emit('playerUpdate', players);
    });

    socket.on('ballThrown', (data) => {
        console.log('Received ballThrown event:', data);
        balls.push(data);
        io.emit('ballThrown', data);
    });

    socket.on('ballRemoved', (data) => {
        console.log('Received ballRemoved event:', data);
        balls = balls.filter(ball => ball.id !== data.id);
        io.emit('ballRemoved', data);
    });

    socket.on('catchUpdate', (data) => {
        console.log('Catch update received:', data);
        io.emit('catchUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log('A player disconnected');
        players = players.filter(player => player.id !== socket.id);
        io.emit('playerDisconnected', { id: socket.id }); // Emit disconnection event
        io.emit('playerUpdate', players);
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
```
