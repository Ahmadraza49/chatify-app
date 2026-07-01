import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
});

// Auth middleware
io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
  const user = socket.user;

  if (!user?._id) {
    socket.disconnect(true);
    return;
  }

  const userId = user._id.toString();

  console.log("🟢 CONNECTED:", userId);

  // ✅ USER JOIN OWN ROOM
  socket.join(userId);

  // ✅ ONLINE USERS LIST
  const getOnlineUsers = () => {
    const rooms = io.sockets.adapter.rooms;
    const onlineUsers = [];

    for (const [roomId, sockets] of rooms) {
      // filter only user rooms (not socket rooms)
      if (sockets.size >= 1) {
        onlineUsers.push(roomId);
      }
    }

    return onlineUsers;
  };

  io.emit("getOnlineUsers", getOnlineUsers());

  // ✅ SEND MESSAGE
  socket.on("sendMessage", (data) => {
    // data: { receiverId, message, ... }

    io.to(data.receiverId).emit("receiveMessage", {
      senderId: userId,
      message: data.message,
      createdAt: new Date(),
    });
  });

  // ✅ DISCONNECT
  socket.on("disconnect", () => {
    console.log("🔴 DISCONNECTED:", userId);

    // update online users
    io.emit("getOnlineUsers", getOnlineUsers());
  });
});

export { io, app, server };
