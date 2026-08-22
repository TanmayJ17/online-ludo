import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CellTrack from '../components/CellTrack';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
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
                className="bg-white rounded-3xl shadow-md p-8 w-full max-w-sm border-b-4 border-ludo-blue space-y-4"
            >
                <h2 className="font-display text-xl font-bold text-ink text-center mb-1">
                    Welcome back
                </h2>

                {error && (
                    <p className="font-body text-sm text-center text-ludo-red bg-ludo-red/5 rounded-xl py-2.5">
                        {error}
                    </p>
                )}

                <div>
                    <label className="font-body text-xs font-semibold text-ink/40 uppercase tracking-wide">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-ink/10 focus:outline-none focus:border-ludo-blue font-body"
                    />
                </div>

                <div>
                    <label className="font-body text-xs font-semibold text-ink/40 uppercase tracking-wide">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-ink/10 focus:outline-none focus:border-ludo-blue font-body"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="font-display w-full bg-ink hover:bg-ink/90 text-cream font-bold py-3 rounded-xl transition disabled:opacity-50"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>

                <p className="font-body text-sm text-center text-ink/50">
                    New here?{' '}
                    <Link to="/register" className="text-ludo-blue font-semibold hover:underline">
                        Create an account
                    </Link>
                </p>
            </form>
        </div>
    );
}

export default Login;