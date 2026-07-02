import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// ================================
// USER -> SOCKET MAP
// ================================
const userSocketMap = {};

// return socket id of any user
export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

io.use(socketAuthMiddleware);

// ================================
// CONNECTION
// ================================
io.on("connection", (socket) => {
  const user = socket.user;

  if (!user?._id) {
    socket.disconnect(true);
    return;
  }

  const userId = user._id.toString();

  console.log("🟢 User Connected:", userId);

  // save socket
  userSocketMap[userId] = socket.id;

  // send online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ================================
  // DISCONNECT
  // ================================
  socket.on("disconnect", () => {
    console.log("🔴 User Disconnected:", userId);

    delete userSocketMap[userId];

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, server };
