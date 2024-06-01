const http = require('http');
const express = require('express');
const { Server } = require('colyseus');
const { monitor } = require('@colyseus/monitor');
const { MyRoom } = require('./room');

const port = process.env.PORT || 2567;
const app = express();

const server = http.createServer(app);
const gameServer = new Server({
    server: server,
    express: app
});

gameServer.define('my_room', MyRoom);

app.use('/colyseus', monitor());

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
