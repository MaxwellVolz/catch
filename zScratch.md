

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
│   └── vite config ?
├── src
│   ├── index.js
│   ├── index.html
│   ├── libs
│   │   ├── socket.io.js
│   ├── player.js
│   ├── scene.js
│   └── socket.js
├── node_modules/
├── package.json

game-server
├── src
│   ├── server.js
│   └── server_config

```

