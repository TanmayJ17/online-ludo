const User = require('../models/users.models');
const { clearTurnTimer } = require('./turnTimer.service');

// Checks if the game should end (0 or 1 unfinished players left).
// If so: assigns remaining ranks, marks the game finished, clears the
// turn timer, and updates every player's stats. Returns true if the
// game ended, false if play continues.
async function finalizeIfGameOver(game, roomCode) {
    const unfinishedCount = game.players.filter(p => p.rank === 0).length;
    if (unfinishedCount > 1) return false;

    for (const player of game.players) {
        if (player.rank === 0) {
            player.rank = game.rankings.length + 1;
            game.rankings.push(player.user._id);
        }
    }

    game.status = "finished";
    clearTurnTimer(roomCode);

    await Promise.all(
        game.players.map(async (player) => {
            const update = { $inc: { "stats.gamesPlayed": 1 } };
            if (player.rank === 1) {
                update.$inc["stats.wins"] = 1;
            }
            return User.findByIdAndUpdate(player.user._id, update);
        })
    );

    return true;
}

module.exports = { finalizeIfGameOver };