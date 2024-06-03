const { Room } = require('colyseus');

class MyRoom extends Room {
    onCreate(options) {
        this.setState({ players: {} });

        this.onMessage("playerMovement", (client, message) => {
            const player = this.state.players[client.sessionId];
            if (player) {
                player.x = message.x;
                player.y = message.y;
                this.broadcast("playerMoved", {
                    playerId: client.sessionId,
                    x: player.x,
                    y: player.y
                });
            }
        });
    }

    onJoin(client, options) {
        console.log(client.sessionId, "joined!");
        this.state.players[client.sessionId] = { playerId: client.sessionId, x: 0, y: 0 };
        this.broadcast("newPlayer", this.state.players[client.sessionId]);
        client.send("currentPlayers", this.state.players);
    }

    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
        delete this.state.players[client.sessionId];
        this.broadcast("disconnect", client.sessionId);
    }

    onDispose() {
        console.log("MyRoom disposed!");
    }
}

module.exports = { MyRoom };
