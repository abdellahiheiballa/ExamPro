import React, { useEffect, useState } from 'react';
import { useExam } from './hooks/useExam';
import { getLocale, setLocale, t } from './i18n';
import StartScreen from './components/StartScreen';
import TestInterface from './components/TestInterface';
import ResultsTable from './components/ResultsTable';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';

const AUTH_STORAGE_KEY = 'exam_app_auth_v1';

export default function App() {
  const [token, setToken] = useState(null);
  const exam = useExam(token);
  const [locale, setLocaleState] = useState(getLocale());
  const [user, setUser] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed?.user) {
          setToken(parsed.token);
          setUser(parsed.user);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  useEffect(() => {
    if (!token || !user) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
  }, [token, user]);

  const handleLocaleChange = (newLocale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  };

  const handleLogin = (data) => {
    setToken(data.token);
    setUser(data.user);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setSelectedExam(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const handleStartExam = async (selectedExam) => {
    setSelectedExam(selectedExam);
    await exam.startTest(
      selectedExam.id,
      selectedExam.exam_text || selectedExam.description || '',
      selectedExam.duration_minutes || 90,
    );
  };

  const renderContent = () => {
    if (!user) return <LoginScreen onLogin={handleLogin} />;

    if (user.role === 'admin' || user.role === 'teacher') {
      return <AdminDashboard token={token} user={user} onLogout={handleLogout} />;
    }

    if (user.role === 'student') {
      if (exam.phase === 'start') {
        return <StudentDashboard token={token} user={user} onStartExam={handleStartExam} onLogout={handleLogout} />;
      }
      if (exam.phase === 'test') {
        return (
          <TestInterface
            questions={exam.questions}
            answers={exam.answers}
            correctAnswers={exam.correctAnswers}
            currentIdx={exam.currentIdx}
            timeLeft={exam.timeLeft}
            totalTime={exam.totalTime}
            showCheat={exam.showCheat}
            setShowCheat={exam.setShowCheat}
            reviewMode={exam.reviewMode}
            setReviewMode={exam.setReviewMode}
            toggleAnswer={exam.toggleAnswer}
            setCorrectForQuestion={exam.setCorrectForQuestion}
            goToQuestion={exam.goToQuestion}
            handleSubmit={exam.handleSubmit}
            resetTest={exam.resetTest}
            getQuestionScore={exam.getQuestionScore}
            getQuestionStatus={exam.getQuestionStatus}
            startedAt={exam.startedAt}
            finishedAt={exam.finishedAt}
          />
        );
      }
      return (
        <ResultsTable
          questions={exam.questions}
          answers={exam.answers}
          correctAnswers={exam.correctAnswers}
          startedAt={exam.startedAt}
          finishedAt={exam.finishedAt}
          elapsedSeconds={exam.elapsedSeconds}
          getQuestionScore={exam.getQuestionScore}
          getQuestionStatus={exam.getQuestionStatus}
          resetTest={exam.resetTest}
          toggleAnswer={exam.toggleAnswer}
          setCorrectForQuestion={exam.setCorrectForQuestion}
        />
      );
    }

    return (
      <div className="app-shell">
        <div className="app-language-switcher">
          <span>{t('language.label')}:</span>
          {['ar', 'fr'].map(code => (
            <button
              key={code}
              className={`lang-btn ${locale === code ? 'active' : ''}`}
              onClick={() => handleLocaleChange(code)}
              type="button"
            >
              {t(`language.${code}`)}
            </button>
          ))}
        </div>
        <div className="login-screen">
          <div className="login-card">
            <h1>Unsupported role</h1>
            <p>Please contact the administrator if you cannot access the app.</p>
            <button className="btn btn-primary" type="button" onClick={handleLogout}>
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-shell">
      <div className="app-language-switcher">
        <span>{t('language.label')}:</span>
        {['ar', 'fr'].map(code => (
          <button
            key={code}
            className={`lang-btn ${locale === code ? 'active' : ''}`}
            onClick={() => handleLocaleChange(code)}
            type="button"
          >
            {t(`language.${code}`)}
          </button>
        ))}
      </div>
      <div className="app-body">{renderContent()}</div>
      {user && user.role !== 'student' && (
        <footer className="app-footer">
          <button className="btn btn-secondary" type="button" onClick={handleLogout}>
            {t('app.logout')}
          </button>
        </footer>
      )}
    </div>
  );
}
