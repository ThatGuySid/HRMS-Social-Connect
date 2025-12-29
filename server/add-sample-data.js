// Script to add sample event data
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const sampleEvents = [
  {
    title: "Annual Company Meeting",
    description: "Join us for our annual company meeting to discuss achievements and future plans.",
    category: "Company Meeting",
    time: "10:00",
    location: "Main Conference Room",
    date: "June 15, 2024",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400"
  },
  {
    title: "Team Building Workshop",
    description: "A fun-filled team building workshop to strengthen our bonds.",
    category: "Team Building", 
    time: "14:00",
    location: "Outdoor Park",
    date: "June 20, 2024",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400"
  },
  {
    title: "Training Session: New Technologies",
    description: "Learn about the latest technologies and tools in our industry.",
    category: "Training",
    time: "09:00", 
    location: "Training Room A",
    date: "June 25, 2024",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400"
  }
];

async function addSampleData() {
  try {
    console.log('🌱 Adding sample events to database...\n');
    
    for (let i = 0; i < sampleEvents.length; i++) {
      const event = sampleEvents[i];
      console.log(`${i + 1}. Creating event: ${event.title}`);
      
      const response = await axios.post(`${BASE_URL}/events`, event);
      console.log(`✅ Created with ID: ${response.data.data._id}\n`);
    }
    
    console.log('🎉 All sample events added successfully!');
    console.log('📊 Check MongoDB Compass to see the data.');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.response?.data || error.message);
  }
}

addSampleData();
