const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/isLoggedIn');
const requireAdmin = require('../middlewares/isAdmin');
const { getAllGames, getAllUsers } = require('../controllers/admin.controller');

router.get('/games', requireAuth, requireAdmin, getAllGames);
router.get('/users', requireAuth, requireAdmin, getAllUsers);

module.exports = router;