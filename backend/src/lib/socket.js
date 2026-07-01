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
  transports: ["websocket", "polling"],
  pingTimeout: 60000, // 🔥 IMPORTANT (disconnect fix)
  pingInterval: 25000,
});

// Auth middleware
io.use(socketAuthMiddleware);

// ✅ online users
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

  // join room
  socket.join(userId);

  // mark online
  onlineUsers.add(userId);

  io.emit("getOnlineUsers", Array.from(onlineUsers));

  // =========================
  // SEND MESSAGE
  // =========================
  socket.on("sendMessage", (data) => {
    try {
      console.log("📩 SEND MESSAGE:", data);

      const receiverId = String(data?.receiverId || "");
      const message = data?.message;

      if (!receiverId || !message) {
        console.log("⚠️ Invalid message payload");
        return;
      }

      // 🔥 IMPORTANT FIX: ensure delivery check
      const payload = {
        senderId: userId,
        message,
        createdAt: new Date(),
      };

      // send to receiver
      io.to(receiverId).emit("receiveMessage", payload);

      // ALSO send back to sender (sync fix)
      io.to(userId).emit("receiveMessage", payload);

      console.log(`✅ Message sent: ${userId} → ${receiverId}`);
    } catch (error) {
      console.log("❌ sendMessage error:", error.message);
    }
  });

  // =========================
  // DISCONNECT (FIXED DELAY ISSUE)
  // =========================
  socket.on("disconnect", () => {
    console.log("🔴 DISCONNECTED:", userId);

    // small delay fix (prevents flicker disconnect bug)
    setTimeout(() => {
      const stillConnected = [...io.sockets.adapter.rooms.get(userId) || []].length;

      if (stillConnected === 0) {
        onlineUsers.delete(userId);
        io.emit("getOnlineUsers", Array.from(onlineUsers));
      }
    }, 1000);
  });
});

export { io, app, server };
