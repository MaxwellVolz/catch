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

Browser experience with websockets and threejs.


## Mixamo Model Stuff

[Converter](https://github.com/vis-prime/BlenderMixamo2glTFConverter)
### Folder Structure

Created with showtree "C:/Scripts/Show-Tree.ps":

```sh
project-root
├── game-client
│   ├── public
│   │   ├── assets
│   │   │   ├── characters
│   │   │   │   ├── anim
│   │   │   │   │   ├── Idle.fbx
│   │   │   │   │   ├── Jump.fbx
│   │   │   │   │   └── Running.fbx
│   │   │   │   └── dude.fbx
│   │   │   ├── models
│   │   │   │   ├── dude.glb
│   │   │   │   └── dude2.glb
│   ├── src
│   │   ├── components
│   │   │   ├── baseball.js
│   │   │   ├── player.js
│   │   │   ├── scene.js
│   │   │   └── socket.js
│   │   ├── styles
│   │   │   └── styles.css
│   │   ├── index.html
│   │   ├── index.js
│   └── vite.config.js
├── game-server
│   ├── src
│   │   └── server.js
└── README.md

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



