import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// we will use this function to check if the user is online or not
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// this is for storig online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.user.fullName);
  console.log("Socket ID:", socket.id);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  console.log("ONLINE USERS:", userSocketMap);

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("DISCONNECTED:", socket.user.fullName);

    delete userSocketMap[userId];

    console.log("ONLINE USERS:", userSocketMap);

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});


export { io, app, server };