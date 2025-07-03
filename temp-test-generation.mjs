import fetch from 'node-fetch';

async function runTest() {
  const testBrief = {
    prompt: 'A minimalist logo for a new coffee shop called "The Daily Grind". It should be clean, modern, and feature a stylized coffee bean.',
    industry: 'Food & Beverage',
  };

  console.log('Starting logo generation test...');

  try {
    const response = await fetch('http://localhost:3000/api/generate-logo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brief: {
          prompt: testBrief.prompt,
          industry: testBrief.industry,
        }
      }),
    });

    if (!response.ok) {
      console.error(`Test failed with status: ${response.status}`);
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      return;
    }

    console.log('Test request sent successfully. Streaming response:');

    const decoder = new TextDecoder();

    try {
      for await (const chunk of response.body) {
        const textChunk = decoder.decode(chunk, { stream: true });
        // Process and print chunks as they arrive
        const jsonObjects = textChunk.split('\n').filter(str => str.trim().startsWith('{'));
        jsonObjects.forEach(jsonStr => {
          try {
            const json = JSON.parse(jsonStr);
            console.log('Received data chunk:', JSON.stringify(json, null, 2));
            if (json.type === 'error') {
              console.error('Error during generation:', json.error);
            }
            if (json.type === 'finalResult') {
              console.log('Final result received.');
            }
          } catch (e) {
            // might not be a full JSON object yet
            // console.log("incomplete chunk", jsonStr);
          }
        });
      }
    } catch (err) {
        console.error('Error reading stream:', err);
    }


    console.log('Logo generation test finished.');

  } catch (error) {
    console.error('An unexpected error occurred during the test:', error);
  }
}

runTest();
