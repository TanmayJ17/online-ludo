import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

function GameBoard() {
    const { roomCode } = useParams();
    const { user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const [game, setGame] = useState(null);
    const [error, setError] = useState('');
    const [diceValue, setDiceValue] = useState(null);
    const [movableTokens, setMovableTokens] = useState([]);
    const [rolling, setRolling] = useState(false);

    const fetchGameState = useCallback(() => {
        api.post('/game/state', { roomCode })
            .then((res) => setGame(res.data.game))
            .catch((err) => setError(err.response?.data?.message || 'Could not load game'));
    }, [roomCode]);

    // 1. Load state on mount
    useEffect(() => {
        fetchGameState();
    }, [fetchGameState]);

    // 2. Socket wiring
    useEffect(() => {
        if (!socket) return;

        socket.emit('joinGameRoom', roomCode);

        socket.on('diceRolled', (data) => {
            setDiceValue(data.dice);
            setMovableTokens(data.movableTokens);
        });

        socket.on('tokenMoved', () => {
            // positions changed — full refetch rather than patching partial event data
            setDiceValue(null);
            setMovableTokens([]);
            fetchGameState();
        });

        socket.on('turnTimeout', () => {
            setDiceValue(null);
            setMovableTokens([]);
            fetchGameState();
        });

        socket.on('turnSkipped', () => {
            setDiceValue(null);
            setMovableTokens([]);
            fetchGameState();
        });

        return () => {
            socket.off('diceRolled');
            socket.off('tokenMoved');
            socket.off('turnTimeout');
            socket.off('turnSkipped');
        };
    }, [socket, roomCode, fetchGameState]);

    const handleRoll = async () => {
        setRolling(true);
        setError('');
        try {
            const res = await api.post('/game/roll-dice', { roomCode });
            if (res.data.movableTokens) {
                setDiceValue(res.data.dice);
                setMovableTokens(res.data.movableTokens);
            } else {
                // no valid moves — turn already passed on the backend, refresh immediately
                setDiceValue(null);
                setMovableTokens([]);
                fetchGameState();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Could not roll dice');
        } finally {
            setRolling(false);
        }
    };

    const handleMoveToken = async (tokenNumber) => {
        setError('');
        try {
            await api.post('/game/move-token', { roomCode, tokenNumber });
            // tokenMoved socket event handles the actual state refresh
        } catch (err) {
            setError(err.response?.data?.message || 'Could not move token');
        }
    };

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
                <p className="font-body text-ink/50">Loading game...</p>
            </div>
        );
    }

    const currentPlayer = game.players[game.currentTurnIndex];
    const isMyTurn = currentPlayer.user._id === user.id || currentPlayer.user._id === user._id;

    // --- Temporary plain-text debug view for pass 1 — real board comes in pass 2 ---
    return (
        <div className="min-h-screen bg-cream p-8 font-body">
            <h1 className="font-display text-2xl font-bold text-ink mb-4">
                Room {roomCode} — status: {game.status}
            </h1>

            <p className="mb-2">
                Current turn: <strong>{currentPlayer.color}</strong> ({currentPlayer.user.username})
                {isMyTurn && <span className="text-ludo-green"> — it's you!</span>}
            </p>

            <p className="mb-2">Dice: {diceValue ?? '—'}</p>
            <p className="mb-4">Movable tokens: {movableTokens.join(', ') || 'none'}</p>

            {isMyTurn && diceValue === null && (
                <button
                    onClick={handleRoll}
                    disabled={rolling}
                    className="font-display bg-ink text-cream px-6 py-2 rounded-xl disabled:opacity-50"
                >
                    {rolling ? 'Rolling...' : 'Roll Dice'}
                </button>
            )}

            {isMyTurn && movableTokens.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm text-ink/50 mb-2">Tap a token number to move it:</p>
                    <div className="flex gap-2">
                        {movableTokens.map((num) => (
                            <button
                                key={num}
                                onClick={() => handleMoveToken(num)}
                                className="bg-ludo-blue text-white px-4 py-2 rounded-lg"
                            >
                                Token {num}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <pre className="mt-8 text-xs bg-white p-4 rounded-xl overflow-auto max-h-96">
                {JSON.stringify(game.players.map(p => ({
                    color: p.color,
                    user: p.user.username,
                    rank: p.rank,
                    warnings: p.warnings,
                    tokens: p.tokens.map(t => t.boardPosition)
                })), null, 2)}
            </pre>
        </div>
    );
}

export default GameBoard;