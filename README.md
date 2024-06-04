# Play Catch

- [Play Catch](#play-catch)
  - [Project Overview](#project-overview)
    - [Folder Structure](#folder-structure)
  - [Install](#install)
  - [Game Client](#game-client)
    - [Setup](#setup)
    - [Dev](#dev)
    - [Prod](#prod)
  - [Game server](#game-server)
    - [Setup](#setup-1)
    - [Dev](#dev-1)
    - [Prod](#prod-1)


## Project Overview

Browser experience with websockets and threejs.

### Folder Structure

```sh
game-client
├── assets
│   ├── player.png
│   └── background.png
├── bundlers
│   └── vite.config.js
├── src
│   ├── index.js
│   ├── index.html
│   ├── libs
│   │   └── socket.io.js
│   ├── components
│   │   ├── player.js
│   │   ├── scene.js
│   │   └── socket.js
│   └── styles
│       └── main.css
├── node_modules/
├── package.json
└── README.md

game-server
├── src
│   └── server.js
├── node_modules/
├── package.json
└── README.md

```

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

