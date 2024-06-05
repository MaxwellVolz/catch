// game-client/src/components/player.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { updateDudePosition, broadcastBallUpdate } from './socket.js';

export class Player {
    constructor(scene, modelPath, isLocal = false) {
        this.scene = scene;
        this.modelPath = modelPath;
        this.isLocal = isLocal;
        this.mixer = null;
        this.actions = {};
        this.currentAction = null;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0.1;
        this.keys = {};
        this.hasBall = false;
        this.debounceBallPickup = false;

        this.loadModel();

        if (this.isLocal) {
            console.log('Initializing controls for local player');
            this.initControls();
            this.updateMovement();
        }
    }

    loadModel() {
        console.log(`Loading model from path: ${this.modelPath}`);
        const loader = new GLTFLoader();
        loader.load(
            this.modelPath,
            (gltf) => {
                console.log('Model loaded successfully:', gltf);
                this.mesh = gltf.scene;
                this.mixer = new THREE.AnimationMixer(this.mesh);

                gltf.animations.forEach((clip) => {
                    const action = this.mixer.clipAction(clip);
                    this.actions[clip.name] = action;
                    console.log(`Loaded animation: ${clip.name}`);
                });

                this.scene.add(this.mesh); // Add the model to the scene
                console.log('Model added to scene');

                // Set initial action to idle
                this.setAction('Idle');

                // Create a bounding box for collision detection
                this.collider = new THREE.Box3().setFromObject(this.mesh);
            },
            undefined,
            (error) => {
                console.error('Error loading model:', error);
            }
        );
    }

    initControls() {
        console.log('Adding keydown and keyup event listeners');
        document.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        document.addEventListener('keyup', (event) => this.onKeyUp(event), false);
    }

    onKeyDown(event) {
        this.keys[event.key] = true;
        if (event.key === ' ' && this.hasBall) {
            this.throwBall();
        }
    }

    onKeyUp(event) {
        this.keys[event.key] = false;
    }

    updateMovement() {
        requestAnimationFrame(() => this.updateMovement());

        if (!this.mesh) return; // Ensure mesh is defined

        this.velocity.set(0, 0, 0);
        let moving = false;
        let action = 'Idle';

        if (this.keys['w']) {
            this.velocity.z -= 1;
            moving = true;
            action = 'Run';
        }
        if (this.keys['s']) {
            this.velocity.z += 1;
            moving = true;
            action = 'Run';
        }
        if (this.keys['a']) {
            this.velocity.x -= 1;
            moving = true;
            action = 'Run';
        }
        if (this.keys['d']) {
            this.velocity.x += 1;
            moving = true;
            action = 'Run';
        }

        if (moving) {
            this.velocity.normalize().multiplyScalar(this.speed);
            this.mesh.position.add(this.velocity);

            // Calculate the new direction the mesh should face
            const angle = Math.atan2(this.velocity.x, this.velocity.z);
            this.mesh.rotation.y = angle;

            // Update the collider position
            this.collider.setFromObject(this.mesh);

            updateDudePosition(this.mesh.position, this.mesh.rotation.y, action); // Send position, rotation, and action to the server
        } else {
            action = 'Idle';
            updateDudePosition(this.mesh.position, this.mesh.rotation.y, action); // Send position, rotation, and action to the server
        }

        this.setAction(action);

        if (this.mixer) this.mixer.update(0.016); // Update the mixer with a fixed time step
    }

    setAction(name) {
        if (this.currentAction === this.actions[name]) {
            return;
        }
        if (this.currentAction) this.currentAction.fadeOut(0.5);
        this.currentAction = this.actions[name];
        if (this.currentAction) this.currentAction.reset().fadeIn(0.5).play();
        console.log(`Action set to: ${name}`);
    }

    setPosition(x, y, z) {
        if (this.mesh) {
            this.mesh.position.set(x, y, z);
            this.collider.setFromObject(this.mesh); // Update collider position
        }
    }

    setRotation(y) {
        if (this.mesh) this.mesh.rotation.y = y;
    }

    getPosition() {
        return this.mesh ? this.mesh.position : new THREE.Vector3();
    }

    getRotation() {
        return this.mesh ? this.mesh.rotation.y : 0;
    }

    // Method to check for collision with another object
    checkCollision(otherObject) {
        if (!this.collider || !otherObject || !otherObject.mesh) return false;
        const otherCollider = new THREE.Box3().setFromObject(otherObject.mesh);
        return this.collider.intersectsBox(otherCollider);
    }

    pickUpBall(ball) {
        if (this.debounceBallPickup) return;

        this.hasBall = true;
        this.debounceBallPickup = true;
        ball.removeFromScene();
        this.scene.remove(ball.mesh);

        console.log('Picked up the ball');
    }
    throwBall() {
        if (!this.hasBall) return;

        this.hasBall = false;

        if (!ballBody) {
            console.error('ballBody is not defined');
            return;
        }

        const ballPosition = {
            x: this.mesh.position.x,
            y: this.mesh.position.y + 1,
            z: this.mesh.position.z
        };

        const ballVelocity = {
            x: Math.sin(this.mesh.rotation.y) * 5, // Adjust velocity scale as needed
            y: 0,
            z: Math.cos(this.mesh.rotation.y) * 5
        };

        ballBody.position.set(ballPosition.x, ballPosition.y, ballPosition.z);
        ballBody.velocity.set(ballVelocity.x, ballVelocity.y, ballVelocity.z);

        broadcastBallUpdate({
            position: ballPosition,
            velocity: ballVelocity
        });

        this.debounceBallPickup = false;

        console.log('Threw the ball with Cannon.js physics');
    }






    // Handle disconnect/drop ball logic
    handleDisconnect() {
        if (this.hasBall) {
            this.throwBall();
        }
    }
}
