// const DOT_LAYOUTS = {
//     1: [[50, 50]],
//     2: [[25, 25], [75, 75]],
//     3: [[25, 25], [50, 50], [75, 75]],
//     4: [[25, 25], [25, 75], [75, 25], [75, 75]],
//     5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
//     6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
// };

// function Dice({ value, rolling }) {
//     const dots = DOT_LAYOUTS[value] || [];

//     return (
//         <div
//             className={`w-16 h-16 bg-white rounded-2xl shadow-md border-2 border-ink/10 relative ${rolling ? 'animate-spin' : ''}`}
//         >
//             {value &&
//                 dots.map(([top, left], i) => (
//                     <div
//                         key={i}
//                         className="absolute w-2.5 h-2.5 bg-ink rounded-full -translate-x-1/2 -translate-y-1/2"
//                         style={{ top: `${top}%`, left: `${left}%` }}
//                     />
//                 ))}
//         </div>
//     );
// }

// export default Dice;

const DOT_LAYOUTS = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [25, 75], [75, 25], [75, 75]],
    5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
    6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
};

function Dice({ value, rolling, canRoll, onClick }) {
    const dots = DOT_LAYOUTS[value] || [];

    return (
        <button
            onClick={onClick}
            disabled={!canRoll || rolling}
            className={`
                w-16 h-16 bg-white rounded-2xl shadow-md border-2 relative transition
                ${canRoll && !rolling ? 'border-ludo-blue cursor-pointer hover:scale-105' : 'border-ink/10 cursor-default'}
                ${rolling ? 'animate-spin' : ''}
            `}
        >
            {value &&
                dots.map(([top, left], i) => (
                    <div
                        key={i}
                        className="absolute w-2.5 h-2.5 bg-ink rounded-full -translate-x-1/2 -translate-y-1/2"
                        style={{ top: `${top}%`, left: `${left}%` }}
                    />
                ))}
        </button>
    );
}

export default Dice;