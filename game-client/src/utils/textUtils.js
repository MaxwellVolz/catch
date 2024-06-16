// game-client\src\utils\textUtils.js
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

export function createTextMesh(text, position, scene) {
    const loader = new FontLoader();
    loader.load('/assets/fonts/Tiny5_Regular.json', function (font) {
        const geometry = new TextGeometry(text, {
            font: font,
            size: 8, // Increased size for better readability
            height: 1, // Increased height for better readability
        });
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        scene.add(mesh);

        // Remove the text after a short duration
        setTimeout(() => {
            scene.remove(mesh);
        }, 2000); // Display for 2 seconds
    });
}

export function updateCatchDisplay(throwerId, throwPosition, catchPosition, count, scene) {
    const midPoint = new THREE.Vector3().addVectors(throwPosition, catchPosition).multiplyScalar(0.5);
    createTextMesh(count.toString(), midPoint, scene);
}
