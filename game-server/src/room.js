const { Room } = require('colyseus');

class MyRoom extends Room {
    onCreate(options) {
        console.log("MyRoom created!", options);
    }

    onJoin(client, options) {
        console.log(client.sessionId, "joined!");
    }

    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
    }

    onDispose() {
        console.log("MyRoom disposed!");
    }
}

module.exports = { MyRoom };
