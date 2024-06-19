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
