const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.middleware');
const { executeCode, LANGUAGE_MAP } = require('../services/execution.service');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Execute code
router.post('/execute', async (req, res, next) => {
  try {
    const { code, language, stdin, sessionId } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'code and language are required' });
    }

    const result = await executeCode(code, language, stdin);

    // Save submission if sessionId provided
    if (sessionId) {
      await prisma.submission.create({
        data: {
          sessionId,
          language,
          code,
          result: result.stdout || result.stderr || result.compile_output,
          status: result.status,
        },
      });
    }

    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// Get supported languages
router.get('/languages', (_req, res) => {
  res.json({ languages: Object.keys(LANGUAGE_MAP) });
});

module.exports = router;
