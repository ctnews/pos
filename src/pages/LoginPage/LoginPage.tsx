import { useState, type FormEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { RECEIPT_STORE } from '../../constants/defaults';

export function LoginPage() {
  const { login, isLoading } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const ok = await login(username.trim(), password);
    setSubmitting(false);
    if (!ok) {
      setError('Invalid username or password.');
      setPassword('');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img src="/icon.png" alt="" className="login-logo" />
          <h1>{RECEIPT_STORE.name}</h1>
          <p>Sign in to continue</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="Enter username"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn-login" disabled={submitting || isLoading}>
            {submitting || isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="login-footnote">
          Admin: full access. Cashiers: POS only.
        </p>
      </div>
    </div>
  );
}
