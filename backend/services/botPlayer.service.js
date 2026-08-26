const { toAbsolutePosition, getMovableTokens, MoveToken, checkCapture } = require('./moment.service');
const { SAFE_SQUARES } = require('../constants/board.constants');
const { finalizeIfGameOver } = require('./gameEnd.service');
const { scheduleTurnTimer, clearTurnTimer } = require('./turnTimer.service');

function simulateLanding(token, dice) {
    if (token.boardPosition === -1) return 0;
    return token.boardPosition + dice;
}

// Is this shared-track square something an opponent could land on with
// their very next roll (1-6)? Only shared-track squares (0-51) matter here
// — nobody can be captured once inside a private home stretch.
function isDangerous(game, movingColor, landingRelPos) {
    if (landingRelPos > 51) return false; // safe in the home stretch

    const absSquare = toAbsolutePosition(movingColor, landingRelPos);
    if (absSquare === null || SAFE_SQUARES.includes(absSquare)) return false;

    for (const player of game.players) {
        if (player.color === movingColor) continue;
        for (const token of player.tokens) {
            if (token.boardPosition < 0 || token.boardPosition > 51) continue;
            for (let d = 1; d <= 6; d++) {
                const theirPos = token.boardPosition + d;
                if (theirPos > 51) continue;
                if (toAbsolutePosition(player.color, theirPos) === absSquare) {
                    return true;
                }
            }
        }
    }
    return false;
}

function chooseBotMove(game, currentPlayer, movableTokens, dice) {
    // Priority 1: capture an opponent
    for (const tokenNumber of movableTokens) {
        const token = currentPlayer.tokens.find(t => t.number === tokenNumber);
        const simulatedPos = simulateLanding(token, dice);
        if (simulatedPos > 51) continue;

        const absPos = toAbsolutePosition(currentPlayer.color, simulatedPos);
        if (absPos !== null && !SAFE_SQUARES.includes(absPos)) {
            const capturesSomeone = game.players.some(p =>
                p.color !== currentPlayer.color &&
                p.tokens.some(t => toAbsolutePosition(p.color, t.boardPosition) === absPos)
            );
            if (capturesSomeone) return tokenNumber;
        }
    }

    // Priority 2: finish a token (land exactly on 58)
    for (const tokenNumber of movableTokens) {
        const token = currentPlayer.tokens.find(t => t.number === tokenNumber);
        if (simulateLanding(token, dice) === 58) return tokenNumber;
    }

    // Priority 3: prefer a move that doesn't expose the token to capture
    // next turn. Among "safe" candidates, still favor the furthest-advanced
    // token, same tie-break as the old fallback logic.
    const safeCandidates = movableTokens.filter(num => {
        const token = currentPlayer.tokens.find(t => t.number === num);
        const landing = simulateLanding(token, dice);
        return !isDangerous(game, currentPlayer.color, landing);
    });

    const pool = safeCandidates.length > 0 ? safeCandidates : movableTokens;

    // Priority 4: escape home on a 6, if that's an option within the safe pool
    if (dice === 6) {
        const homeToken = pool.find(num => {
            const t = currentPlayer.tokens.find(tok => tok.number === num);
            return t.boardPosition === -1;
        });
        if (homeToken) return homeToken;
    }

    // Priority 5: advance whichever token is furthest along
    let best = pool[0];
    let bestPos = -2;
    for (const num of pool) {
        const t = currentPlayer.tokens.find(tok => tok.number === num);
        if (t.boardPosition > bestPos) {
            bestPos = t.boardPosition;
            best = num;
        }
    }
    return best;
}

async function playBotTurn(roomCode) {
    const { io } = require('../app');
    const Game = require('../models/game.models');

    try {
        const game = await Game.findOne({ roomCode }).populate("players.user", "username profileImage isBot");
        if (!game || game.status !== "playing") return;

        const currentPlayer = game.players[game.currentTurnIndex];
        if (!currentPlayer.user.isBot) return; // safety guard — only ever acts on a bot's own turn

        clearTurnTimer(roomCode); // bots don't need the human miss-timer

        const dice = Math.floor(Math.random() * 6) + 1;
        game.consecutiveSixes = dice === 6 ? game.consecutiveSixes + 1 : 0;
        game.currentDiceValue = dice;
        game.turnStartedAt = new Date();

        const movableTokens = getMovableTokens(currentPlayer, dice);

        await game.save(); // persist before the delayed move so a re-fetch below sees it

        io.to(roomCode).emit('diceRolled', { dice, movableTokens });

        if (movableTokens.length === 0) {
            game.currentDiceValue = null;
            game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
            const nextPlayer = game.players[game.currentTurnIndex];
            game.turnStartedAt = new Date();
            await game.save();

            io.to(roomCode).emit('turnSkipped', {
                dice,
                color: nextPlayer.color,
                username: nextPlayer.user.username
            });

            await advanceAfterBotAction(roomCode, game);
            return;
        }

        // Small delay so the roll is visible before the move plays out — mirrors
        // the natural pacing of a human rolling, then moving, on the frontend.
        setTimeout(async () => {
            try {
                const freshGame = await Game.findOne({ roomCode }).populate("players.user", "username profileImage isBot");
                const player = freshGame.players[freshGame.currentTurnIndex];
                const tokenNumber = chooseBotMove(freshGame, player, movableTokens, dice);

                const result = MoveToken(player, tokenNumber, dice);
                if (!result.success) return;

                const movedToken = player.tokens.find(t => t.number === tokenNumber);
                const captureResult = checkCapture(freshGame, player, movedToken);

                const justFinished = player.tokens.every(t => t.boardPosition === 58) && player.rank === 0;
                if (justFinished) {
                    player.rank = freshGame.rankings.length + 1;
                    freshGame.rankings.push(player.user._id);
                }

                await finalizeIfGameOver(freshGame, roomCode);

                if (freshGame.status !== "finished") {
                    const rolledSix = dice === 6;
                    const forfeitTurn = rolledSix && freshGame.consecutiveSixes >= 3;

                    if (forfeitTurn) {
                        freshGame.consecutiveSixes = 0;
                        freshGame.currentTurnIndex = (freshGame.currentTurnIndex + 1) % freshGame.players.length;
                    } else if (rolledSix || captureResult.captured) {
                        // extra turn — same player goes again
                    } else {
                        freshGame.consecutiveSixes = 0;
                        freshGame.currentTurnIndex = (freshGame.currentTurnIndex + 1) % freshGame.players.length;
                    }

                    while (freshGame.players[freshGame.currentTurnIndex].rank !== 0) {
                        freshGame.currentTurnIndex = (freshGame.currentTurnIndex + 1) % freshGame.players.length;
                    }
                }

                freshGame.currentDiceValue = null;
                freshGame.turnStartedAt = new Date();
                await freshGame.save();

                const responseBody = {
                    message: freshGame.status === "finished" ? "Game finished!" : "Token moved successfully",
                    result,
                    capture: captureResult,
                    gameFinished: freshGame.status === "finished"
                };
                if (freshGame.status === "finished") {
                    responseBody.rankings = freshGame.rankings;
                } else {
                    const nextPlayer = freshGame.players[freshGame.currentTurnIndex];
                    responseBody.nextTurn = { color: nextPlayer.color, username: nextPlayer.user.username };
                }

                io.to(roomCode).emit('tokenMoved', responseBody);

                await advanceAfterBotAction(roomCode, freshGame);
            } catch (err) {
                console.log("Bot move error:", err);
            }
        }, 1200);

    } catch (err) {
        console.log("Bot turn error:", err);
    }
}

async function advanceAfterBotAction(roomCode, game) {
    if (game.status === "finished") return;

    const nextPlayer = game.players[game.currentTurnIndex];
    if (nextPlayer.user.isBot) {
        setTimeout(() => playBotTurn(roomCode), 900); // brief pause before the next bot acts
    } else {
        const { handleTurnTimeout } = require('../controllers/game.controller');
        scheduleTurnTimer(roomCode, () => handleTurnTimeout(roomCode));
    }
}

module.exports = { playBotTurn };