// game-client\src\utils\createMarker.js

import * as THREE from 'three';

export function createMarker() {
    const geometry = new THREE.CircleGeometry(0.5, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0 }); // Initial opacity 0
    const marker = new THREE.Mesh(geometry, material);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(0, -1000, 0); // Set initial position out of view
    return marker;
}
