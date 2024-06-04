// src/components/scene.js
import * as THREE from 'three';
import { updateBallPosition } from './socket.js';

let scene, camera, renderer;
let geometry, material, plane;
const balls = {};
let userBall;

export function initScene() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a plane
    geometry = new THREE.PlaneGeometry(10, 10);
    material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Create a ball for the user
    createUserBall();

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', onDocumentKeyDown, false);
}

function createUserBall() {
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    userBall = new THREE.Mesh(ballGeometry, ballMaterial);
    scene.add(userBall);
    balls['user'] = userBall;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentKeyDown(event) {
    const keyCode = event.which;
    if (keyCode == 87) {
        userBall.position.y += 0.1;
    } else if (keyCode == 83) {
        userBall.position.y -= 0.1;
    } else if (keyCode == 65) {
        userBall.position.x -= 0.1;
    } else if (keyCode == 68) {
        userBall.position.x += 0.1;
    }
    updateBallPosition(userBall.position);
}

export function createBallForUser(id, position) {
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const newBall = new THREE.Mesh(ballGeometry, ballMaterial);
    newBall.position.set(position.x, position.y, position.z);
    scene.add(newBall);
    balls[id] = newBall;
}

export function updateBallPositionById(id, position) {
    if (!balls[id]) {
        createBallForUser(id, position);
    } else {
        balls[id].position.set(position.x, position.y, position.z);
    }
}

export function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
