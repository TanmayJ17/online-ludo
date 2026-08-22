import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CellTrack from '../components/CellTrack';

const COLORS = [
    { name: 'red', hex: '#E8483A' },
    { name: 'green', hex: '#2FA84F' },
    { name: 'yellow', hex: '#F5B700' },
    { name: 'blue', hex: '#2D6CDF' },
];

function WaitingRoom() {
    const { roomCode } = useParams();
    const { user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const [game, setGame] = useState(null);
    const [error, setError] = useState('');
    const [selecting, setSelecting] = useState(false);

    // 1. Load current game state on mount / refresh
    useEffect(() => {
        api.post('/game/state', { roomCode })
            .then((res) => {
                setGame(res.data.game);
                // if the game already started (e.g. rejoining after refresh), skip straight to the board
                if (res.data.game.status === 'playing') {
                    navigate(`/game/${roomCode}`);
                }
            })
            .catch((err) => setError(err.response?.data?.message || 'Could not load room'));
    }, [roomCode, navigate]);

    // 2. Join the socket room + listen for live updates
    useEffect(() => {
        if (!socket) {
            console.log('No socket yet');
            return;
        }

        console.log('Joining socket room:', roomCode, 'socket id:', socket.id);
        socket.emit('joinGameRoom', roomCode);

        socket.on('playerJoined', (data) => {
            console.log('Received playerJoined event:', data);
            setGame(data.game);
        });
        socket.on('gameStarted', () => navigate(`/game/${roomCode}`));

        return () => {
            socket.off('playerJoined');
            socket.off('gameStarted');
        };
    }, [socket, roomCode, navigate]);

    if (error) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <p className="font-body text-ludo-red">{error}</p>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <p className="font-body text-ink/50">Loading room...</p>
            </div>
        );
    }

    const isHost = game.host === user.id || game.host === user._id;
    const myPlayer = game.players.find(p => p.user._id === user.id || p.user._id === user._id);
    const takenColors = game.players.map(p => p.color);
    const availableColors = COLORS.filter(c => !takenColors.includes(c.name));

    const handleSelectColor = async (color) => {
        setSelecting(true);
        setError('');
        try {
            const res = await api.post('/game/select-color', { roomCode, color });
            setGame(res.data.game);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not select color');
        } finally {
            setSelecting(false);
        }
    };

    const handleStart = async () => {
        setError('');
        try {
            await api.post('/game/start', { roomCode });
        } catch (err) {
            setError(err.response?.data?.message || 'Could not start game');
        }
    };

    return (
        <div className="min-h-screen bg-cream px-4 py-10">
            <div className="max-w-lg mx-auto">

                <div className="text-center mb-8">
                    <p className="font-body text-sm text-ink/50 mb-1">Room code</p>
                    <h1 className="font-display text-5xl font-extrabold text-ink tracking-[0.15em]">
                        {roomCode}
                    </h1>
                    <div className="mt-4">
                        <CellTrack count={16} />
                    </div>
                </div>

                {error && (
                    <p className="font-body text-sm text-center text-ludo-red bg-white rounded-xl py-2.5 px-4 mb-6 shadow-sm border border-ludo-red/20">
                        {error}
                    </p>
                )}

                {/* Color picker — only shown if this user hasn't joined as a player yet */}
                {!myPlayer && (
                    <div className="bg-white rounded-3xl shadow-md p-6 mb-6 border-b-4 border-ludo-blue">
                        <h2 className="font-display text-lg font-bold text-ink mb-3">Pick your color</h2>
                        {availableColors.length === 0 ? (
                            <p className="font-body text-sm text-ink/50">Room is full.</p>
                        ) : (
                            <div className="flex gap-3">
                                {availableColors.map(({ name, hex }) => (
                                    <button
                                        key={name}
                                        onClick={() => handleSelectColor(name)}
                                        disabled={selecting}
                                        style={{ backgroundColor: hex }}
                                        className="w-12 h-12 rounded-xl hover:scale-105 transition disabled:opacity-50"
                                        aria-label={name}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Players list */}
                <div className="bg-white rounded-3xl shadow-md p-6">
                    <h2 className="font-display text-lg font-bold text-ink mb-4">
                        Players ({game.players.length}/4)
                    </h2>
                    <div className="space-y-3">
                        {game.players.map((p) => (
                            <div key={p.user._id} className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-lg flex-shrink-0"
                                    style={{ backgroundColor: COLORS.find(c => c.name === p.color)?.hex }}
                                />
                                <span className="font-body font-semibold text-ink">
                                    {p.user.username}
                                </span>
                                {(game.host === p.user._id) && (
                                    <span className="font-body text-xs text-ink/40 uppercase tracking-wide">Host</span>
                                )}
                            </div>
                        ))}
                        {Array.from({ length: 4 - game.players.length }).map((_, i) => (
                            <div key={`empty-${i}`} className="flex items-center gap-3 opacity-30">
                                <div className="w-8 h-8 rounded-lg bg-ink/10" />
                                <span className="font-body text-ink/50">Waiting for player...</span>
                            </div>
                        ))}
                    </div>

                    {isHost && (
                        <button
                            onClick={handleStart}
                            disabled={game.players.length < 2}
                            className="font-display w-full bg-ink hover:bg-ink/90 text-cream font-bold py-3 rounded-xl transition disabled:opacity-30 mt-6"
                        >
                            {game.players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
                        </button>
                    )}
                    {!isHost && (
                        <p className="font-body text-sm text-center text-ink/40 mt-6">
                            Waiting for host to start the game...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WaitingRoom;