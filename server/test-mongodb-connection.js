const mongoose = require("mongoose");
require("dotenv").config();

async function testConnection() {
  try {
    console.log("Testing MongoDB connection...");
    console.log("Connection string:", process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log("✅ MongoDB Connected successfully!");
    console.log("Host:", conn.connection.host);
    console.log("Database:", conn.connection.name);
    
    await mongoose.disconnect();
    console.log("✅ Connection test completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error("Error:", error.message);
    process.exit(1);
  }
}

testConnection();
