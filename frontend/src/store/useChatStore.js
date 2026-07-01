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
  const { selectedUser, messages } = get();
  const { authUser } = useAuthStore.getState();

  const tempId = `temp-${Date.now()}`;

  const optimisticMessage = {
    _id: tempId,
    senderId: authUser._id,
    receiverId: selectedUser._id,
    text: messageData.text || "",
    image: messageData.image || "",
    audio: messageData.audio || "",
    createdAt: new Date().toISOString(),
    isOptimistic: true,
  };

  set({
    messages: [...messages, optimisticMessage],
  });

  try {
    const res = await axiosInstance.post(
      `/messages/send/${selectedUser._id}`,
      messageData
    );

    set((state) => ({
      messages: state.messages
        .filter((m) => m._id !== tempId)
        .concat(res.data),
    }));
  } catch (error) {
    set({
      messages,
    });

    toast.error(
      error.response?.data?.message || "Something went wrong"
    );
  }
},

 subscribeToMessages: () => {
  const { selectedUser, isSoundEnabled } = get();

  if (!selectedUser) return;

  const socket = useAuthStore.getState().socket;

  if (!socket) return;

  // Purana listener remove karo taake duplicate listeners na banen
  socket.off("newMessage");

  socket.on("newMessage", (newMessage) => {
    console.log("Realtime message received:", newMessage);

    const senderId =
      typeof newMessage.senderId === "object"
        ? newMessage.senderId._id
        : newMessage.senderId;

    // Sirf selected user ke messages show karo
    if (senderId.toString() !== selectedUser._id.toString()) return;

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));

    if (isSoundEnabled) {
      const notificationSound = new Audio("/sounds/notification.mp3");
      notificationSound.currentTime = 0;
      notificationSound.play().catch(() => {});
    }
  });
},

  unsubscribeFromMessages: () => {
  const socket = useAuthStore.getState().socket;

  if (!socket) return;

  socket.off("newMessage");
},
}));