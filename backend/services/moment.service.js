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

function checkCapture(game, currentPlayer, movedToken){
    for(const player of game.players){
        if(player._id == currentPlayer._id) continue;

        for(const token of player.tokens){
            
        }
    }
}

module.exports = {
    getMovableTokens,
    MoveToken
};