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

// ✅ clean online users store
const onlineUsers = new Set();

io.on("connection", (socket) => {
  const user = socket.user;

  if (!user?._id) {
    console.log("❌ Unauthorized socket blocked");
    socket.disconnect(true);
    return;
  }

  const userId = user._id.toString();

  console.log("🟢 CONNECTED:", userId);

  // join personal room
  socket.join(userId);

  // add online user
  onlineUsers.add(userId);

  // broadcast online users
  io.emit("getOnlineUsers", Array.from(onlineUsers));

  // =========================
  // SEND MESSAGE
  // =========================
  socket.on("sendMessage", (data) => {
    try {
      console.log("📩 SEND MESSAGE:", data);

      const receiverId = data?.receiverId?.toString();
      const message = data?.message;

      if (!receiverId || !message) {
        console.log("⚠️ Invalid message payload");
        return;
      }

      io.to(receiverId).emit("receiveMessage", {
        senderId: userId,
        message,
        createdAt: new Date(),
      });
    } catch (error) {
      console.log("❌ sendMessage error:", error.message);
    }
  });

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {
    console.log("🔴 DISCONNECTED:", userId);

    onlineUsers.delete(userId);

    io.emit("getOnlineUsers", Array.from(onlineUsers));
  });
});

export { io, app, server };
