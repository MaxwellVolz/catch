class CharacterManager {
    constructor(io) {
        this.io = io;
        this.characters = {}; // Store information about characters
    }

    // Handle character state updates
    handleUpdateCharacter(socket, data) {
        if (this.characters[socket.id]) {
            this.characters[socket.id] = { ...this.characters[socket.id], ...data };
            // Broadcast updated character state to all clients
            this.io.to('lobby').emit('updateCharacter', this.characters[socket.id]);
        }
    }

    // Handle player disconnection
    handleDisconnect(socket) {
        delete this.characters[socket.id];
    }
}

module.exports = CharacterManager;
