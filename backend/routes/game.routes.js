const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/isLoggedIn');
const { createRoom, joinRoom, selectColor, startGame, rollDice, moveToken } = require('../controllers/game.controller');

// console.log({ createRoom, joinRoom, selectColor, startGame, rollDice, moveToken });

router.post('/create', requireAuth, createRoom);
router.post('/join', requireAuth, joinRoom);
router.post('/select-color', requireAuth, selectColor);
router.post('/start', requireAuth, startGame);
router.post('/roll-dice', requireAuth, rollDice);
router.post('/move-token', requireAuth, moveToken);

module.exports = router;