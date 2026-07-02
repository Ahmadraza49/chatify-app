import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : import.meta.env.VITE_API_URL;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,

  socket: null,
  onlineUsers: [],

  // ==========================
  // CHECK AUTH
  // ==========================

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({
        authUser: res.data,
      });

      get().connectSocket();
    } catch (error) {
      console.log(error);

      set({
        authUser: null,
      });
    } finally {
      set({
        isCheckingAuth: false,
      });
    }
  },

  // ==========================
  // SIGNUP
  // ==========================

  signup: async (data) => {
    set({ isSigningUp: true });

    try {
      const res = await axiosInstance.post("/auth/signup", data);

      set({
        authUser: res.data,
      });

      get().connectSocket();

      toast.success("Account created successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({
        isSigningUp: false,
      });
    }
  },

  // ==========================
  // LOGIN
  // ==========================

  login: async (data) => {
    set({ isLoggingIn: true });

    try {
      const res = await axiosInstance.post("/auth/login", data);

      set({
        authUser: res.data,
      });

      get().connectSocket();

      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({
        isLoggingIn: false,
      });
    }
  },

  // ==========================
  // LOGOUT
  // ==========================

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");

      const socket = get().socket;

      if (socket) {
        socket.disconnect();
      }

      set({
        authUser: null,
        socket: null,
        onlineUsers: [],
      });

      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  // ==========================
  // SOCKET CONNECT
  // ==========================

  connectSocket: () => {
    const { authUser, socket } = get();

    if (!authUser) return;

    if (socket?.connected) return;

    const newSocket = io(BASE_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("🟢 Socket Connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("🔴 Socket Disconnected");
    });

    newSocket.on("connect_error", (err) => {
      console.log("Socket Error:", err.message);
    });

    newSocket.on("getOnlineUsers", (users) => {
      console.log("ONLINE USERS:", users);

      set({
        onlineUsers: users,
      });
    });

    set({
      socket: newSocket,
    });
  },

  // ==========================
  // SOCKET DISCONNECT
  // ==========================

  disconnectSocket: () => {
    const socket = get().socket;

    if (socket) {
      socket.disconnect();
    }

    set({
      socket: null,
      onlineUsers: [],
    });
  },
}));
