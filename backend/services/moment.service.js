const { START_POSITIONS, TRACK_LENGTH, SAFE_SQUARES } = require('../constants/board.constants');

function toAbsolutePosition(color, boardPosition) {
    // Tokens at home (-1) or in the private home stretch (52-58)
    // aren't on the shared track, so they can't collide with anyone.
    if (boardPosition < 0 || boardPosition >= TRACK_LENGTH) {
        return null;
    }

    return (START_POSITIONS[color] + boardPosition) % TRACK_LENGTH;
}

function getMovableTokens(player, dice){
    const movableTokens = [];

    for(const token of player.tokens){
        if(token.boardPosition === -1){
            if(dice == 6){
                movableTokens.push(token.number);
            }
        }
        else if(token.boardPosition === 58){
            continue;
        }
        else if(token.boardPosition + dice > 58){
            continue;
        }
        else{
            movableTokens.push(token.number);
        }
    }

    return movableTokens;
}

function MoveToken(player, tokenNumber, dice) {
    const movableTokens = getMovableTokens(player, dice);

    if (!movableTokens.includes(tokenNumber)) {
        return {
            success: false,
            message: "Invalid move"
        };
    }

    const token = player.tokens.find(
        t => t.number === tokenNumber
    );

    if (!token) {
        return {
            success: false,
            message: "Token not found"
        };
    }

    // Bring token out of home
    if (token.boardPosition === -1) {
        if (dice !== 6) {
            return {
                success: false,
                message: "Token cannot leave home without rolling a 6"
            };
        }

        token.boardPosition = 0;

        return {
            success: true,
            tokenNumber,
            newPosition: 0,
            reachedFinish: false
        };
    }

    // Can't overshoot finish
    if (token.boardPosition + dice > 58) {
        return {
            success: false,
            message: "Token cannot move beyond the finish",
            newPosition: token.boardPosition,
            reachedFinish: false
        };
    }

    // Normal move
    token.boardPosition += dice;

    return {
        success: true,
        tokenNumber,
        newPosition: token.boardPosition,
        reachedFinish: token.boardPosition === 58
    };
}

function checkCapture(game, currentPlayer, movedToken) {
    // Tokens in the home stretch (52-57) or finished (58) are off the
    // shared track, so nothing can be captured there.
    if (movedToken.boardPosition < 0 || movedToken.boardPosition >= TRACK_LENGTH) {
        return { captured: false, capturedTokens: [] };
    }

    const landedSquare = toAbsolutePosition(currentPlayer.color, movedToken.boardPosition);

    if (SAFE_SQUARES.includes(landedSquare)) {
        return { captured: false, capturedTokens: [] };
    }

    const capturedTokens = [];

    for (const player of game.players) {
        if (player.color === currentPlayer.color) continue; // never capture your own token

        for (const token of player.tokens) {
            const opponentSquare = toAbsolutePosition(player.color, token.boardPosition);

            if (opponentSquare !== null && opponentSquare === landedSquare) {
                token.boardPosition = -1; // send it back home
                capturedTokens.push({ color: player.color, tokenNumber: token.number });
            }
        }
    }

    return { captured: capturedTokens.length > 0, capturedTokens };
}

module.exports = {
    getMovableTokens,
    MoveToken,
    toAbsolutePosition,
    checkCapture
};