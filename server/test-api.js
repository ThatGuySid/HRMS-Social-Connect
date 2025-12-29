// Simple test script to verify API endpoints
// Run this with: node test-api.js

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

// Test data
const testEvent = {
  title: "Test Event",
  description: "This is a test event created via API",
  category: "Company Meeting",
  time: "10:00",
  location: "Conference Room A",
  date: "June 30, 2024",
  image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
};

async function testAPI() {
  try {
    console.log("🧪 Testing HRMS Events API...\n");

    // Test 1: Health check
    console.log("1. Testing health check...");
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health check passed:", healthResponse.data.message);

    // Test 2: Get all events (should be empty initially)
    console.log("\n2. Testing GET all events...");
    const getAllResponse = await axios.get(`${BASE_URL}/events`);
    console.log("✅ GET all events:", getAllResponse.data);

    // Test 3: Create a new event
    console.log("\n3. Testing POST create event...");
    const createResponse = await axios.post(`${BASE_URL}/events`, testEvent);
    console.log("✅ Event created:", createResponse.data);
    const createdEventId = createResponse.data.data._id;

    // Test 4: Get single event
    console.log("\n4. Testing GET single event...");
    const getSingleResponse = await axios.get(
      `${BASE_URL}/events/${createdEventId}`
    );
    console.log(
      "✅ Single event retrieved:",
      getSingleResponse.data.data.title
    );

    // Test 5: Update event
    console.log("\n5. Testing PUT update event...");
    const updateData = { ...testEvent, title: "Updated Test Event" };
    const updateResponse = await axios.put(
      `${BASE_URL}/events/${createdEventId}`,
      updateData
    );
    console.log("✅ Event updated:", updateResponse.data.data.title);

    // Test 6: Get events by category
    console.log("\n6. Testing GET events by category...");
    const categoryResponse = await axios.get(
      `${BASE_URL}/events/category/Company Meeting`
    );
    console.log(
      "✅ Events by category:",
      categoryResponse.data.count,
      "events found"
    );

    // Test 7: Delete event
    console.log("\n7. Testing DELETE event...");
    const deleteResponse = await axios.delete(
      `${BASE_URL}/events/${createdEventId}`
    );
    console.log("✅ Event deleted:", deleteResponse.data.message);

    console.log("\n🎉 All tests passed! Your API is working correctly.");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run tests
testAPI();
