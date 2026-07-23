const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/isLoggedIn');
const { createRoom, joinRoom } = require('../controllers/game.controller');

router.post('/create', requireAuth, createRoom);
router.post('/join', requireAuth, joinRoom);

module.exports = router;