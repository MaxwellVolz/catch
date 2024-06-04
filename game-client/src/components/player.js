// src/components/player.js
import * as THREE from 'three';
import { updateBallPosition } from './socket.js';

export class Player {
    constructor(color = 0xff0000, isLocal = false) {
        this.geometry = new THREE.SphereGeometry(0.5, 32, 32);
        this.material = new THREE.MeshBasicMaterial({ color });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.isLocal = isLocal;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0.1;
        this.keys = {};

        if (this.isLocal) {
            console.log('Initializing controls for local player');
            this.initControls();
            this.updateMovement();
        }
    }

    initControls() {
        console.log('Adding keydown and keyup event listeners');
        document.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        document.addEventListener('keyup', (event) => this.onKeyUp(event), false);
    }

    onKeyDown(event) {
        this.keys[event.key] = true;
    }

    onKeyUp(event) {
        this.keys[event.key] = false;
    }

    updateMovement() {
        requestAnimationFrame(() => this.updateMovement());

        this.velocity.set(0, 0, 0);

        if (this.keys['w']) this.velocity.z -= this.speed; // Move forward
        if (this.keys['s']) this.velocity.z += this.speed; // Move backward
        if (this.keys['a']) this.velocity.x -= this.speed; // Move left
        if (this.keys['d']) this.velocity.x += this.speed; // Move right

        if (this.velocity.length() > 0) {
            this.mesh.position.add(this.velocity);
            updateBallPosition(this.mesh.position);
        }
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    getPosition() {
        return this.mesh.position;
    }
}
