import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

// store online users safely
const userSocketMap = {}; // { userId: socketId }

const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
});

// auth middleware
io.use(socketAuthMiddleware);

// helper: get socket id of a user
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  const user = socket.user;

  if (!user || !user._id) {
    console.log("❌ Unauthorized socket connection");
    socket.disconnect(true);
    return;
  }

  const userId = user._id.toString();

  console.log("🟢 CONNECTED:", user.fullName || userId);

  // store user socket
  userSocketMap[userId] = socket.id;

  // emit updated online users list
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("🔴 DISCONNECTED:", user.fullName || userId);

    delete userSocketMap[userId];

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
