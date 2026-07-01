import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const getAllContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("contacts", "-password");

    res.status(200).json(user.contacts);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};
/* ===========================
   ADD CONTACT BY PHONE NUMBER
=========================== */
export const addContactByPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    const me = await User.findById(req.user._id);

    const contact = await User.findOne({
      phoneNumber,
    });

    if (!contact) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (contact._id.toString() === me._id.toString()) {
      return res.status(400).json({
        message: "You cannot add yourself",
      });
    }

    const alreadyAdded = me.contacts.some(
      (id) => id.toString() === contact._id.toString()
    );

    if (alreadyAdded) {
      return res.status(400).json({
        message: "Contact already added",
      });
    }

    me.contacts.push(contact._id);

    await me.save();

    const updatedUser = await User.findById(me._id)
      .populate("contacts", "-password");

    res.status(200).json(updatedUser.contacts);
  } catch (error) {
    console.log("Error in addContact:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};
export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image && !audio) {
      return res.status(400).json({
        message: "Text, image or audio is required.",
      });
    }

    if (senderId.equals(receiverId)) {
      return res.status(400).json({
        message: "Cannot send messages to yourself.",
      });
    }

    const receiverExists = await User.exists({
      _id: receiverId,
    });

    if (!receiverExists) {
      return res.status(404).json({
        message: "Receiver not found.",
      });
    }

    let imageUrl = "";
    let audioUrl = "";

    // Upload Image
    if (image) {
      const uploadedImage = await cloudinary.uploader.upload(image, {
        folder: "chat-images",
      });

      imageUrl = uploadedImage.secure_url;
    }

    // Upload Audio
    if (audio) {
      const uploadedAudio = await cloudinary.uploader.upload(audio, {
        resource_type: "video",
        folder: "chat-audios",
      });

      audioUrl = uploadedAudio.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      audio: audioUrl,
    });

    await newMessage.save();

    // =======================
    // DEBUG LOGS
    // =======================
    console.log("========== SEND MESSAGE ==========");
    console.log("Sender:", senderId.toString());
    console.log("Receiver:", receiverId);

    const receiverSocketId = getReceiverSocketId(receiverId);

    console.log("Receiver Socket ID:", receiverSocketId);

    if (receiverSocketId) {
      console.log("✅ Emitting socket event...");
      io.to(receiverSocketId).emit("newMessage", newMessage);
    } else {
      console.log("❌ Receiver is not connected.");
    }

    res.status(201).json(newMessage);

  } catch (error) {
    console.log("Error in sendMessage:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // find all the messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

    res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};