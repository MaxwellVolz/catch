import * as THREE from 'three';

function setupKeyboardEventHandlers(input) {
    window.addEventListener('keydown', (event) => {
        if (event.key === 'w') input.forward = true;
        if (event.key === 's') input.backward = true;
        if (event.key === 'a') input.left = true;
        if (event.key === 'd') input.right = true;
    });

    window.addEventListener('keyup', (event) => {
        if (event.key === 'w') input.forward = false;
        if (event.key === 's') input.backward = false;
        if (event.key === 'a') input.left = false;
        if (event.key === 'd') input.right = false;
    });
}

function setupMouseEventHandlers(player, raycaster, mouse, camera, renderer, socket, balls) {
    let isCharging = false;
    let chargeStartTime = 0;
    let chargeEndTime = 0;

    window.addEventListener('mousedown', (event) => {
        if (!player.canThrow) return;
        isCharging = true;
        chargeStartTime = Date.now();
    });

    window.addEventListener('mouseup', (event) => {
        if (!isCharging) return;
        isCharging = false;
        chargeEndTime = Date.now();

        const chargeDuration = (chargeEndTime - chargeStartTime) / 1000;
        const maxChargeDuration = 3;
        const chargeFactor = Math.min(chargeDuration / maxChargeDuration, 1);
        const throwPower = 50;

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersectPoint = new THREE.Vector3();
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        raycaster.ray.intersectPlane(plane, intersectPoint);

        const distance = player.mesh.position.distanceTo(intersectPoint);
        let angle = 80 - (distance / 10) * 70;
        angle = Math.max(angle, 20);

        const direction = new THREE.Vector3().subVectors(intersectPoint, player.mesh.position).normalize();
        const horizontalDistance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        direction.y = Math.tan(angle * (Math.PI / 180)) * horizontalDistance;
        direction.normalize();

        const velocity = direction.multiplyScalar(throwPower * chargeFactor);

        const ballData = {
            id: socket.id + Date.now(),
            position: { x: player.mesh.position.x, y: player.mesh.position.y + 1.0, z: player.mesh.position.z },
            rotation: { _x: player.mesh.rotation.x, _y: player.mesh.rotation.y, _z: player.mesh.rotation.z },
            velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
            thrower: socket.id,
            initialPosition: player.mesh.position.clone()
        };

        console.log('Emitting ballThrown event:', ballData);
        socket.emit('ballThrown', ballData);

        player.canThrow = false;
        setTimeout(() => {
            player.canThrow = true;
        }, 2000);
    });
}

export function setupEventHandlers(input, player, raycaster, mouse, camera, renderer, socket, balls, canThrow, isCharging, chargeStartTime, chargeEndTime) {
    setupKeyboardEventHandlers(input);
    setupMouseEventHandlers(player, raycaster, mouse, camera, renderer, socket, balls);
}
