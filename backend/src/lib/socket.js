import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

// ======================
// SOCKET SETUP
// ======================
const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// auth middleware
io.use(socketAuthMiddleware);

// ======================
// ONLINE USERS
// ======================
const onlineUsers = new Set();

// ======================
// CONNECTION
// ======================
io.on("connection", (socket) => {
  const user = socket.user;

  if (!user?._id) {
    console.log("❌ Unauthorized socket blocked");
    socket.disconnect(true);
    return;
  }

  const userId = user._id.toString();

  console.log("🟢 CONNECTED:", userId);

  socket.join(userId);

  onlineUsers.add(userId);

  io.emit("getOnlineUsers", Array.from(onlineUsers));

  // ======================
  // SEND MESSAGE
  // ======================
  socket.on("sendMessage", (data) => {
    try {
      console.log("📩 MESSAGE:", data);

      const receiverId = String(data?.receiverId || "");
      const message = data?.message;

      if (!receiverId || !message) return;

      const payload = {
        senderId: userId,
        message,
        createdAt: new Date(),
      };

      // send to receiver
      io.to(receiverId).emit("receiveMessage", payload);

      // send to sender (sync)
      io.to(userId).emit("receiveMessage", payload);
    } catch (error) {
      console.log("❌ sendMessage error:", error.message);
    }
  });

  // ======================
  // DISCONNECT
  // ======================
  socket.on("disconnect", () => {
    console.log("🔴 DISCONNECTED:", userId);

    onlineUsers.delete(userId);

    io.emit("getOnlineUsers", Array.from(onlineUsers));
  });
});

export { io, app, server };
