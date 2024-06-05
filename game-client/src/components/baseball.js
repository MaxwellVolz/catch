// game-client/src/components/baseball.js
import * as THREE from 'three';
import { broadcastBallUpdate } from './socket.js';

export class Baseball {
    constructor(scene, position = new THREE.Vector3(0, 1, 0), rotation = 0) {
        this.scene = scene;
        this.geometry = new THREE.SphereGeometry(0.5, 32, 32);
        this.material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(position);
        this.mesh.rotation.y = rotation;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.active = true;

        this.scene.add(this.mesh);
        this.update();
    }

    update() {
        if (!this.active) return;
        requestAnimationFrame(() => this.update());

        if (this.mesh.position.y <= 0) {
            this.velocity.set(0, 0, 0);
            this.active = false;
            broadcastBallUpdate({ position: this.mesh.position, velocity: this.velocity, holder: null });
        } else {
            this.mesh.position.add(this.velocity);
        }
    }

    throw(velocity) {
        this.velocity.copy(velocity).multiplyScalar(0.2).setY(1);
        this.active = true;
    }

    getPosition() {
        return this.mesh.position.clone();
    }

    getRotation() {
        return this.mesh.rotation.y;
    }

    removeFromScene() {
        this.scene.remove(this.mesh);
        this.active = false;
    }
}
