class LobbyManager {
    constructor(io) {
        this.io = io;
        this.lobby = {}; // Store information about players in the lobby
    }

    // Handle player joining the lobby
    handleJoinLobby(socket, data) {
        const { name } = data;
        this.lobby[socket.id] = { id: socket.id, name, catchCount: 0, position: { x: 0, y: 0, z: 0 } };
        socket.join('lobby');
        // Notify all clients about the new player
        this.io.to('lobby').emit('playerJoined', this.lobby[socket.id]);
    }

    // Handle player disconnection
    handleDisconnect(socket) {
        delete this.lobby[socket.id];
        // Notify all clients that the player has left
        this.io.to('lobby').emit('playerLeft', socket.id);
    }
}

module.exports = LobbyManager;
