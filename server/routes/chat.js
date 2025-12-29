const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/user");
const ChatRoom = require("../models/ChatRoom");

// Get chat history (global messages)
router.get("/messages", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ isGlobal: true })
      .populate("sender", "name email image")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Reverse to show oldest first
    const reversedMessages = messages.reverse();

    res.status(200).json({
      success: true,
      data: reversedMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
    });
  }
});

// Get private messages between two users
router.get("/messages/private/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentUserId, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    if (!currentUserId) {
      return res.status(400).json({
        success: false,
        error: "Current user ID is required",
      });
    }

    const messages = await Message.find({
      isGlobal: false,
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate("sender", "name email image")
      .populate("receiver", "name email image")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Reverse to show oldest first
    const reversedMessages = messages.reverse();

    res.status(200).json({
      success: true,
      data: reversedMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching private messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch private messages",
    });
  }
});

// Get online users
router.get("/online-users", async (req, res) => {
  try {
    const onlineUsers = await User.find({ isOnline: true })
      .select("name email image isOnline lastSeen")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: onlineUsers,
    });
  } catch (error) {
    console.error("Error fetching online users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch online users",
    });
  }
});

// Get all users (for potential private messaging)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({})
      .select("name email image isOnline lastSeen")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
});

// Mark messages as read
router.put("/messages/:messageId/read", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    ).populate("sender", "name email image");

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark message as read",
    });
  }
});

// Delete a message
router.delete("/messages/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found",
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own messages",
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete message",
    });
  }
});

// Get chat statistics
router.get("/stats", async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments({ isGlobal: true });
    const totalUsers = await User.countDocuments({});
    const onlineUsers = await User.countDocuments({ isOnline: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMessages = await Message.countDocuments({
      isGlobal: true,
      createdAt: { $gte: today },
    });

    res.status(200).json({
      success: true,
      data: {
        totalMessages,
        totalUsers,
        onlineUsers,
        todayMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching chat stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat statistics",
    });
  }
});

// ==================== CHAT ROOM ROUTES ====================

// Get all chat rooms
router.get("/rooms", async (req, res) => {
  try {
    const { userId } = req.query;

    const rooms = await ChatRoom.find({
      isActive: true,
      $or: [
        { isPrivate: false }, // Public rooms
        { "members.user": userId }, // Private rooms user is member of
      ]
    })
      .populate("admin", "name email image")
      .populate("members.user", "name email image isOnline")
      .sort({ lastActivity: -1 });

    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat rooms",
    });
  }
});

// Create a new chat room
router.post("/rooms", async (req, res) => {
  try {
    const { name, description, isPrivate, maxMembers, adminId } = req.body;

    if (!name || !adminId) {
      return res.status(400).json({
        success: false,
        error: "Room name and admin ID are required",
      });
    }

    // Check if room name already exists
    const existingRoom = await ChatRoom.findOne({ name: name.trim() });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        error: "A room with this name already exists",
      });
    }

    const newRoom = new ChatRoom({
      name: name.trim(),
      description: description?.trim(),
      admin: adminId,
      isPrivate: isPrivate || false,
      maxMembers: maxMembers || 100,
      members: [{
        user: adminId,
        role: "admin",
        joinedAt: new Date(),
      }],
    });

    await newRoom.save();
    await newRoom.populate("admin", "name email image");
    await newRoom.populate("members.user", "name email image isOnline");

    res.status(201).json({
      success: true,
      data: newRoom,
      message: "Chat room created successfully",
    });
  } catch (error) {
    console.error("Error creating chat room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create chat room",
    });
  }
});

// Join a chat room
router.post("/rooms/:roomId/join", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Chat room not found",
      });
    }

    if (!room.isActive) {
      return res.status(400).json({
        success: false,
        error: "This chat room is no longer active",
      });
    }

    if (room.isMember(userId)) {
      return res.status(400).json({
        success: false,
        error: "User is already a member of this room",
      });
    }

    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({
        success: false,
        error: "Chat room is full",
      });
    }

    const success = room.addMember(userId);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "Failed to join room",
      });
    }

    await room.save();
    await room.populate("admin", "name email image");
    await room.populate("members.user", "name email image isOnline");

    res.status(200).json({
      success: true,
      data: room,
      message: "Successfully joined the chat room",
    });
  } catch (error) {
    console.error("Error joining chat room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to join chat room",
    });
  }
});

// Get messages for a specific chat room
router.get("/rooms/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Check if user is member of the room
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Chat room not found",
      });
    }

    if (!room.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: "You are not a member of this chat room",
      });
    }

    const messages = await Message.find({
      chatRoom: roomId,
      messageScope: "room"
    })
      .populate("sender", "name email image")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Reverse to show oldest first
    const reversedMessages = messages.reverse();

    res.status(200).json({
      success: true,
      data: reversedMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching room messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch room messages",
    });
  }
});

// Leave a chat room
router.post("/rooms/:roomId/leave", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Chat room not found",
      });
    }

    if (!room.isMember(userId)) {
      return res.status(400).json({
        success: false,
        error: "User is not a member of this room",
      });
    }

    if (room.isAdmin(userId) && room.members.length > 1) {
      return res.status(400).json({
        success: false,
        error: "Admin cannot leave room with other members. Transfer admin rights first.",
      });
    }

    const success = room.removeMember(userId);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "Failed to leave room",
      });
    }

    // If admin leaves and no other members, deactivate room
    if (room.members.length === 0) {
      room.isActive = false;
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: "Successfully left the chat room",
    });
  } catch (error) {
    console.error("Error leaving chat room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to leave chat room",
    });
  }
});

module.exports = router;
