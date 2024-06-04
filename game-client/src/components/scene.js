// src/components/scene.js
import * as THREE from 'three';
import { Player } from './player.js';

let scene, camera, renderer;
let plane;
const balls = {};
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
    console.log('Creating local user ball');
    userDude = new Player(
        scene,
        '/models/dude.glb', // Model path
        true // Local user with controls enabled
    );
    balls['user'] = userDude;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function createDudeForUser(id, position) {
    const newDude = new Player(
        scene,
        '/models/dude.glb', // Model path
        false // Non-local user
    );
    newDude.setPosition(position.x, position.y, position.z);
    balls[id] = newDude;
}

export function updateDudePositionById(id, position) {
    if (!balls[id]) {
        createDudeForUser(id, position);
    } else {
        balls[id].setPosition(position.x, position.y, position.z);
    }
}

export function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
