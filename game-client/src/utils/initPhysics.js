// game-client/src/utils/initPhysics.js
import { World, Body, Plane } from 'cannon-es';

export function initPhysics() {
    const world = new World();
    world.gravity.set(0, -9.82, 0);

    // Create ground
    const groundBody = new Body({ mass: 0 });
    groundBody.addShape(new Plane());
    world.addBody(groundBody);

    return world;
}
