import * as THREE from 'three';
import { Body, Sphere } from 'cannon-es';

export function createPlayer(scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.5, 0);  // Position the player above the ground
    scene.add(player);  // Ensure scene is used correctly
    return player;
}

export function updatePlayerState(player, input) {
    const speed = 0.1;

    if (input.forward) player.position.z -= speed;
    if (input.backward) player.position.z += speed;
    if (input.left) player.position.x -= speed;
    if (input.right) player.position.x += speed;
}
export function renderBalls(scene, balls) {
    balls.forEach(ball => {
        ball.update();
        if (!scene.children.includes(ball.mesh)) {
            scene.add(ball.mesh);
        }
        console.log('Rendering ball at position:', ball.mesh.position);  // Add log to check ball position during render
    });
}

export function createBall(id, position, rotation, velocity, world) {
    console.log('Creating ball at position:', position);
    console.log('World in createBall:', world);  // Add logging to check the world object

    const geometry = new THREE.SphereGeometry(0.5, 32, 32);  // Adjust the size of the ball
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    // Position the ball above the player
    const ballPosition = position.clone();
    ballPosition.y += 1;  // Adjust the value to position the ball higher above the player
    mesh.position.copy(ballPosition);
    mesh.rotation.copy(rotation);

    // Create physics body
    const shape = new Sphere(0.5);
    const body = new Body({ mass: 1, position: ballPosition });
    body.addShape(shape);
    body.velocity.set(velocity.x, velocity.y, velocity.z);
    world.addBody(body);  // Ensure world is used here

    return {
        id,
        mesh,
        body,
        update() {
            // Sync mesh position with physics body
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
            console.log('Ball position during update:', this.mesh.position);
        }
    };
}
