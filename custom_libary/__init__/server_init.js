const express = require('express');
const path = require('path');
const http = require('http');
const app = express();

const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);
    
export function initializeServer() {
    // Middleware and route setup
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));

    // Start the server
    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

module.exports = { express, app, server, io };