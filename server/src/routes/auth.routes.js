const express = require('express');
const { registerHandler, loginHandler, logoutHandler, refreshHandler, meHandler } = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.get('/refresh', refreshHandler);
router.get('/me', auth, meHandler);

module.exports = router;
