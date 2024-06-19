import * as THREE from 'three';

export function handlePlayerMovement(player, input, camera) {
    if (!player || !player.mesh) {
        console.error('Player or player.mesh is undefined', player);
        return;
    }

    const speed = 0.1;
    const moveDirection = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    const forward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    let moving = false;

    if (input.forward) {
        player.mesh.position.add(forward.clone().multiplyScalar(speed));
        moveDirection.add(forward);
        moving = true;
    }
    if (input.backward) {
        player.mesh.position.add(forward.clone().negate().multiplyScalar(speed));
        moveDirection.add(forward.clone().negate());
        moving = true;
    }
    if (input.left) {
        player.mesh.position.add(right.clone().negate().multiplyScalar(speed));
        moveDirection.add(right.clone().negate());
        moving = true;
    }
    if (input.right) {
        player.mesh.position.add(right.clone().multiplyScalar(speed));
        moveDirection.add(right);
        moving = true;
    }

    if (moving) {
        moveDirection.normalize();
        player.velocity.copy(player.mesh.position).sub(player.body.position);
        player.body.position.copy(player.mesh.position);

        // Update character model orientation based on movement direction
        const angle = Math.atan2(moveDirection.x, moveDirection.z);
        player.char_model.rotation.y = angle;
    }

    return moving;
}
