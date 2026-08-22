const timers = {}; // roomCode -> Timeout handle

// const TURN_TIME_LIMIT_MS = 10 * 1000; // for testing
const TURN_TIME_LIMIT_MS = 60 * 1000;

function scheduleTurnTimer(roomCode, onTimeout) {
    clearTurnTimer(roomCode); // never let two timers stack for the same room

    timers[roomCode] = setTimeout(() => {
        delete timers[roomCode];
        onTimeout();
    }, TURN_TIME_LIMIT_MS);
}

function clearTurnTimer(roomCode) {
    if (timers[roomCode]) {
        clearTimeout(timers[roomCode]);
        delete timers[roomCode];
    }
}

module.exports = { scheduleTurnTimer, clearTurnTimer };