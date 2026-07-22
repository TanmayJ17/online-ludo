const path = require('path');
const express = require('express');
const User = require('../models/users.models');
const { registerUser, loginUser } = require('../controllers/auth.controller');
const isLoggedIn = require('../middlewares/isLoggedIn');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// middleware testing (isLoggedIn):-
router.get("/me", isLoggedIn, (req, res) => {
    return res.status(200).json({
        user: req.user
    });
});

module.exports = router;