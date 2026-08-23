const Game = require('../models/game.models');
const User = require('../models/users.models');
const { finalizeIfGameOver } = require('../services/gameEnd.service');
const { getMovableTokens, MoveToken, checkCapture } = require('../services/moment.service');
const { scheduleTurnTimer, clearTurnTimer } = require('../services/turnTimer.service');
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
        const { io } = require('../app');
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
        await game.populate(
            "players.user",
            "username profileImage"
        );

        io.to(roomCode).emit('playerJoined', {
            message: "Joined successfully",
            game
        });
        return res.status(200).json({
            message: "Joined successfully",
            game
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

module.exports.startGame = async(req, res) => {
    const {roomCode} = req.body;
    if(!roomCode){
        return res.status(400).json({
            message: "Please enter room code"
        })
    }

    try {
        const { io } = require('../app');
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

        scheduleTurnTimer(roomCode, () => handleTurnTimeout(roomCode));
        io.to(roomCode).emit('gameStarted', {
            message: "Game started successfully",
            game
        });

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
        const { io } = require('../app');
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

        clearTurnTimer(roomCode); // they made it in time, cancel the countdown

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

            scheduleTurnTimer(roomCode, () => handleTurnTimeout(roomCode));

            io.to(roomCode).emit('turnSkipped', {
                dice,
                color: nextPlayer.color,
                username: nextPlayer.user.username
            });

            return res.status(200).json({
                message: "No valid moves, turn skipped",
                dice,
                color: nextPlayer.color,
                username: nextPlayer.user.username
            })
        }

        game.turnStartedAt = new Date();
        await game.save();

        io.to(roomCode).emit('diceRolled', {
            dice,
            movableTokens
        });
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
        const { io } = require('../app');
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

        const movedToken = currentPlayer.tokens.find(t => t.number === tokenNumber);
        const captureResult = checkCapture(game, currentPlayer, movedToken);

        // --- Win condition check ---
        const justFinished = currentPlayer.tokens.every(t => t.boardPosition === 58) && currentPlayer.rank === 0;
        if (justFinished) {
            currentPlayer.rank = game.rankings.length + 1;
            game.rankings.push(currentPlayer.user._id);
        }

        await finalizeIfGameOver(game, roomCode);

        // --- Turn advancement (skipped entirely if the game just ended) ---
        if (game.status !== "finished") {
            const dice = game.currentDiceValue;
            const rolledSix = dice === 6;
            const forfeitTurn = rolledSix && game.consecutiveSixes >= 3;

            if (forfeitTurn) {
                game.consecutiveSixes = 0;
                game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
            } else if (rolledSix || captureResult.captured) {
                // extra turn — same player goes again
            } else {
                game.consecutiveSixes = 0;
                game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
            }

            // A finished player should never be landed on as "next turn" — skip past them
            while (game.players[game.currentTurnIndex].rank !== 0) {
                game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
            }
        }

        game.currentDiceValue = null;
        game.turnStartedAt = new Date();

        await game.save();

        if (game.status !== "finished") {
            scheduleTurnTimer(roomCode, () => handleTurnTimeout(roomCode));
        }

        const responseBody = {
            message: game.status === "finished" ? "Game finished!" : "Token moved successfully",
            result,
            capture: captureResult,
            gameFinished: game.status === "finished"
        };

        if (game.status === "finished") {
            responseBody.rankings = game.rankings; // ordered list of user IDs, 1st place first
        } else {
            const nextPlayer = game.players[game.currentTurnIndex];
            responseBody.nextTurn = {
                color: nextPlayer.color,
                username: nextPlayer.user.username
            };
        }

        io.to(roomCode).emit('tokenMoved', responseBody);
        return res.status(200).json(responseBody);
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

async function handleTurnTimeout(roomCode) {
    const { io } = require('../app');

    try {
        const game = await Game.findOne({ roomCode }).populate("players.user", "username profileImage");

        // stale timer firing after the game already moved on — ignore it
        if (!game || game.status !== "playing" || game.currentDiceValue !== null) return;

        const currentPlayer = game.players[game.currentTurnIndex];
        currentPlayer.warnings += 1;

        const forfeited = currentPlayer.warnings >= 3;
        if (forfeited) {
            currentPlayer.rank = game.rankings.length + 1;
            game.rankings.push(currentPlayer.user._id);
            currentPlayer.tokens.forEach(t => { t.boardPosition = -1; }); // pull them off the board
        }

        await finalizeIfGameOver(game, roomCode);

        if (game.status !== "finished") {
            game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
            while (game.players[game.currentTurnIndex].rank !== 0) {
                game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
            }
            game.consecutiveSixes = 0;
        }

        game.currentDiceValue = null;
        game.turnStartedAt = new Date();
        await game.save();

        io.to(roomCode).emit('turnTimeout', {
            skippedPlayer: { color: currentPlayer.color, username: currentPlayer.user.username },
            forfeited,
            gameFinished: game.status === "finished",
            rankings: game.status === "finished" ? game.rankings : undefined,
            nextTurn: game.status !== "finished"
                ? { color: game.players[game.currentTurnIndex].color, username: game.players[game.currentTurnIndex].user.username }
                : undefined
        });

        if (game.status !== "finished") {
            scheduleTurnTimer(roomCode, () => handleTurnTimeout(roomCode));
        }
    } catch (err) {
        console.log("Turn timeout error:", err);
    }
}

module.exports.getGameState = async (req, res) => {
    const { roomCode } = req.body;
    if (!roomCode) {
        return res.status(400).json({
            message: "Room code is required"
        });
    }

    try {
        const game = await Game.findOne({ roomCode }).populate(
            "players.user",
            "username profileImage"
        );

        if (!game) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        // A room that's still waiting is open to view by anyone with the code
        // (that's how joining works) — but once gameplay starts, only actual
        // participants should be able to read the board state.
        if (game.status !== "waiting") {
            const isPlayer = game.players.some(p => p.user._id.equals(req.user._id));
            if (!isPlayer) {
                return res.status(403).json({
                    message: "You are not part of this game"
                });
            }
        }
        return res.status(200).json({ game });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error
        });
    }
};