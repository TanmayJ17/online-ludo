import { COLOR_HEX } from '../constants/ludoConstants';
import { TRACK_COORDS, HOME_STRETCH, HOME_YARD } from '../constants/boardLayout';

const SAFE_TRACK_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// Fixed, saturated pastels instead of color+alpha over cream —
// alpha blending made yellow nearly invisible against the warm background.
const STRETCH_TINT = {
    red: '#F6C9C4',
    green: '#C8E6D0',
    yellow: '#FCE29B',
    blue: '#C7D9F5',
};

const ENTRY_INDEX = { red: 0, green: 13, yellow: 26, blue: 39 };

const HOME_YARD_ZONES = {
    red:    { row: 0, col: 0 },
    green:  { row: 0, col: 9 },
    yellow: { row: 9, col: 9 },
    blue:   { row: 9, col: 0 },
};

function Board({ children }) {
    return (
        <div
            className="grid bg-white border-4 border-ink/10 rounded-2xl overflow-hidden shadow-lg mx-auto"
            style={{
                gridTemplateColumns: 'repeat(15, 1fr)',
                gridTemplateRows: 'repeat(15, 1fr)',
                width: 'min(90vw, 600px)',
                height: 'min(90vw, 600px)',
            }}
        >
            {/* Home yard backdrops — purely decorative color blocks, no nested grid */}
            {Object.entries(HOME_YARD_ZONES).map(([color, { row, col }]) => (
                <div
                    key={color}
                    style={{
                        gridRow: `${row + 1} / span 6`,
                        gridColumn: `${col + 1} / span 6`,
                        backgroundColor: COLOR_HEX[color],
                    }}
                    className="p-3"
                >
                    <div className="w-full h-full bg-white rounded-xl" />
                </div>
            ))}

            {/* Empty slot placeholders — same outer-grid coordinates HOME_YARD
                tokens will use, so they're guaranteed to line up exactly */}
            {Object.entries(HOME_YARD).map(([color, slots]) =>
                slots.map(([row, col], i) => (
                    <div
                        key={`${color}-slot-${i}`}
                        style={{
                            gridRow: row + 1,
                            gridColumn: col + 1,
                            backgroundColor: STRETCH_TINT[color],
                        }}
                        className="self-center justify-self-center w-[115%] h-[115%] rounded-full border-2 border-black/10"
                    />
                ))
            )}

            {/* Track path cells */}
            {TRACK_COORDS.map(([row, col], i) => {
                const entryColor = Object.entries(ENTRY_INDEX).find(([, idx]) => idx === i)?.[0];
                const isSafe = SAFE_TRACK_INDICES.includes(i);

                let bg = 'var(--color-cream)';
                if (entryColor) bg = STRETCH_TINT[entryColor];
                else if (isSafe) bg = '#00000014';

                return (
                    <div
                        key={`track-${i}`}
                        style={{ gridRow: row + 1, gridColumn: col + 1, backgroundColor: bg }}
                        className="border border-ink/5 flex items-center justify-center"
                    >
                        {(isSafe || entryColor) && <span className="text-xs">★</span>}
                    </div>
                );
            })}

            {/* Home stretch lanes */}
            {Object.entries(HOME_STRETCH).map(([color, cells]) =>
                cells.map(([row, col], i) => (
                    <div
                        key={`${color}-stretch-${i}`}
                        style={{
                            gridRow: row + 1,
                            gridColumn: col + 1,
                            backgroundColor: STRETCH_TINT[color],
                        }}
                        className="border border-ink/5"
                    />
                ))
            )}

            {/* Center hub — each quadrant points toward that color's home yard */}
            <div
                style={{
                    gridRow: '7 / span 3',
                    gridColumn: '7 / span 3',
                    background: `conic-gradient(${COLOR_HEX.green} 0deg 90deg, ${COLOR_HEX.yellow} 90deg 180deg, ${COLOR_HEX.blue} 180deg 270deg, ${COLOR_HEX.red} 270deg 360deg)`,
                }}
                className="flex items-center justify-center"
            >
                <span className="text-xl">🏁</span>
            </div>

            {children}
        </div>
    );
}

export default Board;