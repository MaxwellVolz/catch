// game-client\src\utils\initPhysics.js
import { World, Body, Plane, Vec3, Cylinder, Sphere } from 'cannon-es';

function createTreePhysicsBody(position) {
    const trunkShape = new Cylinder(0.2, 0.2, 2, 8);
    const trunkBody = new Body({ mass: 0 });
    trunkBody.addShape(trunkShape);
    trunkBody.position.set(position.x, position.y + 1, position.z);

    const leavesShape = new Sphere(1);
    const leavesBody = new Body({ mass: 0 });
    leavesBody.addShape(leavesShape);
    leavesBody.position.set(position.x, position.y + 2.5, position.z);

    return [trunkBody, leavesBody];
}

function createBushPhysicsBody(position) {
    const bushShape = new Sphere(0.5);
    const bushBody = new Body({ mass: 0 });
    bushBody.addShape(bushShape);
    bushBody.position.set(position.x, position.y + 0.5, position.z);

    return bushBody;
}

export function initPhysics() {
    const world = new World();
    world.gravity.set(0, -9.82, 0);

    // Create ground
    const groundBody = new Body({ mass: 0 });
    groundBody.addShape(new Plane());
    groundBody.position.set(0, 0, 0);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Add trees and bushes physics bodies
    const treePositions = [new Vec3(5, 0, 5), new Vec3(-5, 0, -5)];
    treePositions.forEach(position => {
        const [trunkBody, leavesBody] = createTreePhysicsBody(position);
        world.addBody(trunkBody);
        world.addBody(leavesBody);
    });

    const bushPositions = [new Vec3(3, 0, 3), new Vec3(-3, 0, -3)];
    bushPositions.forEach(position => {
        const bushBody = createBushPhysicsBody(position);
        world.addBody(bushBody);
    });


    return world;
}

export function updatePhysics(world, balls) {
    world.step(1 / 60);  // Step the physics world

    // Update all ball positions based on physics simulation
    balls.forEach(ball => ball.update());
}
