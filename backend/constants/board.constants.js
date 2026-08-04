// Outer track consists of 52 cells (0-51)
// Home path is represented separately up to FINISH_POSITION (58)
const TRACK_LENGTH = 52;
const FINISH_POSITION = 58;

const START_POSITIONS = {
    red: 0,
    green: 13,
    yellow: 26,
    blue: 39
};

const SAFE_SQUARES = [
    0,
    8,
    13,
    21,
    26,
    34,
    39,
    47
];

const COLOR_ORDER = {
    red: 0,
    green: 1,
    yellow: 2,
    blue: 3
};

module.exports = {
    TRACK_LENGTH,
    FINISH_POSITION,
    START_POSITIONS,
    SAFE_SQUARES,
    COLOR_ORDER
};