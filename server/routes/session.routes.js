const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  createSession,
  getSessions,
  getSession,
  startSession,
  endSession,
} = require('../controllers/session.controller');

const router = express.Router();

router.use(authenticate);

router.post('/', createSession);
router.get('/', getSessions);
router.get('/:id', getSession);
router.patch('/:id/start', startSession);
router.patch('/:id/end', endSession);

module.exports = router;
