import * as THREE from 'three';
import { Player } from './player.js';
import { Baseball } from './baseball.js';
import * as CANNON from 'cannon-es';

let scene, camera, renderer;
let plane;
const dudes = {};
let userDude;

let baseball;

// Physics
let ballBody;
let world, physicsMaterial, groundBody;

const timeStep = 1 / 60;

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function initPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Set gravity

    physicsMaterial = new CANNON.Material("physicsMaterial");

    // Create a ground plane
    const groundShape = new CANNON.Plane();
    groundBody = new CANNON.Body({
        mass: 0, // mass == 0 makes the body static
        shape: groundShape,
        material: physicsMaterial
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);
}

function createTree(position) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(position.x, position.y + 1, position.z); // Position trunk

    const leavesGeometry = new THREE.SphereGeometry(1);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(position.x, position.y + 2.5, position.z); // Position leaves

    scene.add(trunk);
    scene.add(leaves);
}

function createBush(position) {
    const bushGeometry = new THREE.SphereGeometry(0.5);
    const bushMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(position.x, position.y + 0.5, position.z); // Position bush

    scene.add(bush);
}

export function initScene() {
    scene = new THREE.Scene();
    initPhysics(); // Initialize physics

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

    // Initialize baseball as null; it will be created later
    baseball = null;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);

    // Add trees and bushes
    createTree(new THREE.Vector3(-3, 0, -3));
    createTree(new THREE.Vector3(3, 0, -3));
    createTree(new THREE.Vector3(1, 0, 1));
    createBush(new THREE.Vector3(-2, 0, 2));
    createBush(new THREE.Vector3(2, 0, 2));

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

function createBaseball(position) {
    console.log('Creating baseball...');
    const initialPosition = new THREE.Vector3(position.x, position.y, position.z);
    const initialRotation = new THREE.Vector3();

    // Create the baseball with both Three.js and Cannon.js components
    baseball = new Baseball(scene, world, initialPosition, initialRotation);

    // Create the Cannon.js body for the baseball
    const shape = new CANNON.Sphere(0.2);
    ballBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        shape: shape
    });

    world.addBody(ballBody);
    console.log('Baseball created and added to scene and physics world.');
}

export function updateBaseball(position, velocity) {
    if (!position || !velocity) {
        console.error('Invalid position or velocity:', { position, velocity });
        return;
    }

    if (!baseball) {
        createBaseball(position);
    } else {
        ballBody.position.set(position.x, position.y, position.z);
        ballBody.velocity.set(velocity.x, velocity.y, velocity.z);
        baseball.mesh.position.copy(ballBody.position);
        baseball.mesh.quaternion.copy(ballBody.quaternion);
        console.log('Baseball position and velocity updated:', { position, velocity });
    }
}

export function animate() {
    requestAnimationFrame(animate);

    // Update physics
    world.step(timeStep);

    // Sync the baseball position with the Cannon.js body
    if (baseball && ballBody) {
        baseball.mesh.position.copy(ballBody.position);
        baseball.mesh.quaternion.copy(ballBody.quaternion);
    }

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
