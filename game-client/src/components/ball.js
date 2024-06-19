import * as THREE from 'three';
import { Body, Sphere } from 'cannon-es';

export function createBall(id, position, rotation, velocity, world, thrower) {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    const ballPosition = position.clone();
    ballPosition.y += 1;
    mesh.position.copy(ballPosition);

    // Ensure rotation order is set correctly
    rotation.order = 'XYZ';
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
        thrower,
        initialPosition: position.clone(), // Ensure initial position is set
        update() {
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
        }
    };
}
