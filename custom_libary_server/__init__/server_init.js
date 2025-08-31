import expressPkg from 'express';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';

const express = expressPkg;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

export function initializeServer(setting) {
    app.use(express.json());
    app.use(express.static(path.join(process.cwd(), 'testing_workspace')));

    const PORT = setting.port;
    server.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

export { express, app, server, io };
