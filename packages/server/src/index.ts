import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import { GameManager } from "./gameManager.js";
import { registerSocketHandlers } from "./socketHandler.js";

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const gameManager = new GameManager();

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

registerSocketHandlers(io, gameManager);

const PORT = 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
