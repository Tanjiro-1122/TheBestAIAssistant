const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
const MAX_EXTRACTED_TEXT_LENGTH = 12_000;
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many upload requests. Please retry in a minute.' },
});
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 8 * 1024 * 1024 },
});

function resolveSafeUploadPath(filePath) {
  const absolutePath = path.resolve(filePath);
  const absoluteUploadDir = path.resolve(uploadDir);
  const relativePath = path.relative(absoluteUploadDir, absolutePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Unsafe file path detected');
  }
  return absolutePath;
}

router.post('/', uploadLimiter, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'file is required' });
    return;
  }

  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const safePath = resolveSafeUploadPath(req.file.path);
    const fileBuffer = fs.readFileSync(safePath);
    let text = '';

    if (ext === '.pdf') {
      const parsed = await pdfParse(fileBuffer);
      text = parsed.text;
    } else {
      text = fileBuffer.toString('utf-8');
    }

    res.json({
      ok: true,
      fileName: req.file.originalname,
      text: text.slice(0, MAX_EXTRACTED_TEXT_LENGTH),
    });
  } catch (error) {
    res.status(500).json({ error: `Upload parse failed: ${error.message}` });
  } finally {
    try {
      const safePath = resolveSafeUploadPath(req.file.path);
      fs.unlink(safePath, () => {});
    } catch {
      // Ignore cleanup failures for invalid paths.
    }
  }
});

module.exports = router;
