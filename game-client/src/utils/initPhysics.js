import { World, Body, Plane, Vec3 } from 'cannon-es';

export function initPhysics() {
    const world = new World();
    world.gravity.set(0, -9.82, 0);

    // Create ground
    const groundBody = new Body({ mass: 0 });
    groundBody.addShape(new Plane());
    groundBody.position.set(0, 0, 0);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    return world;
}

export function updatePhysics(world, balls) {
    world.step(1 / 60);  // Step the physics world

    // Update all ball positions based on physics simulation
    balls.forEach(ball => ball.update());
}
