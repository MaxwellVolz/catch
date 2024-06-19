import { updateCatchDisplay } from '../utils/textUtils';
import { playAction, playOnce } from '../controllers/player';

export function detectCollisions(balls, players, scene, world, markers, broadcastBallRemoval, handleBallCatch, handleBallTouchGround, socket) {
    balls.forEach(ball => {
        Object.values(players).forEach(p => {
            if (!p.mesh || !ball.mesh) {
                console.error('Player mesh or ball mesh is undefined');
                return;
            }

            const distance = p.mesh.position.distanceTo(ball.mesh.position);
            if (distance < 1.5) {
                console.log(`Collision detected between player ${p.mesh.name} and ball ${ball.id}`);
                if (ball.hitGround) {
                    handleBallCatch(ball.id, p, balls, scene, markers, world, players, broadcastBallRemoval, socket);
                    playOnce('pickup'); // Play pickup animation once
                } else {
                    handleBallCatch(ball.id, p, balls, scene, markers, world, players, broadcastBallRemoval, socket);
                    playOnce('catch'); // Play catch animation once
                }
            }
        });

        // Check if the ball touches the ground
        if (ball.mesh.position.y <= 0.5) {
            console.log(`Ball ${ball.id} touched the ground`);
            handleBallTouchGround(ball.id, balls, players);
        }
    });
}

export function handleBallCatch(ballId, catcher, balls, scene, markers, world, players, broadcastBallRemoval, socket) {
    const ballIndex = balls.findIndex(b => b.id === ballId);
    if (ballIndex === -1) return;

    const ball = balls[ballIndex];
    if (ball.processed) return;

    ball.processed = true;

    scene.remove(ball.mesh);
    scene.remove(markers.get(ball.id));
    world.removeBody(ball.body);
    balls.splice(ballIndex, 1);
    markers.delete(ball.id);
    broadcastBallRemoval(ball.id);

    if (ball.hitGround) {
        console.log(`Ball caught by player ${catcher.mesh.name} which had already hit the ground, thrown by player ${ball.thrower}`);
        return;
    }

    console.log(`Ball caught by player ${catcher.mesh.name}, thrown by player ${ball.thrower}`);

    // Ensure that the initial position and catch position are valid
    if (ball.initialPosition && catcher.mesh.position) {
        updateCatchDisplay(ball.thrower, ball.initialPosition, catcher.mesh.position, catcher.catchCount, scene);
    } else {
        console.error('Invalid initial or catch position:', ball.initialPosition, catcher.mesh.position);
    }

    if (players[ball.thrower]) {
        catcher.catchCount++;
        players[ball.thrower].catchCount = catcher.catchCount;
    }

    socket.emit('catchUpdate', {
        catcherId: catcher.mesh.name,
        throwerId: ball.thrower,
        catchCount: catcher.catchCount
    });

    catcher.canThrow = true;
}

export function handleBallTouchGround(ballId, balls, players) {
    const ball = balls.find(b => b.id === ballId);
    if (!ball) return;

    console.log(`Ball thrown by player ${ball.thrower} hit the ground`);
    ball.hitGround = true;

    if (players[ball.thrower]) {
        players[ball.thrower].catchCount = 0;
    }
}
