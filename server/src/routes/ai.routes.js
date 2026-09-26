const express = require('express');
const router = express.Router();
const { chat, voice, confirmAction } = require('../controllers/ai.controller');
const { aiLimiterPerMinute, aiLimiterPerHour } = require('../middleware/rateLimiter');

// Apply both AI rate limiters to all AI routes
router.use(aiLimiterPerHour);
router.use(aiLimiterPerMinute);

// POST /api/ai/chat — financial questions + natural-language commands
router.post('/chat', chat);

// POST /api/ai/voice — voice transcript forwarded as a chat message
// Speech-to-text happens in the browser via Web Speech API.
// This endpoint just receives the transcript text and routes it through chat.
router.post('/voice', voice);

// POST /api/ai/action/confirm — execute a confirmed pending action
router.post('/action/confirm', confirmAction);

module.exports = router;
