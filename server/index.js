require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config({ path: __dirname + "/.env" });


// Import database connection
const connectDB = require("./config/database");

// Import routes
const eventRoutes = require("./routes/events");
const postRoutes = require("./routes/Post");
const createPostRoutes = require("./routes/CreatePosts");
const recognitionRoutes = require("./routes/recognitions");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");

// Import models
const User = require("./models/user");
const Message = require("./models/Message");
const ChatRoom = require("./models/ChatRoom");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store connected users
const connectedUsers = new Map();

// Connect to database
connectDB();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); 


// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"], // React dev servers
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files for uploaded media
app.use("/uploads", express.static("public/uploads"));

// Routes
app.use("/api/events", eventRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/createposts", createPostRoutes);
app.use("/api/recognitions", recognitionRoutes);
app.use("/api/", authRoutes);
app.use("/api/chat", chatRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HRMS Backend Server is running!",
    timestamp: new Date().toISOString(),
  });
});

// Default route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to HRMS Backend API",
    version: "1.0.0",
    endpoints: {
      events: "/api/events",
      recognitions: "/api/recognitions",
      health: "/api/health",
    },
  });
});

// Error handler middleware (should be last)
app.use(errorHandler);

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // Handle user joining
  socket.on("userJoin", async (userData) => {
    try {
      const { userId, name, email, image } = userData;

      // Store user connection info
      connectedUsers.set(socket.id, {
        userId,
        name,
        email,
        image,
        socketId: socket.id,
      });

      // Update user online status in database
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        socketId: socket.id,
        lastSeen: new Date(),
      });

      // Get all online users
      const onlineUsers = Array.from(connectedUsers.values());

      // Broadcast updated online users list
      io.emit("onlineUsers", onlineUsers);

      console.log(`✅ ${name} joined the chat`);
    } catch (error) {
      console.error("Error handling user join:", error);
    }
  });

  // Handle sending messages
  socket.on("sendMessage", async (messageData) => {
    try {
      const { senderId, receiverId, content, messageType = "text", fileName, fileUrl, isGlobal = true, chatRoomId, messageScope = "global" } = messageData;

      // Determine message scope
      let scope = messageScope;
      if (chatRoomId) scope = "room";
      else if (!isGlobal && receiverId) scope = "private";
      else scope = "global";

      // Create new message
      const newMessage = new Message({
        sender: senderId,
        receiver: scope === "private" ? receiverId : null,
        chatRoom: scope === "room" ? chatRoomId : null,
        content,
        messageType,
        fileName,
        fileUrl,
        isGlobal: scope === "global",
        messageScope: scope,
      });

      await newMessage.save();

      // Populate sender and receiver information
      await newMessage.populate("sender", "name email image");
      if (scope === "private" && receiverId) {
        await newMessage.populate("receiver", "name email image");
      }
      if (scope === "room" && chatRoomId) {
        await newMessage.populate("chatRoom", "name");
      }

      const messageToSend = {
        _id: newMessage._id,
        sender: newMessage.sender,
        receiver: newMessage.receiver,
        chatRoom: newMessage.chatRoom,
        content: newMessage.content,
        messageType: newMessage.messageType,
        fileName: newMessage.fileName,
        fileUrl: newMessage.fileUrl,
        isGlobal: newMessage.isGlobal,
        messageScope: newMessage.messageScope,
        createdAt: newMessage.createdAt,
      };

      if (scope === "global") {
        // Broadcast to all connected clients for global messages
        io.emit("newMessage", messageToSend);
      } else if (scope === "room") {
        // Send to all room members
        try {
          const room = await ChatRoom.findById(chatRoomId).populate("members.user", "_id");
          if (room) {
            // Update room message count and last activity
            room.messageCount += 1;
            room.lastActivity = new Date();
            await room.save();

            // Send to all room members who are online
            room.members.forEach(member => {
              const memberSocketId = Array.from(connectedUsers.keys()).find(
                socketId => connectedUsers.get(socketId).userId === member.user._id.toString()
              );
              if (memberSocketId) {
                io.to(memberSocketId).emit("newMessage", messageToSend);
              }
            });
          }
        } catch (roomError) {
          console.error("Error handling room message:", roomError);
        }
      } else {
        // Send to specific users for private messages
        const receiverInfo = connectedUsers.get(
          Array.from(connectedUsers.keys()).find(
            socketId => connectedUsers.get(socketId).userId === receiverId
          )
        );

        // Send to receiver if online
        if (receiverInfo) {
          io.to(receiverInfo.socketId).emit("newMessage", messageToSend);
        }

        // Send back to sender
        socket.emit("newMessage", messageToSend);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  // Handle joining chat rooms
  socket.on("joinRoom", async (data) => {
    try {
      const { roomId, userId } = data;
      const room = await ChatRoom.findById(roomId);

      if (room && room.isMember(userId)) {
        socket.join(`room_${roomId}`);

        // Notify other room members
        socket.to(`room_${roomId}`).emit("userJoinedRoom", {
          roomId,
          userId,
          message: `User joined the room`,
        });
      }
    } catch (error) {
      console.error("Error joining room:", error);
    }
  });

  // Handle leaving chat rooms
  socket.on("leaveRoom", async (data) => {
    try {
      const { roomId, userId } = data;
      socket.leave(`room_${roomId}`);

      // Notify other room members
      socket.to(`room_${roomId}`).emit("userLeftRoom", {
        roomId,
        userId,
        message: `User left the room`,
      });
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  });

  // Handle user typing
  socket.on("typing", (data) => {
    const { roomId, chatType } = data;

    if (chatType === "room" && roomId) {
      socket.to(`room_${roomId}`).emit("userTyping", data);
    } else {
      socket.broadcast.emit("userTyping", data);
    }
  });

  socket.on("stopTyping", (data) => {
    const { roomId, chatType } = data;

    if (chatType === "room" && roomId) {
      socket.to(`room_${roomId}`).emit("userStoppedTyping", data);
    } else {
      socket.broadcast.emit("userStoppedTyping", data);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", async () => {
    try {
      const userInfo = connectedUsers.get(socket.id);

      if (userInfo) {
        // Update user offline status in database
        await User.findByIdAndUpdate(userInfo.userId, {
          isOnline: false,
          socketId: null,
          lastSeen: new Date(),
        });

        // Remove from connected users
        connectedUsers.delete(socket.id);

        // Get updated online users list
        const onlineUsers = Array.from(connectedUsers.values());

        // Broadcast updated online users list
        io.emit("onlineUsers", onlineUsers);

        console.log(`❌ ${userInfo.name} disconnected`);
      }
    } catch (error) {
      console.error("Error handling user disconnect:", error);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 HRMS Server is running on port ${PORT}`);
  console.log(`💬 Socket.IO Chat Server is ready`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
