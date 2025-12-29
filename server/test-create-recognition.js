const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

// Test data for creating a recognition
const testRecognition = {
  from: 'Alice Johnson',
  to: 'Bob Smith',
  message: 'Excellent teamwork on the quarterly project! Your collaboration skills really made the difference.',
  category: 'teamwork'
};

async function testCreateRecognition() {
  console.log('🧪 Testing Create Recognition API...\n');

  try {
    console.log('📝 Creating recognition with data:', testRecognition);
    
    const response = await axios.post(`${API_BASE_URL}/recognitions`, testRecognition);
    
    console.log('✅ Recognition created successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    // Test fetching all recognitions to see the new one
    console.log('\n📋 Fetching all recognitions...');
    const getAllResponse = await axios.get(`${API_BASE_URL}/recognitions`);
    console.log(`✅ Total recognitions: ${getAllResponse.data.data.length}`);
    
    // Show the latest recognition
    const latestRecognition = getAllResponse.data.data[0];
    console.log('🆕 Latest recognition:', {
      id: latestRecognition._id,
      from: latestRecognition.from,
      to: latestRecognition.to,
      message: latestRecognition.message,
      category: latestRecognition.category,
      timestamp: latestRecognition.createdAt
    });

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testCreateRecognition();
