const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', async (req, res) => {
  const apiKey = String(req.body?.apiKey || '').trim();

  if (!apiKey) {
    res.status(400).json({ ok: false, message: 'apiKey is required' });
    return;
  }

  try {
    await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 15000,
    });

    res.json({ ok: true, message: 'API key is valid.' });
  } catch (error) {
    const status = error?.response?.status;

    if (status === 401) {
      res.status(401).json({ ok: false, message: 'Unauthorized: invalid OpenRouter API key.' });
      return;
    }

    if (status === 429) {
      res.status(429).json({ ok: false, message: 'Rate limited by OpenRouter. Please try again.' });
      return;
    }

    res.status(500).json({
      ok: false,
      message:
        error?.response?.data?.error?.message ||
        'Unable to validate OpenRouter API key right now.',
    });
  }
});

module.exports = router;
