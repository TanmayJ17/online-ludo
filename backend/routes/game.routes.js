const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/isLoggedIn');
const { createRoom } = require('../controllers/game.controller');

router.post('/create', requireAuth, createRoom);

module.exports = router;