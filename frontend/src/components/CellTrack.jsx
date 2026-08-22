const TRACK_COLORS = ['bg-ludo-red', 'bg-ludo-green', 'bg-ludo-yellow', 'bg-ludo-blue'];

function CellTrack({ count = 16 }) {
    return (
        <div className="flex gap-1.5 justify-center">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${TRACK_COLORS[i % 4]}`}
                />
            ))}
        </div>
    );
}

export default CellTrack;