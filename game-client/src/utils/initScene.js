// game-client\src\utils\initScene.js
import * as THREE from 'three';



function createTree(scene, position) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(position.x, position.y + 1, position.z); // Position trunk

    const leavesGeometry = new THREE.SphereGeometry(1);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(position.x, position.y + 2.5, position.z); // Position leaves

    scene.add(trunk);
    scene.add(leaves);
}

function createBush(scene, position) {
    const bushGeometry = new THREE.SphereGeometry(0.5);
    const bushMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(position.x, position.y + 0.5, position.z); // Position bush

    scene.add(bush);
}

export function initScene() {
    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 25, 25);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Ground plane
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);


    // Add trees
    createTree(scene, new THREE.Vector3(5, 0, 5));
    createTree(scene, new THREE.Vector3(-5, 0, -5));

    // Add bushes
    createBush(scene, new THREE.Vector3(3, 0, 3));
    createBush(scene, new THREE.Vector3(-3, 0, -3));


    // Invisible plane for mouse interaction
    const invisiblePlaneGeometry = new THREE.PlaneGeometry(100, 100);
    const invisiblePlaneMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const invisiblePlane = new THREE.Mesh(invisiblePlaneGeometry, invisiblePlaneMaterial);
    invisiblePlane.position.y = 0;
    invisiblePlane.rotation.x = -Math.PI / 2;
    scene.add(invisiblePlane);

    // Render function
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    return { scene, camera, renderer };
}
