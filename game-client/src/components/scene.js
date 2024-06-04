// src/components/scene.js
import * as THREE from 'three';
import { Player } from './player.js';

let scene, camera, renderer;
let plane;
const balls = {};
let userBall;

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
    createUserBall();

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);

    window.addEventListener('resize', onWindowResize, false);
}

function createUserBall() {
    console.log('Creating local user ball');
    userBall = new Player(0xff0000, true); // Red ball for the local user with controls enabled
    scene.add(userBall.mesh);
    balls['user'] = userBall;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function createBallForUser(id, position) {
    const newBall = new Player(0x0000ff, false); // Blue ball for other users without controls
    newBall.setPosition(position.x, position.y, position.z);
    scene.add(newBall.mesh);
    balls[id] = newBall;
}

export function updateBallPositionById(id, position) {
    if (!balls[id]) {
        createBallForUser(id, position);
    } else {
        balls[id].setPosition(position.x, position.y, position.z);
    }
}

export function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
