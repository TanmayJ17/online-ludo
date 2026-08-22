import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CellTrack from '../components/CellTrack';

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(username, email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
            <h1 className="font-display text-5xl font-extrabold text-ink tracking-tight mb-1">
                LUDO<span className="text-ludo-red">.</span>
            </h1>
            <div className="mb-8">
                <CellTrack count={12} />
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl shadow-md p-8 w-full max-w-sm border-b-4 border-ludo-red space-y-4"
            >
                <h2 className="font-display text-xl font-bold text-ink text-center mb-1">
                    Join the game
                </h2>

                {error && (
                    <p className="font-body text-sm text-center text-ludo-red bg-ludo-red/5 rounded-xl py-2.5">
                        {error}
                    </p>
                )}

                <div>
                    <label className="font-body text-xs font-semibold text-ink/40 uppercase tracking-wide">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-ink/10 focus:outline-none focus:border-ludo-red font-body"
                    />
                </div>

                <div>
                    <label className="font-body text-xs font-semibold text-ink/40 uppercase tracking-wide">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-ink/10 focus:outline-none focus:border-ludo-red font-body"
                    />
                </div>

                <div>
                    <label className="font-body text-xs font-semibold text-ink/40 uppercase tracking-wide">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-ink/10 focus:outline-none focus:border-ludo-red font-body"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="font-display w-full bg-ludo-red hover:bg-ludo-red/90 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                >
                    {loading ? 'Creating account...' : 'Register'}
                </button>

                <p className="font-body text-sm text-center text-ink/50">
                    Already have an account?{' '}
                    <Link to="/login" className="text-ludo-red font-semibold hover:underline">
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
}

export default Register;