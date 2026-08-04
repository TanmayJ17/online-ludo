const Game = require('../models/game.models');
const { getMovableTokens, MoveToken } = require('../services/moment.service');
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

module.exports.joinRoom = async(req, res) => {
    const {roomCode} = req.body;
    if(!roomCode){
        return res.status(400).json({
            message: "Room code is required"
        })
    }

    try {
       const game = await Game.findOne({roomCode}).populate(
        "players.user",
        "username profileImage"
        );

        if(!game){
            return res.status(404).json({
                message: "Room not found"
            })
        }
        if(game.status !== "waiting"){
            return res.status(400).json({
                message: "Game cannot be joined"
            })
        }
        if(game.players.length >= game.maxPlayers){
            return res.status(400).json({
                message: "Room is full"
            })
        }
       
        const alreadyJoined = game.players.some(player => player.user._id.equals(req.user._id));
        if(alreadyJoined){
            return res.status(400).json({
                message: "User already joined"
            })
        }

        const allColors = ["red", "blue", "green", "yellow"];
        const takenColors = game.players.map(player => player.color);
        const availableColors = allColors.filter(color => !takenColors.includes(color));

        return res.status(200).json({
            message: "Room found",
            availableColors,
            game: {
                roomCode: game.roomCode,
                host: game.host,
                players: game.players,
                maxPlayers: game.maxPlayers,
                status: game.status
            }
        });

    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: error.message,
            error
        })
    }
}

module.exports.selectColor = async(req, res) => {
    const {roomCode, color} = req.body;
    if(!roomCode || !color){
        return res.status(400).json({
            message: "Please enter both room code and chose a color"
        })
    }

    try {
        const game = await Game.findOne({roomCode}).populate(
        "players.user",
        "username profileImage"
        );

        if(!game){
            return res.status(404).json({
                message: "Room not found"
            })
        }
        if(game.status !== "waiting"){
            return res.status(400).json({
                message: "Game cannot be joined"
            })
        }
        if(game.players.length >= game.maxPlayers){
            return res.status(400).json({
                message: "Room is full"
            })
        }
        const alreadyJoined = game.players.some(player => player.user._id.equals(req.user._id));
        if(alreadyJoined){
            return res.status(400).json({
                message: "User already joined"
            })
        }

        const allColors = ["red", "blue", "green", "yellow"];
        const takenColors = game.players.map(player => player.color);
        if(takenColors.includes(color)){
            return res.status(400).json({
                message: "Color not available"
            })
        }

        game.players.push({
            user: req.user._id,
            color
        });
        await game.save();
        return res.status(200).json({
            message: "Joined successfully",
            game
        })
        await game.populate(
            "players.user",
            "username profileImage"
        );
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: error.message,
            error
        })
    }
}

module.exports.startGame = async(req, res) => {
    const {roomCode} = req.body;
    if(!roomCode){
        return res.status(400).json({
            message: "Please enter room code"
        })
    }

    try {
        const game = await Game.findOne({roomCode}).populate(
        "players.user",
        "username profileImage"
        );

        if(!game){
            return res.status(404).json({
                message: "Room not found"
            })
        }

        if (!game.host.equals(req.user._id)) {
            return res.status(403).json({
                message: "Only host can start the game"
            });
        }

        if(game.status !== "waiting"){
            return res.status(400).json({
                message: "Game has already started"
            })
        }
        if(game.players.length < 2){
            return res.status(400).json({
                message: "Atleast 2 players are required"
            })
        }

        const COLOR_ORDER = {
            red: 0,
            green: 1,
            yellow: 2,
            blue: 3
        };
        game.players.sort((a, b) => {
            return COLOR_ORDER[a.color] - COLOR_ORDER[b.color];
        });

        game.status = "playing";
        game.currentTurnIndex = 0;
        game.currentDiceValue = null;
        game.turnStartedAt = new Date();

        await game.save();
        return res.status(200).json({
            message: "Game started successfully",
            game
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: error.message,
            error
        })
    }
}

module.exports.rollDice = async(req, res) => {
    const {roomCode} = req.body;
    if(!roomCode){
        return res.status(400).json({
            message: "Please enter room code"
        })
    }

    try {
        const game = await Game.findOne({roomCode}).populate(
        "players.user",
        "username profileImage"
        );

        if(!game){
            return res.status(404).json({
                message: "Room not found"
            })
        }
        if(game.status !== "playing"){
            return res.status(400).json({
                message: "Game is not in playing state"
            })
        }

        if (game.currentDiceValue !== null) {
            return res.status(400).json({
                message: "You have already rolled the dice"
            });
        }

        const currentPlayer = game.players[game.currentTurnIndex];
        if (!currentPlayer.user._id.equals(req.user._id)) {
            return res.status(403).json({
                message: "It's not your turn"
            });
        }

        const dice = Math.floor(Math.random() * 6) + 1;
        if(dice === 6){
            game.consecutiveSixes++;
        }
        else{
            game.consecutiveSixes = 0;
        }

        game.currentDiceValue = dice;

        const movableTokens = getMovableTokens(currentPlayer, dice);
        if(movableTokens.length === 0){
            game.currentDiceValue = null;
            game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;

            const nextPlayer = game.players[game.currentTurnIndex];

            game.turnStartedAt = new Date();
            await game.save();

            return res.status(200).json({
                message: "No valid moves, turn skipped",
                color: nextPlayer.color,
                username: nextPlayer.user.username
            })
        }

        game.turnStartedAt = new Date();
        await game.save();
        return res.status(200).json({
            message: "Dice rolled successfully",
            dice,
            movableTokens
        })
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: error.message,
            error
        })
    }
}

module.exports.moveToken = async (req, res) => {
    const {roomCode, tokenNumber} = req.body;
    if(!roomCode || !tokenNumber){
        return res.status(400).json({
            message: "Please enter the room code and token number"
        })
    }

    try {
        const game = await Game.findOne({roomCode}).populate(
        "players.user",
        "username profileImage"
        );
        if(!game){
            return res.status(404).json({
                message: "Room not found"
            })
        }
        if(game.status !== "playing"){
            return res.status(400).json({
                message: "Game is not in playing state"
            })
        }
        if (game.currentDiceValue === null) {
            return res.status(400).json({
                message: "Roll the dice first"
            });
        }
        const currentPlayer = game.players[game.currentTurnIndex];
        if (!currentPlayer.user._id.equals(req.user._id)) {
            return res.status(403).json({
                message: "It's not your turn"
            });
        }

        const result = MoveToken(
            currentPlayer,
            tokenNumber,
            game.currentDiceValue
        );
        if(!result.success){
            return res.status(400).json({
                message: result.message
            });
        }

        const dice = game.currentDiceValue;
        if(dice === 6){
            if(game.consecutiveSixes >= 3){
                game.consecutiveSixes = 0;
                game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
            }
        }
        else{
            game.consecutiveSixes = 0;
            game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
        }

        game.currentDiceValue = null;
        game.turnStartedAt = new Date();

        await game.save();

        const nextPlayer = game.players[game.currentTurnIndex];
        return res.status(200).json({
            message: "Token moved successfully",
            result,
            nextTurn: {
                color: nextPlayer.color,
                username: nextPlayer.user.username
            }
        })
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: error.message,
            error
        })
    }
}