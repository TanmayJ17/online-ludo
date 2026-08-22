const Game = require('../models/game.models');
const User = require('../models/users.models');

module.exports.getAllGames = async (req, res) => {
    try {
        const games = await Game.find()
            .populate("host", "username")
            .populate("players.user", "username")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: games.length,
            games
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error
        });
    }
};

module.exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password"); // never leak password hashes, even to admins

        return res.status(200).json({
            count: users.length,
            users
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error
        });
    }
};