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

module.exports = {
    getMovableTokens
};