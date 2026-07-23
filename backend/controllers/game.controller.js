const Game = require('../models/game.models');
const generateRoomCode = require('../utils/generateRoomCode');

module.exports.createRoom = async(req, res) => {
    const {color} = req.body;
    if(!color){
        return res.status(400).json({
            message: "Color is required"
        })
    }


    try {
        let roomCode;
        do{
            roomCode = generateRoomCode();
        }while(await Game.findOne({roomCode}));

        const game = await Game.create({
            roomCode,
            host: req.user._id,
            players: [
                {user: req.user._id, color}
            ]
        })

        return res.status(201).json({
            message: "Room created successfully",
            roomCode: game.roomCode,
            game
        })

    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }
    }
}