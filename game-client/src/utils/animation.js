import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

const gltfLoader = new GLTFLoader();
const AllActions = {};
const publicDir = '/assets/';
let currentActionName = '';
let mixer;

export async function setupAnimationModels(scene) {
    try {
        const modelUrl = 'iron_man.glb';  // Update to your model file name
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

        mixer = new THREE.AnimationMixer(model);
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
        ];

        for (const url of animGlbs) {
            const fullUrl = publicDir + 'anims/' + url;
            console.log('Fetching animation from URL:', fullUrl);

            const animGltf = await gltfLoader.loadAsync(fullUrl);
            const clip = animGltf.animations[0];
            const actionName = url.split('.')[0];
            const action = mixer.clipAction(clip);
            action.loop = (actionName === 'idle' || actionName === 'run') ? THREE.LoopRepeat : THREE.LoopOnce;
            AllActions[actionName] = action;
            console.log(`Loaded animation: ${actionName}, duration: ${clip.duration}`);
        }

        console.log('All loaded actions:', Object.keys(AllActions));
        return AllActions;
    } catch (error) {
        console.error('Error loading animations:', error);
        throw error;
    }
}

export function playAction(actionName) {
    console.log(`Attempting to play action: ${actionName}`);
    const action = AllActions[actionName];
    if (action) {
        console.log(`Playing action: ${actionName}`);
        action.reset().fadeIn(0.5).play();
        action.paused = false;
        action.loop = THREE.LoopRepeat
        if (currentActionName && currentActionName !== actionName) {
            const currentAction = AllActions[currentActionName];
            if (currentAction) {
                currentAction.fadeOut(0.5);
                currentAction.paused = true;
            }
        }
        currentActionName = actionName;
    } else {
        console.error(`Action not found: ${actionName}`);
    }
}

export function updateMixer(deltaTime) {
    if (mixer) {
        mixer.update(deltaTime);
    } else {
        console.error('Mixer not defined');
    }
}

export function resetAction(actionName) {
    const action = AllActions[actionName];
    if (action) {
        action.stop();
    }
}

export function playOnce(actionName) {
    console.log(`Attempting to play action once: ${actionName}`);
    const action = AllActions[actionName];
    if (action) {
        action.reset().fadeIn(0.5).play();
        action.paused = false;
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;

        action.onFinished = () => {
            resetAction(actionName);
            playAction('idle');
        };
    } else {
        console.error(`Action not found: ${actionName}`);
    }
}
