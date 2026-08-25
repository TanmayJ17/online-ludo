import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CellTrack from '../components/CellTrack';

function Profile() {
    const { user: cachedUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/auth/me')
            .then((res) => setProfile(res.data.user))
            .catch((err) => setError(err.response?.data?.message || 'Could not load profile'));
    }, []);

    const wins = profile?.stats?.wins ?? cachedUser?.stats?.wins ?? 0;
    const gamesPlayed = profile?.stats?.gamesPlayed ?? cachedUser?.stats?.gamesPlayed ?? 0;
    const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

    return (
        <div className="min-h-screen bg-cream px-4 py-10">
            <div className="max-w-md mx-auto">

                <Link to="/" className="font-body text-sm text-ink/50 hover:text-ink mb-6 inline-block">
                    ← Back to lobby
                </Link>

                <div className="text-center mb-8">
                    <h1 className="font-display text-4xl font-extrabold text-ink">
                        {profile?.username || cachedUser?.username}
                    </h1>
                    <p className="font-body text-sm text-ink/50 mt-1">
                        {profile?.email || cachedUser?.email}
                    </p>
                    <div className="mt-4">
                        <CellTrack count={14} />
                    </div>
                </div>

                {error && (
                    <p className="font-body text-sm text-center text-ludo-red bg-white rounded-xl py-2.5 px-4 mb-6 shadow-sm">
                        {error}
                    </p>
                )}

                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl shadow-md p-4 text-center border-b-4 border-ludo-yellow">
                        <p className="font-display text-3xl font-bold text-ink">{wins}</p>
                        <p className="font-body text-xs text-ink/50 mt-1">Wins</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-md p-4 text-center border-b-4 border-ludo-blue">
                        <p className="font-display text-3xl font-bold text-ink">{gamesPlayed}</p>
                        <p className="font-body text-xs text-ink/50 mt-1">Played</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-md p-4 text-center border-b-4 border-ludo-green">
                        <p className="font-display text-3xl font-bold text-ink">{winRate}%</p>
                        <p className="font-body text-xs text-ink/50 mt-1">Win rate</p>
                    </div>
                </div>

                {gamesPlayed === 0 && (
                    <p className="font-body text-sm text-center text-ink/40 mt-8">
                        Play your first game to start building your stats!
                    </p>
                )}
            </div>
        </div>
    );
}

export default Profile;