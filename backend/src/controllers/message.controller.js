import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

/* ===========================
   GET ALL CONTACTS
=========================== */
export const getAllContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "contacts",
      "-password"
    );

    res.status(200).json(user.contacts);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===========================
   ADD CONTACT
=========================== */
export const addContactByPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const me = await User.findById(req.user._id);

    const contact = await User.findOne({ phoneNumber });

    if (!contact) {
      return res.status(404).json({ message: "User not found" });
    }

    if (contact._id.toString() === me._id.toString()) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    const alreadyAdded = me.contacts.some(
      (id) => id.toString() === contact._id.toString()
    );

    if (alreadyAdded) {
      return res.status(400).json({ message: "Contact already added" });
    }

    me.contacts.push(contact._id);
    await me.save();

    const updatedUser = await User.findById(me._id).populate(
      "contacts",
      "-password"
    );

    res.status(200).json(updatedUser.contacts);
  } catch (error) {
    console.log("Error in addContact:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===========================
   GET MESSAGES
=========================== */
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
    console.log("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ===========================
   SEND MESSAGE (FIXED REAL-TIME)
=========================== */
export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio } = req.body;

    const senderId = req.user._id;
    const receiverId = req.params.id;

    if (!text && !image && !audio) {
      return res.status(400).json({
        message: "Text, image or audio is required.",
      });
    }

    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({
        message: "Cannot send messages to yourself.",
      });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        message: "Receiver not found.",
      });
    }

    let imageUrl = "";
    let audioUrl = "";

    // ======================
    // IMAGE
    // ======================

    if (image) {
      const uploadedImage = await cloudinary.uploader.upload(image, {
        folder: "chat-images",
      });

      imageUrl = uploadedImage.secure_url;
    }

    // ======================
    // AUDIO
    // ======================

    if (audio) {
      const uploadedAudio = await cloudinary.uploader.upload(audio, {
        resource_type: "video",
        folder: "chat-audios",
      });

      audioUrl = uploadedAudio.secure_url;
    }

    // ======================
    // SAVE MESSAGE
    // ======================

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      audio: audioUrl,
    });

    // populate sender/receiver
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "-password")
      .populate("receiverId", "-password");

    // ======================
    // SOCKET
    // ======================

    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId.toString());

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "newMessage",
        populatedMessage
      );
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit(
        "newMessage",
        populatedMessage
      );
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Send Message Error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
/* ===========================
   CHAT PARTNERS
=========================== */
export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: loggedInUserId },
        { receiverId: loggedInUserId },
      ],
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

    const chatPartners = await User.find({
      _id: { $in: chatPartnerIds },
    }).select("-password");

    res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
