import React, { useEffect, useState } from 'react';
import { t } from '../i18n';
import { fetchStudentExams } from '../api';
import './StudentDashboard.css';

export default function StudentDashboard({ token, user, onStartExam, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [exams, setExams] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const trainingSpeciality = user.department || t('studentDashboard.specialityDefault');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchStudentExams({ token });
        setExams(res.exams || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleStartTraining = () => {
    setActiveTab('exams');
    if (exams.length > 0) {
      onStartExam(exams[0]);
    }
  };

  const renderHome = () => (
    <div className="student-home">
      <div className="student-home-grid">
        <div className="student-home-card">
          <h2>{t('studentDashboard.specialityTitle')}</h2>
          <p>{t('studentDashboard.specialityLabel')}</p>
          <strong>{trainingSpeciality}</strong>
        </div>
        <div className="student-home-card student-home-training">
          <h2>{t('studentDashboard.trainingSpace')}</h2>
          <p>{t('studentDashboard.trainingSubtitle')}</p>
          <button className="btn btn-primary" type="button" onClick={handleStartTraining}>
            {t('studentDashboard.startTraining')}
          </button>
        </div>
      </div>
      <div className="student-home-summary">
        <p>{t('studentDashboard.homeSummary')}</p>
      </div>
    </div>
  );

  const renderExams = () => (
    <div className="student-exams">
      {loading ? (
        <p>{t('studentDashboard.loading')}</p>
      ) : exams.length === 0 ? (
        <div className="student-empty">{t('studentDashboard.empty')}</div>
      ) : (
        <div className="student-list-grid">
          {exams.map((exam) => (
            <div key={exam.id} className="student-card">
              <h3>{exam.title}</h3>
              <p>{exam.description || t('studentDashboard.noDescription')}</p>
              <p className="student-meta">{t('studentDashboard.scheduled')} {exam.scheduled_at ? new Date(exam.scheduled_at).toLocaleString() : 'TBA'}</p>
              <p className="student-meta">{t('studentDashboard.duration')} {exam.duration_minutes} {t('start.minutes')}</p>
              <p className="student-meta">{t('studentDashboard.status')} {exam.status}</p>
              <button
                className="btn btn-primary"
                disabled={exam.status !== 'scheduled'}
                onClick={() => onStartExam(exam)}
              >
                {t('studentDashboard.startExam')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFiles = () => (
    <div className="student-files">
      <div className="student-info-card">
        <h2>{t('studentDashboard.filesTitle')}</h2>
        <p>{t('studentDashboard.filesMessage')}</p>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="student-progress">
      <div className="student-info-card">
        <h2>{t('studentDashboard.progressTitle')}</h2>
        <p>{t('studentDashboard.progressMessage')}</p>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="student-profile">
      <div className="student-info-card">
        <h2>{t('studentDashboard.profileTitle')}</h2>
        <p>{t('studentDashboard.profileSubtitle')}</p>
        <p><strong>{t('studentDashboard.username')}:</strong> {user.username}</p>
        <p><strong>{t('studentDashboard.studentId')}:</strong> {user.studentId || t('studentDashboard.notAvailable')}</p>
        <p><strong>{t('studentDashboard.roleTitle')}:</strong> {t(`login.mode.${user.role}`) || user.role}</p>
      </div>
    </div>
  );

  const content = {
    home: renderHome(),
    exams: renderExams(),
    files: renderFiles(),
    progress: renderProgress(),
    profile: renderProfile(),
  };

  return (
    <div className="student-dashboard">
      <div className="student-header">
        <div>
          <h1>{t('login.title.student')}</h1>
          <p>{t('login.subtitle.student')}</p>
        </div>
        <button className="btn btn-secondary student-logout-btn" type="button" onClick={onLogout}>
          {t('app.logout')}
        </button>
      </div>

      {error && <div className="student-error">{error}</div>}
      <div className="student-page-content">{content[activeTab]}</div>

      <nav className="student-footer-nav">
        {['home', 'exams', 'files', 'progress', 'profile'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`student-footer-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(`studentDashboard.${tab}`)}
          </button>
        ))}
      </nav>
    </div>
  );
}
