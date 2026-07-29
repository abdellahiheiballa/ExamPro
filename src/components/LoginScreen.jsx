import React, { useState } from 'react';
import { t } from '../i18n';
import { login } from '../api';
import './LoginScreen.css';

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t('login.requiredFields'));
      return;
    }

    try {
      setError('');
      const data = await login({ username, password });
      const isAdminRole = data.user.role === 'admin' || data.user.role === 'teacher';
      if (mode === 'admin' && !isAdminRole) {
        setError('Please use admin credentials or switch to student login.');
        return;
      }
      if (mode === 'student' && isAdminRole) {
        setError('Please use the admin login tab for administrator access.');
        return;
      }
      onLogin(data);
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError(t('login.fetchFailed'));
      } else if (err.message.toLowerCase().includes('invalid')) {
        setError(t('login.invalidCredentials'));
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-mode-switcher">
          <button
            type="button"
            className={mode === 'student' ? 'active' : ''}
            onClick={() => {
              setMode('student');
              setError('');
            }}
          >
            Student Login
          </button>
          <button
            type="button"
            className={mode === 'admin' ? 'active' : ''}
            onClick={() => {
              setMode('admin');
              setError('');
            }}
          >
            Admin Login
          </button>
        </div>

        <h1>{mode === 'admin' ? 'Admin Login' : 'Student Login'}</h1>
        <p className="login-subtitle">
          {mode === 'admin'
            ? 'Use your administrator credentials to manage exams and users.'
            : 'Use your student credentials to view and take exams.'}
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            {t('login.username')}
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            {t('login.password')}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-primary">
            {mode === 'admin' ? 'Login as Admin' : 'Login as Student'}
          </button>
        </form>
      </div>
    </div>
  );
}
