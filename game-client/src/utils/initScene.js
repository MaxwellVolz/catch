import * as THREE from 'three';

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
