const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

// Test data for creating a recognition
const testRecognition = {
  from: 'John Doe',
  to: 'Jane Smith',
  message: 'Great job on the project! Your attention to detail and teamwork made all the difference.',
  category: 'teamwork'
};

async function testRecognitionAPI() {
  console.log('🧪 Testing Recognition API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Test 2: Create a recognition
    console.log('2. Creating a new recognition...');
    const createResponse = await axios.post(`${API_BASE_URL}/recognitions`, testRecognition);
    console.log('✅ Recognition created:', createResponse.data);
    const recognitionId = createResponse.data.data._id;
    console.log('');

    // Test 3: Get all recognitions
    console.log('3. Fetching all recognitions...');
    const getAllResponse = await axios.get(`${API_BASE_URL}/recognitions`);
    console.log('✅ All recognitions:', getAllResponse.data);
    console.log('');

    // Test 4: Get recognition statistics
    console.log('4. Fetching recognition statistics...');
    const statsResponse = await axios.get(`${API_BASE_URL}/recognitions/stats/overview`);
    console.log('✅ Statistics:', statsResponse.data);
    console.log('');

    // Test 5: Get single recognition
    console.log('5. Fetching single recognition...');
    const getSingleResponse = await axios.get(`${API_BASE_URL}/recognitions/${recognitionId}`);
    console.log('✅ Single recognition:', getSingleResponse.data);
    console.log('');

    // Test 6: Add like to recognition
    console.log('6. Adding like to recognition...');
    const likeResponse = await axios.post(`${API_BASE_URL}/recognitions/${recognitionId}/like`);
    console.log('✅ Like added:', likeResponse.data);
    console.log('');

    // Test 7: Get top recipients
    console.log('7. Fetching top recipients...');
    const topRecipientsResponse = await axios.get(`${API_BASE_URL}/recognitions/top-recipients`);
    console.log('✅ Top recipients:', topRecipientsResponse.data);
    console.log('');

    console.log('🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running on port 5000');
      console.log('   Run: node index.js');
    }
  }
}

// Run the tests
testRecognitionAPI();
