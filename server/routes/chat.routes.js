const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { sendMessage, getChallenge, reviewSubmission } = require('../controllers/chat.controller');

const router = express.Router();

router.use(authenticate);

router.post('/message', sendMessage);
router.get('/challenge', getChallenge);
router.post('/review', reviewSubmission);

module.exports = router;
