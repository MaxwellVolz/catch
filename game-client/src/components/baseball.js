// game-client/src/components/baseball.js
import * as THREE from 'three';
import { Body, Sphere, Vec3 } from 'cannon-es';

class Baseball {
    constructor(position, rotation, velocity, scene, world) {
        this.scene = scene;
        this.world = world;

        const geometry = new THREE.SphereGeometry(0.2, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        scene.add(this.mesh);

        this.body = new Body({ mass: 1 });
        this.body.addShape(new Sphere(0.2));
        this.body.position.copy(position);
        this.body.velocity.copy(velocity);
        world.addBody(this.body);
    }

    update() {
        this.mesh.position.copy(this.body.position);
    }

    remove(scene, world) {
        scene.remove(this.mesh);
        world.removeBody(this.body);
    }
}

export default Baseball;
