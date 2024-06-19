# Play Catch

- [Play Catch](#play-catch)
  - [Project Overview](#project-overview)
  - [Mixamo Model Stuff](#mixamo-model-stuff)
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



## Mixamo Model Stuff

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



