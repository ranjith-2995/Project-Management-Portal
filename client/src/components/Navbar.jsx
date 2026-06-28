import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar__inner">
          <Link to="/" className="navbar__brand">
            <div className="navbar__brand-icon">✦</div>
            <div className="navbar__brand-text">
              Task<span>Flow</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="navbar__nav">
            {user ? (
              <>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
                >
                  <span>⊞</span> Dashboard
                </NavLink>
                <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)', margin: '0 8px' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {user.name}
                </span>
                <button onClick={handleLogout} className="btn btn-sm btn-ghost" style={{ marginLeft: '8px' }}>
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/login" className="btn btn-sm btn-primary">
                Sign In
              </NavLink>
            )}
          </div>

          {/* Hamburger */}
          {user && (
            <button
              className="navbar__hamburger"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          )}
        </div>

        {/* Mobile nav */}
        {user && (
          <div className={`navbar__mobile ${mobileOpen ? 'open' : ''}`}>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span>⊞</span> Dashboard
            </NavLink>
            <div style={{ marginTop: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user.name}</span>
              <button onClick={handleLogout} className="btn btn-sm btn-ghost">Logout</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
