const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const dataPath = path.join(__dirname, '..', 'data', 'history.json');

function ensureStore() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ chats: [] }, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

function writeStore(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

router.get('/', (_req, res) => {
  res.json(readStore().chats || []);
});

router.post('/', (req, res) => {
  const chat = req.body;
  if (!chat?.id) {
    res.status(400).json({ error: 'chat.id is required' });
    return;
  }

  const store = readStore();
  const index = store.chats.findIndex((item) => item.id === chat.id);

  if (index >= 0) {
    store.chats[index] = { ...store.chats[index], ...chat, updatedAt: new Date().toISOString() };
  } else {
    store.chats.unshift({ ...chat, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  writeStore(store);
  res.json({ ok: true });
});

router.delete('/', (req, res) => {
  const store = readStore();

  if (req.query.all === 'true') {
    writeStore({ chats: [] });
    res.json({ ok: true });
    return;
  }

  res.status(400).json({ error: 'Use DELETE /api/history?all=true or DELETE /api/history/:id' });
});

router.delete('/:id', (req, res) => {
  const store = readStore();

  const { id } = req.params;
  writeStore({ chats: store.chats.filter((chat) => chat.id !== id) });
  res.json({ ok: true });
});

module.exports = router;
