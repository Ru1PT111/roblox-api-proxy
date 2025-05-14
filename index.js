const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
let cachedGames = [];
let cachedIcons = {};

function loadUniverseIds() {
  const filePath = path.join(__dirname, 'ids.txt');
  const content = fs.readFileSync(filePath, 'utf8');

  return content
    .split('\n')
    .map(line => line.trim().split(' - ')[0])
    .filter(id => id && !isNaN(id));
}

async function fetchGameData(universeIds) {
  try {
    const url = `https://games.roblox.com/v1/games?universeIds=${universeIds.join(',')}`;
    const response = await axios.get(url);
    return response.data.data || [];
  } catch (err) {
    console.error('Failed to fetch game data:', err.message);
    return [];
  }
}

async function fetchGameIcons(universeIds) {
  try {
    const response = await axios.get(
      `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds.join(',')}&size=512x512&format=Png&isCircular=false`
    );
    const icons = {};
    (response.data.data || []).forEach(icon => {
      icons[icon.targetId] = icon.imageUrl;
    });
    return icons;
  } catch (err) {
    console.error('Failed to fetch game icons:', err.message);
    return {};
  }
}

async function updateCache() {
  const universeIds = loadUniverseIds();
  console.log('Updating cache for', universeIds.length, 'games...');

  const [gameData, icons] = await Promise.all([
    fetchGameData(universeIds),
    fetchGameIcons(universeIds),
  ]);

  cachedGames = gameData;
  cachedIcons = icons;
  console.log('Cache updated:', new Date().toLocaleTimeString());
}

app.get('/games', (req, res) => {
  res.json({
    status: 200,
    data: cachedGames,
    icons: cachedIcons,
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await updateCache(); // First load immediately
  setInterval(updateCache, 5 * 60 * 1000); // Every 5 minutes
});
