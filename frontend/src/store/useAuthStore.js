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

  // ======================
  // AUTH CHECK
  // ======================
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
    } catch (error) {
      console.log("Error in authCheck:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // ======================
  // SIGNUP
  // ======================
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  // ======================
  // LOGIN
  // ======================
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // ======================
  // LOGOUT
  // ======================
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");

      const socket = get().socket;
      if (socket) socket.disconnect();

      set({ authUser: null, socket: null });
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Logout error");
    }
  },

  // ======================
  // SOCKET CONNECT (FIXED)
  // ======================
  connectSocket: () => {
    const { authUser, socket } = get();

    if (!authUser || socket?.connected) return;

    const newSocket = io(BASE_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: false,
    });

    newSocket.connect();

    newSocket.on("connect", () => {
      console.log("🟢 SOCKET CONNECTED:", newSocket.id);
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    newSocket.on("disconnect", () => {
      console.log("🔴 SOCKET DISCONNECTED");
    });

    set({ socket: newSocket });
  },

  // ======================
  // SOCKET DISCONNECT
  // ======================
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
