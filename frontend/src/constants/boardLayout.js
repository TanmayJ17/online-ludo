// Maps every boardPosition to a {row, col} on the 15x15 grid.
// Mirrors the backend's board.constants.js numbering exactly:
// -1 = home yard, 0-51 = shared track, 52-57 = home stretch, 58 = finished/center

import { START_POSITIONS } from './ludoConstants';

export const TRACK_COORDS = [
    [6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
    [0,7],
    [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
    [7,14],
    [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
    [14,7],
    [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
    [7,0],
    [6,0],
];

export const HOME_STRETCH = {
    red:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
    green:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
    yellow: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
    blue:   [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
};

export const HOME_YARD = {
    red:    [[1,1],[1,4],[4,1],[4,4]],
    green:  [[1,10],[1,13],[4,10],[4,13]],
    yellow: [[10,10],[10,13],[13,10],[13,13]],
    blue:   [[10,1],[10,4],[13,1],[13,4]],
};

const CENTER = [7,7];

// tokenIndex (0-3) is only used to pick which home-yard slot to sit in
// while boardPosition is -1 — once a token leaves home it's ignored.
export function getCoordinates(color, boardPosition, tokenIndex = 0) {
    if (boardPosition === -1) {
        const [row, col] = HOME_YARD[color][tokenIndex];
        return { row, col };
    }
    if (boardPosition === 58) {
        const [row, col] = CENTER;
        return { row, col };
    }
    if (boardPosition >= 52) {
        const [row, col] = HOME_STRETCH[color][boardPosition - 52];
        return { row, col };
    }
    // 0-51: shared track, offset by this color's starting position
    const absolute = (START_POSITIONS[color] + boardPosition) % 52;
    const [row, col] = TRACK_COORDS[absolute];
    return { row, col };
}