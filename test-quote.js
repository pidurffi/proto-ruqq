const axios = require('axios');

async function testQuote() {
  try {
    const response = await axios.post('http://localhost:3001/api/quotes/calculate', {
      pax: 4,
      checkInDate: '2025-10-01',
      checkOutDate: '2025-10-10'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testQuote();