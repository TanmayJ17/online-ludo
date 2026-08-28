import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Board from '../components/Board';
import Token from '../components/Token';
import Dice from '../components/Dice';
import { COLOR_HEX } from '../constants/ludoConstants';
import { getCoordinates } from '../constants/boardLayout';

const STACK_OFFSETS = [
    { x: 0, y: 0 },
    { x: -20, y: -20 },
    { x: 20, y: -20 },
    { x: -20, y: 20 },
];

const STEP_DELAY_MS = 150;

function GameBoard() {
    const { roomCode } = useParams();
    const { user } = useAuth();
    const socket = useSocket();

    const [game, setGame] = useState(null);
    const [error, setError] = useState('');
    const [diceValue, setDiceValue] = useState(null);   // gates whether a roll is "active"
    const [displayDice, setDisplayDice] = useState(null); // what the die visually shows
    const [movableTokens, setMovableTokens] = useState([]);
    const [rolling, setRolling] = useState(false);
    const [animation, setAnimation] = useState(null); // { color, tokenNumber, steps, stepIndex }

    // Socket handlers are set up once, but need to read the LATEST game state
    // (e.g. to know a token's position before an update overwrites it) — a ref
    // avoids re-subscribing socket listeners every time game state changes.
    const gameRef = useRef(null);
    useEffect(() => { gameRef.current = game; }, [game]);

    const fetchIdRef = useRef(0);

    // const fetchGameState = useCallback(() => {
    //     api.post('/game/state', { roomCode })
    //         .then((res) => setGame(res.data.game))
    //         .catch((err) => setError(err.response?.data?.message || 'Could not load game'));
    // }, [roomCode]);

    // const fetchGameState = useCallback(() => {
    //     const requestId = ++fetchIdRef.current;
    //     api.post('/game/state', { roomCode })
    //         .then((res) => {
    //             if (requestId === fetchIdRef.current) {
    //                 setGame(res.data.game);
    //             }
    //         })
    //         .catch((err) => setError(err.response?.data?.message || 'Could not load game'));
    // }, [roomCode]);

    const fetchGameState = useCallback(() => {
        const requestId = ++fetchIdRef.current;
        const startedAt = Date.now();
        console.log(`[fetch#${requestId}] STARTED at ${startedAt}`);
        api.post('/game/state', { roomCode })
            .then((res) => {
                const finishedAt = Date.now();
                const applied = requestId === fetchIdRef.current;
                console.log(
                    `[fetch#${requestId}] RESOLVED at ${finishedAt} (took ${finishedAt - startedAt}ms) — applied: ${applied} — currentFetchIdRef: ${fetchIdRef.current}`,
                    res.data.game.players.map(p => ({ color: p.color, tokens: p.tokens.map(t => t.boardPosition) }))
                );
                if (applied) {
                    setGame(res.data.game);
                }
            })
            .catch((err) => setError(err.response?.data?.message || 'Could not load game'));
    }, [roomCode]);

    useEffect(() => {
        fetchGameState();
    }, [fetchGameState]);

    useEffect(() => {
        if (!socket) return;

        socket.emit('joinGameRoom', roomCode);

        socket.on('diceRolled', (data) => {
            setDiceValue(data.dice);
            setDisplayDice(data.dice);
            setMovableTokens(data.movableTokens);
        });

        socket.on('turnSkipped', (data) => {
            setDiceValue(null);
            setDisplayDice(data.dice);
            setMovableTokens([]);
            fetchGameState();
        });

        socket.on('turnTimeout', () => {
            setDiceValue(null);
            setMovableTokens([]);
            fetchGameState();
        });

        socket.on('tokenMoved', (data) => {
            console.log('[tokenMoved event received]', Date.now(), data.result);
            setDiceValue(null);
            setMovableTokens([]);

            const prevGame = gameRef.current;
            const moveResult = data.result;

            if (prevGame && moveResult?.success) {
                const moverColor = prevGame.players[prevGame.currentTurnIndex].color;
                const moverPlayer = prevGame.players.find(p => p.color === moverColor);
                const movedToken = moverPlayer?.tokens.find(t => t.number === moveResult.tokenNumber);
                const oldPos = movedToken ? movedToken.boardPosition : null;
                const newPos = moveResult.newPosition;

                // Only animate a normal forward slide — leaving home (-1 -> 0)
                // is a single jump with nothing meaningful to step through.
                if (oldPos !== null && oldPos !== -1 && typeof newPos === 'number' && newPos > oldPos) {
                    const steps = [];
                    // If this move only reaches 51 (a genuine resting position), animate
                    // all the way there normally. If it CONTINUES past 51 into the home
                    // stretch, skip rendering 51 itself as an intermediate frame — it sits
                    // visually right next to that color's own start and briefly showing it
                    // mid-animation reads as "went backward," so jump straight to the result.
                    const enteringStretch = newPos > 51;
                    const animateUpTo = enteringStretch ? Math.min(oldPos + 1, 50) === oldPos + 1 ? 50 : oldPos : 51;
                    const safeUpTo = enteringStretch ? Math.min(50, newPos) : Math.min(newPos, 51);

                    for (let p = oldPos + 1; p <= safeUpTo; p++) steps.push(p);
                    if (enteringStretch) steps.push(newPos);

                    if (steps.length > 0) {
                        setAnimation({
                            color: moverColor,
                            tokenNumber: moveResult.tokenNumber,
                            steps,
                            stepIndex: 0,
                            warpAtLastStep: enteringStretch,
                        });
                        return;
                    }
                }
            }

            fetchGameState();
        });

        return () => {
            socket.off('diceRolled');
            socket.off('turnSkipped');
            socket.off('turnTimeout');
            socket.off('tokenMoved');
        };
    }, [socket, roomCode, fetchGameState]);

    // Drives the step-by-step token animation
    useEffect(() => {
        if (!animation) return;

        if (animation.stepIndex >= animation.steps.length - 1) {
            const timer = setTimeout(() => {
                setAnimation(null);
                fetchGameState();
            }, STEP_DELAY_MS);
            return () => clearTimeout(timer);
        }

        const timer = setTimeout(() => {
            setAnimation((prev) => prev ? { ...prev, stepIndex: prev.stepIndex + 1 } : null);
        }, STEP_DELAY_MS);
        return () => clearTimeout(timer);
    }, [animation, fetchGameState]);

    const currentPlayer = game?.players[game.currentTurnIndex];
    const isMyTurn = currentPlayer && (currentPlayer.user._id === user.id || currentPlayer.user._id === user._id);
    const canRoll = isMyTurn && diceValue === null && !rolling && !animation;

    const handleRoll = async () => {
        if (!canRoll) return;
        setRolling(true);
        setError('');

        const flicker = setInterval(() => {
            setDisplayDice(1 + Math.floor(Math.random() * 6));
        }, 90);

        try {
            const res = await api.post('/game/roll-dice', { roomCode });
            clearInterval(flicker);
            setDisplayDice(res.data.dice);

            if (res.data.movableTokens) {
                setDiceValue(res.data.dice);
                setMovableTokens(res.data.movableTokens);
            } else {
                setDiceValue(null);
                setMovableTokens([]);
                fetchGameState();
            }
        } catch (err) {
            clearInterval(flicker);
            setError(err.response?.data?.message || 'Could not roll dice');
        } finally {
            setRolling(false);
        }
    };

    const handleMoveToken = async (tokenNumber) => {
        setError('');
        try {
            await api.post('/game/move-token', { roomCode, tokenNumber });
        } catch (err) {
            setError(err.response?.data?.message || 'Could not move token');
        }
    };

    const cellGroups = game ? (() => {
        const groups = {};
        game.players.forEach((player) => {
            player.tokens.forEach((token, i) => {
                const isAnimatingThisToken =
                    animation && animation.color === player.color && animation.tokenNumber === token.number;
                const displayPosition = isAnimatingThisToken
                    ? animation.steps[animation.stepIndex]
                    : token.boardPosition;

                const { row, col } = getCoordinates(player.color, displayPosition, i);
                const key = `${row}-${col}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push({ player, token, tokenIndex: i, displayPosition });
            });
        });
        return groups;
    })() : {};

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

    if (game.status === 'finished') {
        const winner = game.players.find(p => p.rank === 1);
        return (
            <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
                <h1 className="font-display text-4xl font-bold text-ink mb-2">🏆 Game Over</h1>
                <p className="font-body text-ink/60 mb-6">{winner?.user.username} won!</p>
                <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-sm">
                    {[...game.players].sort((a, b) => a.rank - b.rank).map((p) => (
                        <div key={p.user._id} className="flex items-center gap-3 py-2">
                            <span className="font-display font-bold text-ink/40 w-6">#{p.rank}</span>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLOR_HEX[p.color] }} />
                            <span className="font-body font-semibold text-ink">{p.user.username}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        // <div className="min-h-screen bg-cream px-4 py-8 flex flex-col items-center">
        <div className="min-h-screen bg-cream px-2 sm:px-4 py-6 sm:py-8 flex flex-col items-center">

            <div className="flex items-center gap-2 mb-4 bg-white rounded-full px-4 py-2 shadow-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_HEX[currentPlayer.color] }} />
                <span className="font-body text-sm font-semibold text-ink">
                    {isMyTurn ? "Your turn" : `${currentPlayer.user.username}'s turn`}
                </span>
            </div>

            {error && (
                <p className="font-body text-sm text-center text-ludo-red bg-white rounded-xl py-2 px-4 mb-4 shadow-sm">
                    {error}
                </p>
            )}

            <Board>
                {Object.values(cellGroups).flatMap((group) =>
                    group.map((item, stackIdx) => {
                        const { player, token, tokenIndex, displayPosition } = item;
                        const offset = group.length > 1 ? STACK_OFFSETS[stackIdx % 4] : { x: 0, y: 0 };

                        const isAnimatingThisToken =
                            animation && animation.color === player.color && animation.tokenNumber === token.number;
                        const isWarpingNow =
                            isAnimatingThisToken &&
                            animation.warpAtLastStep &&
                            animation.stepIndex === animation.steps.length - 1;

                        return (
                            <Token
                                key={`${player.color}-${token.number}`}
                                color={player.color}
                                boardPosition={displayPosition}
                                tokenIndex={tokenIndex}
                                isMovable={
                                    isMyTurn &&
                                    player.color === currentPlayer.color &&
                                    movableTokens.includes(token.number) &&
                                    !animation
                                }
                                onClick={() => handleMoveToken(token.number)}
                                offset={offset}
                                stacked={group.length > 1}
                            />
                        );
                    })
                )}
            </Board>

            <div className="flex flex-col items-center gap-3 mt-6">
                <Dice value={displayDice} rolling={rolling} canRoll={canRoll} onClick={handleRoll} />

                {canRoll && <p className="font-body text-sm text-ink/50">Tap the dice to roll</p>}
                {isMyTurn && movableTokens.length > 0 && !animation && (
                    <p className="font-body text-sm text-ink/50">Tap a highlighted token to move it</p>
                )}
                {!isMyTurn && (
                    <p className="font-body text-sm text-ink/40">Waiting for {currentPlayer.user.username}...</p>
                )}
            </div>
        </div>
    );
}

export default GameBoard;