import { useState, useEffect } from 'react';
import api from '../api/axios';
import { COLOR_HEX } from '../constants/ludoConstants';

function Admin() {
    const [games, setGames] = useState(null);
    const [users, setUsers] = useState(null);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('games');

    useEffect(() => {
        Promise.all([
            api.get('/admin/games'),
            api.get('/admin/users'),
        ])
            .then(([gamesRes, usersRes]) => {
                setGames(gamesRes.data.games);
                setUsers(usersRes.data.users);
            })
            .catch((err) => setError(err.response?.data?.message || 'Could not load admin data'));
    }, []);

    if (error) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <p className="font-body text-ludo-red">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream px-4 py-10">
            <div className="max-w-3xl mx-auto">
                <h1 className="font-display text-3xl font-bold text-ink mb-1">Admin</h1>
                <p className="font-body text-sm text-ink/50 mb-6">Read-only view of games and users</p>

                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setTab('games')}
                        className={`font-display text-sm font-semibold px-4 py-2 rounded-full transition ${
                            tab === 'games' ? 'bg-ink text-cream' : 'bg-white text-ink/50'
                        }`}
                    >
                        Games {games ? `(${games.length})` : ''}
                    </button>
                    <button
                        onClick={() => setTab('users')}
                        className={`font-display text-sm font-semibold px-4 py-2 rounded-full transition ${
                            tab === 'users' ? 'bg-ink text-cream' : 'bg-white text-ink/50'
                        }`}
                    >
                        Users {users ? `(${users.length})` : ''}
                    </button>
                </div>

                {!games && !users && (
                    <p className="font-body text-ink/50">Loading...</p>
                )}

                {tab === 'games' && games && (
                    <div className="bg-white rounded-2xl shadow-md divide-y divide-ink/5">
                        {games.length === 0 && (
                            <p className="font-body text-sm text-ink/40 p-4">No games yet.</p>
                        )}
                        {games.map((game) => (
                            <div key={game._id} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-display font-bold text-ink tracking-wider">{game.roomCode}</p>
                                    <p className="font-body text-xs text-ink/50">
                                        Host: {game.host?.username || 'unknown'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {game.players?.map((p) => (
                                            <div
                                                key={p.user?._id || p.color}
                                                className="w-5 h-5 rounded-full border-2 border-white"
                                                style={{ backgroundColor: COLOR_HEX[p.color] }}
                                                title={p.user?.username}
                                            />
                                        ))}
                                    </div>
                                    <span
                                        className={`font-body text-xs font-semibold px-2.5 py-1 rounded-full ${
                                            game.status === 'playing'
                                                ? 'bg-ludo-green/10 text-ludo-green'
                                                : game.status === 'finished'
                                                ? 'bg-ink/10 text-ink/50'
                                                : 'bg-ludo-yellow/10 text-ludo-yellow'
                                        }`}
                                    >
                                        {game.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'users' && users && (
                    <div className="bg-white rounded-2xl shadow-md divide-y divide-ink/5">
                        {users.map((u) => (
                            <div key={u._id} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-display font-bold text-ink">{u.username}</p>
                                    <p className="font-body text-xs text-ink/50">{u.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-body text-sm text-ink">
                                        {u.stats?.wins ?? 0} wins / {u.stats?.gamesPlayed ?? 0} played
                                    </p>
                                    {u.role === 'admin' && (
                                        <span className="font-body text-xs text-ludo-blue font-semibold">admin</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Admin;