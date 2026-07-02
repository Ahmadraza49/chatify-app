import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      console.log("❌ No cookies received");
      return next(new Error("Unauthorized"));
    }

    // Parse cookies
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((cookie) => {
        const [key, ...value] = cookie.trim().split("=");
        return [key, decodeURIComponent(value.join("="))];
      })
    );

    const token = cookies.jwt;

    if (!token) {
      console.log("❌ JWT cookie not found");
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log("❌ User not found");
      return next(new Error("Unauthorized"));
    }

    socket.user = user;
    socket.userId = user._id.toString();

    console.log("🟢 Socket Auth:", user.fullName);

    next();
  } catch (err) {
    console.log("Socket Auth Error:", err.message);
    next(new Error("Unauthorized"));
  }
};
