const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "moderator", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },

      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxMembers: {
      type: Number,
      default: 100,
      min: 2,
      max: 500,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    avatar: {
      type: String,
      default: null,
    },
    settings: {
      allowFileSharing: {
        type: Boolean,
        default: true,
      },
      allowMemberInvites: {
        type: Boolean,
        default: true,
      },
      muteNotifications: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
// Note: name field already has unique index from schema definition
chatRoomSchema.index({ admin: 1 });
chatRoomSchema.index({ "members.user": 1 });
chatRoomSchema.index({ isActive: 1, isPrivate: 1 });
chatRoomSchema.index({ lastActivity: -1 });

// Virtual for member count
chatRoomSchema.virtual("memberCount").get(function () {
  return this.members.length;
});



// Ensure virtual fields are serialized
chatRoomSchema.set('toJSON', { virtuals: true });
chatRoomSchema.set('toObject', { virtuals: true });

// Method to check if user is a member
chatRoomSchema.methods.isMember = function (userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to check if user is admin
chatRoomSchema.methods.isAdmin = function (userId) {
  return this.admin.toString() === userId.toString();
};



// Method to check if user can moderate
chatRoomSchema.methods.canModerate = function(userId) {
  if (this.isAdmin(userId)) return true;
  const member = this.members.find(member => member.user.toString() === userId.toString());
  return member && (member.role === 'moderator' || member.role === 'admin');
};

// Method to add a member
chatRoomSchema.methods.addMember = function (userId, role = "member") {
  if (this.isMember(userId)) return false;
  if (this.members.length >= this.maxMembers) return false;

  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
  });

  return true;
};

// Method to remove a member
chatRoomSchema.methods.removeMember = function (userId) {
  const memberIndex = this.members.findIndex(
    member => member.user.toString() === userId.toString()
  );

  if (memberIndex === -1) return false;

  this.members.splice(memberIndex, 1);
  return true;
};





// Pre-save middleware to update lastActivity
chatRoomSchema.pre("save", function (next) {
  if (this.isModified("messageCount") || this.isModified('members')) {
    this.lastActivity = new Date();
  }
  next();
});

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
