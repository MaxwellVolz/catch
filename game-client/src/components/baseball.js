// game-client/src/components/baseball.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Baseball {
    constructor(scene, world, position, rotation) {
        this.scene = scene;
        this.world = world;

        // Create Three.js mesh
        const geometry = new THREE.SphereGeometry(0.2, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.rotation.setFromVector3(rotation);

        // Add the mesh to the scene
        this.scene.add(this.mesh);
        console.log('Baseball mesh added to scene:', this.mesh);

        // Create Cannon.js body
        const shape = new CANNON.Sphere(0.2);
        this.body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape
        });

        // Add the body to the physics world
        this.world.addBody(this.body);
        console.log('Baseball body added to world:', this.body);

        this.active = true;
    }

    removeFromScene() {
        this.scene.remove(this.mesh);
        this.world.removeBody(this.body);
        this.active = false;
    }
}
