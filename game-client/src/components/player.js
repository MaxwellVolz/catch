import * as THREE from 'three';

export function createPlayer(scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.5, 0);  // Position the player above the ground
    scene.add(player);
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

export function createBall(position, rotation, velocity) {
    console.log('Creating ball at position:', position);
    const geometry = new THREE.SphereGeometry(1, 32, 32);  // Increase the size of the ball
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    // Position the ball above the player
    const ballPosition = position.clone();
    ballPosition.y += 5;  // Adjust the value to position the ball higher above the player
    mesh.position.copy(ballPosition);
    mesh.rotation.copy(rotation);

    return {
        mesh,
        velocity,
        update() {
            this.mesh.position.add(this.velocity);
            // Add simple gravity
            this.velocity.y -= 0.01;
            console.log('Ball position during update:', this.mesh.position);
        }
    };
}
