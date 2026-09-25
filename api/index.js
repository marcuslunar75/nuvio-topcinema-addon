const express = require('express');
const cors = require('cors');
const manifest = require('../manifest.json');
const { getStreams } = require('../topcinema.js');

const app = express();
app.use(cors());

// رابط المانفيست
app.get('/manifest.json', (req, res) => {
  res.json(manifest);
});

// رابط جلب السيرفرات
app.get('/stream/:type/:id.json', async (req, res) => {
  try {
    const { type, id } = req.params;
    const cleanId = id.replace('.json', '');
    const streams = await getStreams(cleanId, type);
    res.json({ streams: streams || [] });
  } catch (err) {
    res.json({ streams: [] });
  }
});

module.exports = app;
