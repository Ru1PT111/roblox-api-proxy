const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS for all origins
app.use(cors());

// Middleware to handle JSON requests
app.use(express.json());

// Proxy endpoint to fetch data from a given URL
app.get('/api/proxy', async (req, res) => {
  const { url } = req.query;

  // Check if the "url" param is provided and valid
  if (!url || !url.startsWith('https://')) {
    return res.status(400).json({ error: 'Missing or invalid "url" parameter. URL must start with "https://".' });
  }

  try {
    // Fetch data from the requested URL
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');

    // Set the content-type header of the response
    res.set('content-type', contentType);

    // Read the response body (handle JSON or plain text responses)
    const data = await response.text();

    // Send the response data back to the client
    res.send(data);
  } catch (error) {
    // Handle errors (e.g., network issues, invalid API responses)
    console.error('Error fetching data from URL:', error);
    res.status(500).json({ error: 'Proxy fetch failed. Please check the external API or your request.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
