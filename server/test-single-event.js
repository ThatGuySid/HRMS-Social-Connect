// Test creating a single event
const axios = require('axios');

const testEvent = {
  title: "Frontend Test Event",
  description: "This event is created to test frontend-backend connection",
  category: "Company Meeting",
  time: "15:30",
  location: "Test Room",
  date: "December 10, 2024",
  image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400"
};

async function testCreateEvent() {
  try {
    console.log('🧪 Testing event creation...');
    console.log('Event data:', testEvent);
    
    const response = await axios.post('http://localhost:5000/api/events', testEvent);
    console.log('✅ Success! Event created:', response.data);

    // Now get all events to verify
    const getAllResponse = await axios.get('http://localhost:5000/api/events');
    console.log('📊 All events in database:', getAllResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCreateEvent();
