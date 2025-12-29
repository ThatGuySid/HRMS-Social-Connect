const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
     password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    contact: {
      type: Number,
      required: true,
    },

    image: {
      type: String,
      trim: true,
      default:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
    },
    // Chat-related fields
    isOnline: {
      type: Boolean,
      default: false,
    },
    socketId: {
      type: String,
      default: null,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    // Additional user fields for better profile management
    department: {
      type: String,
      default: "General",
    },
    manager: {
      type: String,
      default: "Manager",
    },
    joinDate: {
      type: String,
      default: "2025-06-21T04:49:21.047",
    },
    employeeId: {
      type: String,
      default: function() {
        return this._id;
      },
    },
  },
  {
    timestamps: true,
  }
);


const User = mongoose.model("User", userSchema);

module.exports = User;
