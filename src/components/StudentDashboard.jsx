import React, { useEffect, useState } from 'react';
import { t } from '../i18n';
import { fetchStudentExams } from '../api';
import './AdminDashboard.css';

export default function StudentDashboard({ token, user, onStartExam }) {
  const [exams, setExams] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h1>{t('login.title')}</h1>
          <p>{t('start.subtitle')}</p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <p>Loading exams...</p>
      ) : exams.length === 0 ? (
        <p>No exams scheduled yet.</p>
      ) : (
        <div className="admin-list-grid">
          {exams.map((exam) => (
            <div key={exam.id} className="admin-card">
              <h3>{exam.title}</h3>
              <p>{exam.description || 'No description provided.'}</p>
              <p>Scheduled: {exam.scheduled_at ? new Date(exam.scheduled_at).toLocaleString() : 'TBA'}</p>
              <p>Duration: {exam.duration_minutes} min</p>
              <p>Status: {exam.status}</p>
              <button
                className="btn btn-primary"
                disabled={exam.status !== 'scheduled'}
                onClick={() => onStartExam(exam)}
              >
                Start Exam
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
