let SERVER_URL = window.location.origin;
const isLocal = window.location.href.indexOf('localhost') > -1;
if (isLocal) SERVER_URL = 'http://localhost:3000';

async function sendAIMessage(sessionId, message) {
    const response = await fetch((SERVER_URL) + '/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, message }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

    const data = await response.json();
    console.log(data);
    return data.response;
  }
  
  export { sendAIMessage };