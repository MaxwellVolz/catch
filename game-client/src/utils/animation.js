import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

const gltfLoader = new GLTFLoader();
const publicDir = '/assets/';

export async function setupAnimationModels(scene) {
    try {
        const modelUrl = 'man.glb';
        const fullUrl = publicDir + 'models/' + modelUrl;
        console.log('Fetching model from URL:', fullUrl);

        const gltf = await gltfLoader.loadAsync(fullUrl);
        const model = gltf.scene;

        model.traverse((n) => {
            if (n.isMesh) {
                n.castShadow = true;
                n.receiveShadow = true;
            }
        });

        scene.add(model);

        const mixer = new THREE.AnimationMixer(model);
        const animations = await loadAnimations(mixer);
        return { model, mixer, animations };
    } catch (error) {
        console.error('Error loading model:', error);
        throw error;
    }
}

async function loadAnimations(mixer) {
    try {
        const animGlbs = [
            'idle.glb',
            'run.glb',
            'pickup.glb',
            'catch.glb',
            'throw.glb'
        ];

        const actions = {};

        for (const url of animGlbs) {
            const fullUrl = publicDir + 'anims/' + url;
            console.log('Fetching animation from URL:', fullUrl);

            const animGltf = await gltfLoader.loadAsync(fullUrl);
            const clip = animGltf.animations[0];
            const actionName = url.split('.')[0];
            const action = mixer.clipAction(clip);
            action.loop = (actionName === 'idle' || actionName === 'run') ? THREE.LoopRepeat : THREE.LoopOnce;
            actions[actionName] = action;
            console.log(`Loaded animation: ${actionName}, duration: ${clip.duration}`);
        }

        console.log('All loaded actions:', Object.keys(actions));
        return actions;
    } catch (error) {
        console.error('Error loading animations:', error);
        throw error;
    }
}

export function playAction(actionName, player) {
    console.log(`Attempting to play action: ${actionName}`);
    if (!player.actions) {
        console.error('Player actions are undefined');
        return;
    }

    const action = player.actions[actionName];
    if (action) {
        console.log(`Playing action: ${actionName}`);
        action.reset().fadeIn(0.1).play();
        action.paused = false;
        if (player.currentAction && player.currentAction !== actionName) {
            const currentAction = player.actions[player.currentAction];
            if (currentAction) {
                currentAction.fadeOut(0.5);
                currentAction.paused = true;
            }
        }
        player.currentAction = actionName;
    } else {
        console.error(`Action not found: ${actionName}`);
    }
}

export function updateMixer(deltaTime, mixer) {
    if (mixer) {
        mixer.update(deltaTime);
    } else {
        console.error('Mixer not defined');
    }
}

export function resetAction(actionName, actions) {
    const action = actions[actionName];
    if (action) {
        action.stop();
    }
}

export function playOnce(actionName, player) {
    console.log(`Attempting to play action once: ${actionName}`);
    if (!player.actions) {
        console.error('Player actions are undefined');
        return;
    }

    const action = player.actions[actionName];
    if (action) {
        action.reset().fadeIn(0.5).play();
        action.paused = false;
        action.clampWhenFinished = false;
        action.loop = THREE.LoopOnce;

        action.onFinished = () => {
            resetAction(actionName, player.actions);
            playAction('idle', player);
        };
    } else {
        console.error(`Action not found: ${actionName}`);
    }
}
