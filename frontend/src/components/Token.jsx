import { COLOR_HEX } from '../constants/ludoConstants';
import { getCoordinates } from '../constants/boardLayout';

function Token({ color, boardPosition, tokenIndex, isMovable, onClick }) {
    const { row, col } = getCoordinates(color, boardPosition, tokenIndex);

    return (
        <button
            onClick={onClick}
            disabled={!isMovable}
            style={{
                gridRow: row + 1,
                gridColumn: col + 1,
                backgroundColor: COLOR_HEX[color],
                boxShadow: isMovable
                    ? `0 3px 8px rgba(0,0,0,0.35), 0 0 0 3px ${COLOR_HEX[color]}55`
                    : '0 2px 4px rgba(0,0,0,0.25)',
            }}
            className={`
                w-[100%] h-[100%] self-center justify-self-center rounded-full
                border-[3px] border-white z-10 transition-all duration-150
                ${isMovable ? 'cursor-pointer hover:scale-115 hover:-translate-y-0.5 animate-bounce' : 'cursor-default'}
            `}
        />
    );
}

export default Token;