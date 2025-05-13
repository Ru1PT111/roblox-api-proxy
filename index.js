const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url || !url.startsWith('https://')) {
    return res.status(400).json({ error: 'Missing or invalid "url" param' });
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    res.set('content-type', contentType);
    const data = await response.text();
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy fetch failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
