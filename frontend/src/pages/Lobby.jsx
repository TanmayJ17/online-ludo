import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const COLORS = ['red', 'green', 'yellow', 'blue'];

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
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-rose-50 to-yellow-100 px-4 py-10">
            <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-orange-600">
                        Hey, {user?.username} 👋
                    </h1>
                    <button
                        onClick={logout}
                        className="text-sm text-gray-500 hover:text-red-500"
                    >
                        Logout
                    </button>
                </div>

                {error && (
                    <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2 mb-4">
                        {error}
                    </p>
                )}

                {/* Create room */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">Create a room</h2>
                    <p className="text-sm text-gray-500 mb-3">Pick your color</p>
                    <div className="flex gap-3 mb-4">
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`w-10 h-10 rounded-full border-4 transition ${
                                    selectedColor === color ? 'border-gray-700 scale-110' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: color }}
                                aria-label={color}
                            />
                        ))}
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
                    >
                        Create Room
                    </button>
                </div>

                {/* Join room */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">Join a room</h2>
                    <form onSubmit={handleJoin} className="flex gap-2">
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="ROOM CODE"
                            maxLength={6}
                            required
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 uppercase tracking-widest"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold px-5 rounded-lg transition disabled:opacity-50"
                        >
                            Join
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Lobby;