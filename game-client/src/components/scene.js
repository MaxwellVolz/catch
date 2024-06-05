// game-client/src/components/scene.js
import * as THREE from 'three';
import { Player } from './player.js';
import { Baseball } from './baseball.js';

let scene, camera, renderer;
let plane;
const dudes = {};
let userDude;
let baseball;

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function initScene() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;
    camera.position.y = 5;
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a plane
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI / 2;
    scene.add(plane);

    // Create a player
    createUserDude();

    // Create baseball
    createBaseball();

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);

    window.addEventListener('resize', onWindowResize, false);
}

function createUserDude() {
    console.log('Creating local user...');
    userDude = new Player(
        scene,
        '/models/dude.glb', // Model path
        true // Local user with controls enabled
    );
    // No need to add local user to dudes, as it is managed separately
}

function createBaseball() {
    console.log('Creating baseball...');
    const initialPosition = new THREE.Vector3(0, 1, 0); // Set initial position here
    const initialRotation = Math.PI / 4; // Set initial rotation here (example: 45 degrees)
    baseball = new Baseball(
        scene,
        initialPosition,
        initialRotation
    );
}

export function createDudeForUser(id, position, rotation, action = 'Idle') {
    console.log(`Creating new dude for user ${id} at position`, position);
    const newDude = new Player(
        scene,
        '/models/dude.glb', // Model path
        false // Non-local user
    );
    newDude.setPosition(position.x, position.y, position.z);
    newDude.setRotation(rotation);
    newDude.setAction(action); // Set the initial action
    dudes[id] = newDude;
}

export function updateDudePositionById(id, position, rotation, action = 'Idle') {
    if (!dudes[id]) {
        console.log(`Creating new dude for user ${id} at position`, position);
        createDudeForUser(id, position, rotation, action);
    } else {
        console.log(`Updating position for user ${id} to`, position);
        dudes[id].setPosition(position.x, position.y, position.z);
        dudes[id].setRotation(rotation);
        dudes[id].setAction(action); // Update the action
    }
}

export function removeDudeById(id) {
    const dude = dudes[id];
    if (dude) {
        if (dude.hasBall) {
            dude.throwBall();
        }
        scene.remove(dude.mesh); // Remove the mesh from the scene
        delete dudes[id]; // Delete the player from the dudes object
        console.log(`Player with id ${id} removed from scene`);
    } else {
        console.warn(`Player with id ${id} not found`);
    }
}

export function animate() {
    requestAnimationFrame(animate);

    // Update the local player's animation mixer
    if (userDude && userDude.mixer) {
        userDude.mixer.update(0.016); // Update with a fixed time step
    }

    // Update the animation mixers for all networked players
    Object.values(dudes).forEach(dude => {
        if (dude.mixer) {
            dude.mixer.update(0.016); // Update with a fixed time step
        }
    });

    // Check for collisions between local player and baseball
    if (userDude && baseball) {
        if (userDude.checkCollision(baseball)) {
            console.log('Collision detected between player and baseball');
            userDude.pickUpBall(baseball);
        }
    }

    renderer.render(scene, camera);
}

export function updateBaseball(position, velocity, holder) {
    if (holder) {
        if (holder === 'local') {
            baseball.removeFromScene();
            userDude.hasBall = true;
        } else {
            const player = dudes[holder];
            if (player) {
                player.hasBall = true;
                baseball.removeFromScene();
            }
        }
    } else {
        if (!baseball.active) {
            baseball = new Baseball(scene, position);
        } else {
            baseball.mesh.position.copy(position);
            baseball.velocity.copy(velocity);
            baseball.active = true;
        }
    }
}
