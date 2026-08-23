import { COLOR_HEX } from '../constants/ludoConstants';
import { getCoordinates } from '../constants/boardLayout';

// function Token({ color, boardPosition, tokenIndex, isMovable, onClick, offset = { x: 0, y: 0 }, stacked = false }) {
//     const { row, col } = getCoordinates(color, boardPosition, tokenIndex);

//     return (
//         <button
//             onClick={onClick}
//             disabled={!isMovable}
//             style={{
//                 gridRow: row + 1,
//                 gridColumn: col + 1,
//                 backgroundColor: COLOR_HEX[color],
//                 transform: `translate(${offset.x}%, ${offset.y}%)`,
//                 boxShadow: isMovable
//                     ? `0 3px 8px rgba(0,0,0,0.35), 0 0 0 3px ${COLOR_HEX[color]}55`
//                     : '0 2px 4px rgba(0,0,0,0.25)',
//             }}
//             className={`
//                 ${stacked ? 'w-[65%] h-[65%]' : 'w-[95%] h-[95%]'}
//                 self-center justify-self-center rounded-full
//                 border-[3px] border-white z-10 transition-all duration-150
//                 ${isMovable ? 'cursor-pointer hover:scale-115 hover:-translate-y-0.5 hover:z-20 animate-bounce' : 'cursor-default'}
//             `}
//         />
//     );
// }

function Token({ color, boardPosition, tokenIndex, isMovable, onClick, offset = { x: 0, y: 0 }, stacked = false, warping = false }) {
    const { row, col } = getCoordinates(color, boardPosition, tokenIndex);

    return (
        <button
            onClick={onClick}
            disabled={!isMovable}
            style={{
                gridRow: row + 1,
                gridColumn: col + 1,
                backgroundColor: COLOR_HEX[color],
                transform: `translate(${offset.x}%, ${offset.y}%) scale(${warping ? 0.4 : 1})`,
                opacity: warping ? 0.3 : 1,
                boxShadow: isMovable
                    ? `0 3px 8px rgba(0,0,0,0.35), 0 0 0 3px ${COLOR_HEX[color]}55`
                    : '0 2px 4px rgba(0,0,0,0.25)',
            }}
            className={`
                ${stacked ? 'w-[65%] h-[65%]' : 'w-[95%] h-[95%]'}
                self-center justify-self-center rounded-full
                border-[3px] border-white z-10 transition-all duration-150
                ${isMovable ? 'cursor-pointer hover:scale-115 hover:-translate-y-0.5 hover:z-20 animate-bounce' : 'cursor-default'}
            `}
        />
    );
}

export default Token;