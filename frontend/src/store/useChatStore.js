import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  addContact: async (phoneNumber) => {
  try {
    const res = await axiosInstance.post("/messages/add-contact", {
      phoneNumber,
    });

    set({
      allContacts: res.data,
    });

    toast.success("Contact added successfully");
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to add contact"
    );
  }
},

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

 getMessagesByUserId: async (userId) => {
  // set({ isMessagesLoading: true });   // <-- is line ko comment kar do

  try {
    const res = await axiosInstance.get(`/messages/${userId}`);

    set({
      messages: res.data,
      isMessagesLoading: false,
    });
  } catch (error) {
    console.log(error);

    set({
      isMessagesLoading: false,
    });
  }
},
sendMessage: async (messageData) => {
  const { selectedUser } = get();

  if (!selectedUser?._id) return;

  try {
    await axiosInstance.post(
      `/messages/send/${selectedUser._id}`,
      messageData
    );

    // ❌ Yahan messages state manually update nahi karni.
    // Backend newMessage emit karega aur subscribeToMessages
    // automatically message add kar dega.

  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to send message"
    );
  }
},

subscribeToMessages: () => {
  const socket = useAuthStore.getState().socket;

  if (!socket) return;

  socket.off("newMessage");

  socket.on("newMessage", (newMessage) => {
    const { selectedUser } = get();

    if (!selectedUser) return;

    const senderId =
      typeof newMessage.senderId === "object"
        ? newMessage.senderId._id
        : newMessage.senderId;

    const receiverId =
      typeof newMessage.receiverId === "object"
        ? newMessage.receiverId._id
        : newMessage.receiverId;

    // Sirf current open chat ke messages add karo
    if (
      senderId.toString() !== selectedUser._id.toString() &&
      receiverId.toString() !== selectedUser._id.toString()
    ) {
      return;
    }

    set((state) => {
      // duplicate message na aaye
      const exists = state.messages.some(
        (m) => m._id.toString() === newMessage._id.toString()
      );

      if (exists) return state;

      return {
        messages: [...state.messages, newMessage],
      };
    });
  });
},

 unsubscribeFromMessages: () => {
  const socket = useAuthStore.getState().socket;

  if (!socket) return;

  socket.off("newMessage");
},
}));
