// game-client\src\components\player.js

import * as THREE from 'three';
import { Body, Box, Sphere } from 'cannon-es';

export function createPlayer(scene, world) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.5, 0);
    scene.add(player);

    const shape = new Box(new THREE.Vector3(0.5, 0.5, 0.5));
    const body = new Body({ mass: 1 });
    body.addShape(shape);
    body.position.set(0, 0.5, 0);
    world.addBody(body);

    return { mesh: player, body };
}

export function updatePlayerState(player, input) {
    const speed = 0.1;
    const turnSpeed = 0.05;

    // Calculate forward and right vectors based on player rotation
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.mesh.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(player.mesh.quaternion);

    if (input.forward) player.mesh.position.add(forward.multiplyScalar(speed));
    if (input.backward) player.mesh.position.add(forward.multiplyScalar(-speed));
    if (input.left) player.mesh.position.add(right.multiplyScalar(-speed));
    if (input.right) player.mesh.position.add(right.multiplyScalar(speed));
    if (input.turnLeft) player.mesh.rotation.y += turnSpeed;
    if (input.turnRight) player.mesh.rotation.y -= turnSpeed;
}

export function renderBalls(scene, balls) {
    balls.forEach(ball => {
        ball.update();
        if (!scene.children.includes(ball.mesh)) {
            scene.add(ball.mesh);
        }
    });
}

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
        thrower, // Add thrower information
        update() {
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
        }
    };
}
