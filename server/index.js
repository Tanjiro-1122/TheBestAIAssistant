require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const chatRouter = require('./routes/chat');
const historyRouter = require('./routes/history');
const uploadRouter = require('./routes/upload');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'TheBestAIAssistant API' });
});

app.use('/api/chat', chatRouter);
app.use('/api/history', historyRouter);
app.use('/api/upload', uploadRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
