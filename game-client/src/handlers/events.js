import * as THREE from 'three';

function setupKeyboardEventHandlers(input) {
    const keyDownHandler = (event) => {
        switch (event.key) {
            case 'w': input.forward = true; break;
            case 's': input.backward = true; break;
            case 'a': input.left = true; break;
            case 'd': input.right = true; break;
        }
    };

    const keyUpHandler = (event) => {
        switch (event.key) {
            case 'w': input.forward = false; break;
            case 's': input.backward = false; break;
            case 'a': input.left = false; break;
            case 'd': input.right = false; break;
        }
    };

    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);

    // Clean up event listeners on unload
    window.addEventListener('beforeunload', () => {
        window.removeEventListener('keydown', keyDownHandler);
        window.removeEventListener('keyup', keyUpHandler);
    });
}

function setupMouseEventHandlers(player, raycaster, mouse, camera, renderer, socket, balls) {
    let isCharging = false;
    let chargeStartTime = 0;

    const mouseDownHandler = () => {
        if (!player || !player.canThrow) return;
        isCharging = true;
        chargeStartTime = Date.now();
    };

    const mouseUpHandler = (event) => {
        if (!isCharging) return;
        isCharging = false;
        const chargeEndTime = Date.now();

        if (!player || !player.mesh || !player.mesh.position || !player.mesh.rotation) {
            console.error('Player or player properties are undefined');
            return;
        }

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
            id: socket.id + Date.now().toString(),
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
    };

    window.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('mouseup', mouseUpHandler);

    // Clean up event listeners on unload
    window.addEventListener('beforeunload', () => {
        window.removeEventListener('mousedown', mouseDownHandler);
        window.removeEventListener('mouseup', mouseUpHandler);
    });
}

export function setupEventHandlers(input, player, raycaster, mouse, camera, renderer, socket, balls) {
    setupKeyboardEventHandlers(input);
    setupMouseEventHandlers(player, raycaster, mouse, camera, renderer, socket, balls);
}
