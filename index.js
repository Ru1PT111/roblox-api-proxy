const express = require('express');
const axios = require('axios');
const fs = require('fs');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 });

// ✅ Load universe IDs from ids.txt
const loadUniverseIds = () => {
  try {
    const file = fs.readFileSync('ids.txt', 'utf8');
    return file
      .split('\n')
      .map(line => parseInt(line.trim()))
      .filter(id => !isNaN(id));
  } catch (err) {
    console.error('Failed to read ids.txt:', err);
    return [];
  }
};

let universeIds = loadUniverseIds();

const fetchGameData = async (universeId) => {
  try {
    const response = await axios.get(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
    const iconResponse = await axios.get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`);
    
    return {
      game: response.data.data?.[0] || null,
      icon: iconResponse.data.data?.[0]?.imageUrl || null
    };
  } catch (err) {
    console.error(`Failed to fetch for universeId ${universeId}:`, err.message);
    return null;
  }
};

const refreshCache = async () => {
  console.log('Refreshing cache...');
  universeIds = loadUniverseIds(); // reload in case ids.txt changed
  for (const id of universeIds) {
    const data = await fetchGameData(id);
    if (data) {
      cache.set(id, data);
    }
  }
  console.log('Cache updated.');
};

app.get('/games', (req, res) => {
  const result = universeIds.map(id => ({
    universeId: id,
    ...cache.get(id)
  })).filter(entry => entry.game !== null);
  res.json({ status: 200, data: result });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await refreshCache();
  setInterval(refreshCache, 5 * 60 * 1000);
});
