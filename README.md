# Play Catch

- [Play Catch](#play-catch)
  - [Project Overview](#project-overview)
  - [Game Architecture](#game-architecture)
    - [Server-Side Components:](#server-side-components)
    - [Client-Side Components:](#client-side-components)
  - [Mixamo Model Stuff](#mixamo-model-stuff)
    - [Data Flow:](#data-flow)
  - [Server-Side Code](#server-side-code)
    - [Folder Structure](#folder-structure)
  - [Links](#links)
  - [Install](#install)
  - [Game Client](#game-client)
    - [Setup](#setup)
    - [Dev](#dev)
    - [Prod](#prod)
  - [Game server](#game-server)
    - [Setup](#setup-1)
    - [Dev](#dev-1)
    - [Prod](#prod-1)
  - [Model Creation](#model-creation)


## Project Overview


Game Concept

Browser-based multiplayer single lobby game

1. each client gets a Character (position,name,catchCount=0) that they can move around the scene
   1. sphere collider
      1. collision with Ball broadcasts message to all clients and removes ball from the scene
   2. rendered mesh from a .glb
2. the Character (position,name,catchCount) is broadcast to the network and shared with other players
3. other players (position,name,catchCount) are received and updated for each client
   1. when a player disconnects or stops updating after X seconds they should be removed from the scene
4. clients can throw a Ball
   1. this broadcasts a message to all clients with (position, rotation, velocity) for the creation of the Ball
   2. a Ball is a physics object that is created locally for all clients
      1. sphere collider
      2. rendered mesh


## Game Architecture

### Server-Side Components:

1. **Lobby Manager**: Handles players joining/leaving the lobby.
1. **Character Manager**: Manages the state of characters (position, name, catchCount).
1. **Ball Manager**: Handles the creation, movement, and removal of balls.
1. **Socket.io**: Facilitates real-time communication between server and clients.

### Client-Side Components:

1. **Three.js Scene**: Renders the 3D environment, characters, and balls.
1. **Physics Engine (Cannon.js)**: Manages physics for characters and balls.
1. **Socket.io Client**: Handles communication with the server.
1. **Game Logic**: Manages character movement, ball throwing, and state updates.
## Mixamo Model Stuff

### Data Flow:

1. Player Joins:
  - Client sends joinLobby with player info.
  - Server updates lobby and broadcasts new player to all clients.
2. Player Moves:
  - Client sends updateCharacter with position and state.
  - Server broadcasts updated character state to all clients.
3. Ball Thrown:
  - Client sends throwBall with ball data (position, rotation, velocity).
  - Server broadcasts ball data to all clients.
  - Each client creates a local ball instance.
4. Ball Caught:
  - Collision detected locally.
  - Client sends ballCaught event.
  - Server broadcasts ball removal to all clients.
5. Player Disconnects:
  - Server detects disconnect.
  - Server broadcasts removal of player to all clients.


```sh
                    +---------------------------+
                    |         Server            |
                    |                           |
                    |  +---------------------+  |
                    |  |   Lobby Manager     |  |
                    |  +---------------------+  |
                    |  +---------------------+  |
                    |  | Character Manager   |  |
                    |  +---------------------+  |
                    |  +---------------------+  |
                    |  |    Ball Manager     |  |
                    |  +---------------------+  |
                    |  +---------------------+  |
                    |  |      Socket.io      |  |
                    |  +---------------------+  |
                    +-------------|-------------+
                                  |
                 +----------------|------------------+
                 |                |                  |
+----------------|---------+  +---|--------------+  +-|--------------+
|     Client 1             |  |     Client 2     |  |     Client 3   |
| +---------------------+  |  | +--------------+ |  | +--------------+|
| | Three.js Scene      |  |  | | Three.js Scene| |  | | Three.js Scene|
| +---------------------+  |  | +--------------+ |  | +--------------+|
| | Physics Engine      |  |  | | Physics Engine| |  | | Physics Engine|
| +---------------------+  |  | +--------------+ |  | +--------------+|
| | Socket.io Client    |  |  | | Socket.io Cl. | |  | | Socket.io Cl. |
| +---------------------+  |  | +--------------+ |  | +--------------+|
| | Game Logic          |  |  | | Game Logic   | |  | | Game Logic    |
| +---------------------+  |  | +--------------+ |  | +--------------+|
+---------------------------+  +------------------+  +-----------------+

```

## Server-Side Code


[Converter](https://github.com/vis-prime/BlenderMixamo2glTFConverter)
### Folder Structure

Created with showtree "C:/Scripts/Show-Tree.ps":

```sh
game-client/
│
├── src/
│   ├── assets/                  # Static assets like models, textures, and sounds
│   ├── components/              # Reusable game components like players and balls
│   │   ├── Player.js
│   │   └── Ball.js
│   │
│   ├── core/                    # Core game logic and initialization code
│   │   ├── GameLoop.js
│   │   ├── Init.js
│   │   └── Networking.js
│   │
│   ├── handlers/                # Event handlers and specific game logic
│   │   ├── InputHandler.js
│   │   ├── CollisionHandler.js
│   │   └── GameStateHandler.js
│   │
│   ├── utils/                   # Utility functions and helpers
│   │   ├── AnimationUtils.js
│   │   ├── PhysicsUtils.js
│   │   └── SceneUtils.js
│   │
│   ├── main.js                  # Entry point for setting up the game
│   └── styles.css               # Stylesheet for any HTML elements
│
├── public/
│   ├── index.html               # Main HTML file
│   └── favicon.ico              # Favicon
│
└── package.json                 # Node.js package file

```
## Links

[https://gero3.github.io/facetype.js/](https://gero3.github.io/facetype.js/)

## Install

## Game Client

### Setup

1. Install dependencies:

```sh
npm install
```

### Dev

1. Run development server:

```sh
npm run dev
```

### Prod

1. Build for production:

```sh
npm run build
```

1. Serve built project:

```sh
npm run serve
```

## Game server

### Setup

1. Install dependencies:

```sh
npm install
```

### Dev

3. Start the server with nodemon for development:

```sh
npm run dev
```

### Prod

2. Start the server:

```sh
npm run start
```

## Model Creation

Mixamo -> Blender -> .glb

[ref](https://www.donmccurdy.com/2017/11/06/creating-animated-gltf-characters-with-mixamo-and-blender/)



