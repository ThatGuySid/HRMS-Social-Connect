const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for global messages
    },
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      default: null, // null for non-room messages
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "audio", "video", "emoji"],
      default: "text",
    },
    fileName: {
      type: String,
      default: null,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    isGlobal: {
      type: Boolean,
      default: true, // true for global chat, false for private/room chat
    },
    messageScope: {
      type: String,
      enum: ["global", "private", "room"],
      default: "global",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ isGlobal: 1, createdAt: -1 });
messageSchema.index({ messageScope: 1, createdAt: -1 });

// Virtual for formatted creation date
messageSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString();
});

// Virtual for formatted time
messageSchema.virtual("formattedTime").get(function () {
  return this.createdAt.toLocaleTimeString();
});

// Method to mark message as read
messageSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to edit message
messageSchema.methods.editContent = function (newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Method to soft delete message
messageSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method to get recent messages
messageSchema.statics.getRecentMessages = function (limit = 50) {
  return this.find({ isGlobal: true, isDeleted: false })
    .populate("sender", "name email image")
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get private messages between two users
messageSchema.statics.getPrivateMessages = function (userId1, userId2, limit = 50) {
  return this.find({
    isGlobal: false,
    messageScope: "private",
    isDeleted: false,
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 },
    ],
  })
    .populate("sender", "name email image")
    .populate("receiver", "name email image")
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get room messages
messageSchema.statics.getRoomMessages = function (roomId, limit = 50) {
  return this.find({
    chatRoom: roomId,
    messageScope: "room",
    isDeleted: false,
  })
    .populate("sender", "name email image")
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model("Message", messageSchema);
