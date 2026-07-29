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
        setError(t('login.error.adminRole'));
        return;
      }
      if (mode === 'student' && isAdminRole) {
        setError(t('login.error.studentRole'));
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
            {t('login.mode.student')}
          </button>
          <button
            type="button"
            className={mode === 'admin' ? 'active' : ''}
            onClick={() => {
              setMode('admin');
              setError('');
            }}
          >
            {t('login.mode.admin')}
          </button>
        </div>

        <h1>{mode === 'admin' ? t('login.title.admin') : t('login.title.student')}</h1>
        <p className="login-subtitle">
          {mode === 'admin'
            ? t('login.subtitle.admin')
            : t('login.subtitle.student')}
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            {mode === 'student' ? t('login.usernameOrStudentId') : t('login.username')}
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            {t('login.password')}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-primary">
            {mode === 'admin' ? t('login.button.admin') : t('login.button.student')}
          </button>
        </form>
      </div>
    </div>
  );
}
