import { describe, it, expect, afterEach } from "vitest";
import WebSocket from "ws";
import { createServer } from "../src/server.js";
import type { Server } from "http";

describe("WebSocket", () => {
    let server: Server;

    afterEach(() => {
        server.close();
    });

    it("accepts a WebSocket connection", async () => {
        server = createServer();

        await new Promise<void>((resolve) => {
            server.listen(0, resolve);
        });

        const address = server.address();

        if (!address || typeof address === "string") {
            throw new Error("Could not get server address");
        }

        const ws = new WebSocket(`ws://localhost:${address.port}/ws`);

        await new Promise<void>((resolve, reject) => {
            ws.on("open", () => {
                expect(ws.readyState).toBe(WebSocket.OPEN);
                ws.close();
                resolve();
            });

            ws.on("error", reject);
        });
    });
});