class BallManager {
    constructor(io) {
        this.io = io;
        this.balls = {}; // Store information about balls
    }

    // Handle ball throwing
    handleThrowBall(socket, data) {
        const ballId = `ball_${Date.now()}`;
        this.balls[ballId] = { ...data, id: ballId };
        // Broadcast new ball information to all clients
        this.io.to('lobby').emit('throwBall', this.balls[ballId]);
    }

    // Handle ball catching
    handleBallCaught(socket, data) {
        delete this.balls[data.id];
        // Notify all clients that the ball has been caught and removed
        this.io.to('lobby').emit('ballCaught', data.id);
    }
}

module.exports = BallManager;
