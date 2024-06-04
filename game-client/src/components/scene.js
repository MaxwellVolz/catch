import * as THREE from 'three';
import { Player } from './player.js';

let scene, camera, renderer;
let plane;
const dudes = {};
let userDude;

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

    // Create a player ball
    createUserDude();

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);

    window.addEventListener('resize', onWindowResize, false);
}

function createUserDude() {
    console.log('Creating local user');
    userDude = new Player(
        scene,
        '/models/dude.glb', // Model path
        true // Local user with controls enabled
    );
    // No need to add local user to dudes, as it is managed separately
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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

    renderer.render(scene, camera);
}
