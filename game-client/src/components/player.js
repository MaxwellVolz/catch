import * as THREE from 'three';
import { Body, Sphere } from 'cannon-es';
import { setupAnimationModels, playAction, updateMixer, playOnce } from '../utils/animation';
import { handlePlayerMovement } from './playerMovement';

let mixer, actions = {};

export async function createPlayer(scene, world) {
    try {
        const { model, mixer: playerMixer, animations } = await setupAnimationModels(scene);
        mixer = playerMixer;
        actions = animations;

        const shape = new Sphere(0.5);
        const body = new Body({ mass: 1 });
        body.addShape(shape);
        body.position.set(0, 0.5, 0);
        world.addBody(body);

        const player = {
            mesh: new THREE.Object3D(),
            body,
            char_model: model,
            velocity: new THREE.Vector3(),
            currentAction: 'run'  // Set the default action to 'run'
        };

        player.mesh.add(player.char_model);
        scene.add(player.mesh);

        playAction('run');  // Play the default run animation

        console.log('Player created:', player);

        return player;
    } catch (error) {
        console.error('Error creating player:', error);
    }
}

export function updatePlayerState(player, input, camera) {
    const moving = handlePlayerMovement(player, input, camera);

    if (moving) {
        if (player.currentAction !== 'run') {
            playAction('run');
            player.currentAction = 'run';
        }
    } else {
        if (player.currentAction !== 'idle') {
            playAction('idle');
            player.currentAction = 'idle';
        }
    }
}

export function renderBalls(scene, balls) {
    balls.forEach(ball => {
        ball.update();
        if (!scene.children.includes(ball.mesh)) {
            scene.add(ball.mesh);
        }
    });
}

export function updateAnimation(deltaTime) {
    updateMixer(deltaTime);
}

export { playAction, playOnce };
