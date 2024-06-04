

Ok! New project! Making a browser game with websockets and threejs.

| name       | desc              |
| ---------- | ----------------- |
| Threejs    | frontend renderer |
| Websockets | multiplayer RTC   |
| Vite       | bundler           |

lets setup the project folders, thinking something like this but open to suggestions

```sh
game-client
├── assets
│   ├── player.png
│   └── background.png
├── bundlers
│   └── 
├── src
│   ├── index.js
│   ├── index.html
│   ├── libs
│   │   ├── socket.io.js
│   ├── player.js
│   ├── scene.js
│   └── socket.js
├── node_modules
│   ├── phaser
│   │   └── dist
│   │       └── phaser.js
│   ├── socket.io-client
│   │   └── dist
│   │       └── socket.io.js
├── package.json

game-server
├── src
│   ├── server.js
│   └── server_config


