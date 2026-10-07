import { WebSocketServer } from "ws";
import type { Server } from "http";

export function setupWebSocket(server: Server) {
    const wss = new WebSocketServer({
        server,
        path: '/ws',
    });

    wss.on("connection", (socket) => {
        console.log("WebSocket client connected");

        socket.send("WebSocket connection established");

        socket.on("close", () => {
            console.log("WebSocket connection is disconnected");
        });
    })
    return wss;
}
