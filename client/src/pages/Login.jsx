import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      return setError('Please fill in all fields.');
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page auth-page">
      <div className="container">
        <div className="auth-layout">
          {/* Left side description */}
          <div className="auth-layout__info">
            <div className="auth-layout__icon">✦</div>
            <h1 className="auth-layout__title">Organize. Prioritize. Achieve.</h1>
            <p className="auth-layout__subtitle">Welcome back</p>
            <p className="auth-layout__desc">
              Sign in to access your tasks, track progress and get things done.
            </p>
            <div className="auth-layout__features">
              <div className="auth-layout__feature">
                <div className="auth-layout__feature-icon">✓</div>
                <div className="auth-layout__feature-text">
                  <h3>Stay Organized</h3>
                  <p>Keep all your tasks in one place.</p>
                </div>
              </div>
              <div className="auth-layout__feature">
                <div className="auth-layout__feature-icon">⏳</div>
                <div className="auth-layout__feature-text">
                  <h3>Track Progress</h3>
                  <p>Monitor your productivity.</p>
                </div>
              </div>
              <div className="auth-layout__feature">
                <div className="auth-layout__feature-icon">✦</div>
                <div className="auth-layout__feature-text">
                  <h3>Collaborate</h3>
                  <p>Work together seamlessly.</p>
                </div>
              </div>
            </div>
          </div>


          {/* Right side login form */}
          <div className="auth-card" style={{ width: '100%' }}>
            <h2 className="auth-card__heading">Sign In</h2>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={loading}
              >
                {loading ? '⏳ Signing in…' : '→ Sign In'}
              </button>
            </form>

            <p className="auth-card__footer">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
