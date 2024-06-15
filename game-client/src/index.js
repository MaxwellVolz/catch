import { initScene } from './utils/initScene';
import { createPlayer, updatePlayerState, renderBalls, createBall } from './components/player';
import { handleSocketConnections, handleEvents, broadcastBallRemoval } from './utils/networking';
import { initPhysics, updatePhysics } from './utils/initPhysics';
import { Vector3, Raycaster, Plane } from 'three';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');  // Initialize socket

document.addEventListener('DOMContentLoaded', () => {
    const { scene, camera, renderer } = initScene();
    const player = createPlayer(scene);  // Ensure scene is passed correctly
    const balls = [];
    const world = initPhysics();
    const raycaster = new Raycaster();
    const mouse = new Vector3();
    const ballMap = new Map();  // Use a Map to track balls by unique identifier

    console.log('Physics world initialized:', world);

    const input = {
        forward: false,
        backward: false,
        left: false,
        right: false
    };

    let isCharging = false;
    let chargeStartTime = 0;
    let chargeEndTime = 0;

    window.addEventListener('keydown', (event) => {
        if (event.key === 'w') input.forward = true;
        if (event.key === 's') input.backward = true;
        if (event.key === 'a') input.left = true;
        if (event.key === 'd') input.right = true;
    });

    window.addEventListener('keyup', (event) => {
        if (event.key === 'w') input.forward = false;
        if (event.key === 's') input.backward = false;
        if (event.key === 'a') input.left = false;
        if (event.key === 'd') input.right = false;
    });


    window.addEventListener('mousedown', (event) => {
        isCharging = true;
        chargeStartTime = Date.now();
    });

    window.addEventListener('mouseup', (event) => {
        if (!isCharging) return;
        isCharging = false;
        chargeEndTime = Date.now();

        const chargeDuration = (chargeEndTime - chargeStartTime) / 1000; // in seconds
        const maxChargeDuration = 5; // Max charge duration in seconds
        const chargeFactor = Math.min(chargeDuration / maxChargeDuration, 1); // Value between 0 and 1
        const throwPowerMultiplier = 20

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersectPoint = new Vector3();
        const plane = new Plane(new Vector3(0, 1, 0), 0);
        raycaster.ray.intersectPlane(plane, intersectPoint);

        const distance = player.position.distanceTo(intersectPoint);
        let angle = 80 - (distance / 10) * 70; // Linearly interpolate angle based on distance
        angle = Math.max(angle, 10); // Ensure the minimum angle is 10 degrees

        const direction = new Vector3().subVectors(intersectPoint, player.position).normalize();
        const horizontalDistance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        direction.y = Math.tan(angle * (Math.PI / 180)) * horizontalDistance;
        direction.normalize();

        const velocity = direction.multiplyScalar(0.5 + 2.5 * chargeFactor * throwPowerMultiplier); // Base speed plus charge-based speed

        const ballData = {
            id: socket.id + Date.now(),
            position: { x: player.position.x, y: player.position.y + 1.0, z: player.position.z },
            rotation: { _x: player.rotation.x, _y: player.rotation.y, _z: player.rotation.z },
            velocity: { x: velocity.x, y: velocity.y, z: velocity.z }
        };

        console.log('Emitting ballThrown event:', ballData);
        socket.emit('ballThrown', ballData);

        if (!ballMap.has(ballData.id)) {
            const ball = createBall(ballData.id, new Vector3(ballData.position.x, ballData.position.y, ballData.position.z), new THREE.Euler(ballData.rotation._x, ballData.rotation._y, ballData.rotation._z), velocity, world);
            balls.push(ball);
            ballMap.set(ballData.id, ball);
        }
    });

    handleSocketConnections(scene, player, balls, world);
    handleEvents(scene, player, balls, world);

    function detectCollisions() {
        balls.forEach((ball, index) => {
            const distance = player.position.distanceTo(ball.mesh.position);
            if (distance < 1) {
                scene.remove(ball.mesh);
                world.removeBody(ball.body);
                balls.splice(index, 1);
                broadcastBallRemoval(ball.id);
            }
        });
    }

    function gameLoop() {
        updatePlayerState(player, input);
        updatePhysics(world, balls);
        renderBalls(scene, balls);
        detectCollisions();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});