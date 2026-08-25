import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CellTrack from '../components/CellTrack';
import { Link } from 'react-router-dom';

const COLORS = [
    { name: 'red', hex: '#E8483A' },
    { name: 'green', hex: '#2FA84F' },
    { name: 'yellow', hex: '#F5B700' },
    { name: 'blue', hex: '#2D6CDF' },
];

function Lobby() {
    const [selectedColor, setSelectedColor] = useState('red');
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleCreate = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/game/create', { color: selectedColor });
            navigate(`/waiting/${res.data.roomCode}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not create room');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/game/join', { roomCode: joinCode.toUpperCase() });
            navigate(`/waiting/${joinCode.toUpperCase()}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not join room');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream px-4 py-10">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="font-body text-sm text-ink/50">Welcome back</p>
                        <h2 className="font-display text-2xl font-bold text-ink">{user?.username}</h2>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                        {user?.role === 'admin' && (
                            <Link
                                to="/admin"
                                className="font-body text-sm text-ludo-blue hover:underline"
                            >
                                Admin
                            </Link>
                        )}
                        <Link
                            to="/profile"
                            className="font-body text-sm text-ink/50 hover:text-ink transition"
                        >
                            Profile
                        </Link>
                        <button
                            onClick={logout}
                            className="font-body text-sm text-ink/50 hover:text-ludo-red transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="text-center my-10">
                    {/* <h1 className="font-display text-6xl font-extrabold text-ink tracking-tight"> */}
                    <h1 className="font-display text-5xl sm:text-6xl font-extrabold text-ink tracking-tight">
                        LUDO<span className="text-ludo-red">.</span>
                    </h1>
                    <p className="font-body text-ink/60 mt-2 mb-6">
                        Roll the dice. Race your friends home.
                    </p>
                    <CellTrack count={20} />
                </div>

                {error && (
                    <p className="font-body text-sm text-center text-ludo-red bg-white rounded-xl py-2.5 px-4 mb-6 shadow-sm border border-ludo-red/20">
                        {error}
                    </p>
                )}

                <div className="grid sm:grid-cols-2 gap-5">

                    <div className="bg-white rounded-3xl shadow-md p-6 border-b-4 border-ludo-red">
                        <h2 className="font-display text-xl font-bold text-ink mb-1">Create a room</h2>
                        <p className="font-body text-sm text-ink/50 mb-4">Start a new game and invite friends</p>

                        <p className="font-body text-xs font-semibold text-ink/40 uppercase tracking-wide mb-2">
                            Your color
                        </p>
                        <div className="flex gap-3 mb-5">
                            {COLORS.map(({ name, hex }) => (
                                <button
                                    key={name}
                                    onClick={() => setSelectedColor(name)}
                                    style={{ backgroundColor: hex }}
                                    className={`w-10 h-10 rounded-xl transition-all ${
                                        selectedColor === name
                                            ? 'ring-4 ring-offset-2 ring-ink/20 scale-105'
                                            : 'opacity-70 hover:opacity-100'
                                    }`}
                                    aria-label={name}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="font-display w-full bg-ink hover:bg-ink/90 text-cream font-bold py-3 rounded-xl transition disabled:opacity-50"
                        >
                            Create Room
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl shadow-md p-6 border-b-4 border-ludo-blue flex flex-col">
                        <h2 className="font-display text-xl font-bold text-ink mb-1">Join a room</h2>
                        <p className="font-body text-sm text-ink/50 mb-4">Got a code from a friend?</p>

                        <form onSubmit={handleJoin} className="flex flex-col gap-3 mt-auto">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="ROOM CODE"
                                maxLength={6}
                                required
                                className="font-display text-center text-lg tracking-[0.3em] px-4 py-3 rounded-xl border-2 border-ink/10 focus:outline-none focus:border-ludo-blue uppercase placeholder:tracking-normal placeholder:text-sm placeholder:font-body"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="font-display w-full bg-ludo-blue hover:bg-ludo-blue/90 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                            >
                                Join Room
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Lobby;