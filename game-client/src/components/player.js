// src/components/player.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { updateDudePosition } from './socket.js';

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
                    if (clip.name === 'Idle') {
                        this.setAction('Idle');
                    }
                });

                this.scene.add(this.mesh); // Add the model to the scene
                console.log('Model added to scene');
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
    }

    onKeyUp(event) {
        this.keys[event.key] = false;
    }

    updateMovement() {
        requestAnimationFrame(() => this.updateMovement());

        this.velocity.set(0, 0, 0);
        let moving = false;

        if (this.keys['w']) {
            this.velocity.z -= this.speed;
            moving = true;
        }
        if (this.keys['s']) {
            this.velocity.z += this.speed;
            moving = true;
        }
        if (this.keys['a']) {
            this.velocity.x -= this.speed;
            moving = true;
        }
        if (this.keys['d']) {
            this.velocity.x += this.speed;
            moving = true;
        }

        if (this.velocity.length() > 0) {
            this.mesh.position.add(this.velocity);
            updateDudePosition(this.mesh.position);
        }

        if (moving) {
            this.setAction('Running');
        } else {
            this.setAction('Idle');
        }

        if (this.mixer) this.mixer.update(this.speed);
    }

    setAction(name) {
        if (this.currentAction === this.actions[name]) return;
        if (this.currentAction) this.currentAction.fadeOut(0.5);
        this.currentAction = this.actions[name];
        if (this.currentAction) this.currentAction.reset().fadeIn(0.5).play();
        console.log(`Action set to: ${name}`);
    }

    setPosition(x, y, z) {
        if (this.mesh) this.mesh.position.set(x, y, z);
    }

    getPosition() {
        return this.mesh ? this.mesh.position : new THREE.Vector3();
    }
}
