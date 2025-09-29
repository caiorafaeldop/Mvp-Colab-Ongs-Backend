const axios = require('axios');

async function test() {
  try {
    const response = await axios.post('http://localhost:3000/api/donations/single', {
      organizationId: 'test-123',
      organizationName: 'Test Org',
      amount: 10,
      donorName: 'Test',
      donorEmail: 'test@test.com'
    });
    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.log('ERROR:', error.response?.data || error.message);
  }
}

test();
