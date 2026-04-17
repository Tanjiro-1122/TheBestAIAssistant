const express = require('express');
const { runAgent } = require('../agent');

const router = express.Router();

router.post('/', async (req, res) => {
  const { message, history = [], settings = {}, uploadedText = '' } = req.body || {};

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  const send = (event, payload) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const answer = await runAgent({
      message,
      history,
      settings,
      uploadedText,
      send,
    });

    send('done', { answer });
  } catch (error) {
    send('error', { error: error.message || 'Agent failed' });
  } finally {
    res.end();
  }
});

module.exports = router;
