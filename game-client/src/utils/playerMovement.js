// game-client/src/utils/playerMovement.js
import * as THREE from 'three';

export function setupPlayerMovement(player, socket) {
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const keysPressed = {};

    console.log("Setting up player movement");

    const onKeyDown = (event) => {
        keysPressed[event.key] = true;
        console.log(`Key down: ${event.key}`, keysPressed);
    };

    const onKeyUp = (event) => {
        keysPressed[event.key] = false;
        console.log(`Key up: ${event.key}`, keysPressed);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    const movePlayer = (delta) => {
        direction.set(0, 0, 0);

        if (keysPressed['w'] || keysPressed['ArrowUp']) {
            direction.z -= 1;
        }
        if (keysPressed['s'] || keysPressed['ArrowDown']) {
            direction.z += 1;
        }
        if (keysPressed['a'] || keysPressed['ArrowLeft']) {
            direction.x -= 1;
        }
        if (keysPressed['d'] || keysPressed['ArrowRight']) {
            direction.x += 1;
        }

        if (direction.lengthSq() > 0) {
            direction.normalize();
            velocity.copy(direction).multiplyScalar(5 * delta);
            player.position.add(velocity);
            player.rotation.y = Math.atan2(-direction.x, -direction.z);

            // Send updated position and rotation to the server
            socket.emit('update', {
                id: player.id,
                position: player.position,
                rotation: player.rotation
            });

            console.log("Player moved", player.position);
        }
    };

    return movePlayer;
}
