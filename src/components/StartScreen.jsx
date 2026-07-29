import React, { useState } from 'react';
import { t } from '../i18n';
import logo from '../assets/logo.jpeg';
import './StartScreen.css';

const SAMPLE = `Questions 1 à 2 - Exemple

Question 1
Mise en situation : Un modèle YOLOv8 est en production.
Mission : En tant qu'architecte IA, vous devez concevoir une architecture MLOps.
Parmi les approches suivantes, lesquelles sont les plus robustes ?
a.
Pipeline de ré-entraînement Kubernetes avec stratégie Canary.
b.
Service de monitoring de dérive via CronJob Spark toutes les 6 heures.
c.
Fine-tuning continu en production avec clés MinIO en clair dans ConfigMap.
d.
Aucune des réponses proposées.
e.
Job Spark hebdomadaire avec déploiement manuel.

Question 2
Mise en situation : La DGSN a déployé un modèle XGBoost pour prédire les risques de cambriolage.
Question : Quelles approches permettent de rendre ce modèle explicable et adopté par les équipes ?
a.
Aucune des réponses proposées.
b.
Tableau de bord exposant toutes les données brutes.
c.
Remplacer XGBoost par régression logistique.
d.
Intégrer le calcul des valeurs SHAP dans le job Spark quotidien.
e.
Exposer un endpoint /api/v1/risk_drivers retournant les facteurs SHAP.`;

export default function StartScreen({ onStart }) {
  const [text, setText] = useState('');
  const [duration, setDuration] = useState(90);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = () => {
    const result = onStart(text.trim(), parseInt(duration) || 90);
    if (result?.error) setError(result.error);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (ev) => setText(ev.target.result);
      reader.readAsText(file);
    }
  };

  return (
    <div className="start-screen">
      <div className="start-bg" />
      <div className="start-container animate-in">
        <div className="start-header">
          <div className="logo">
            <img src={logo} alt="ExamPro logo" className="logo-image" />
            <span className="logo-text">ExamPro</span>
          </div>
          <h1 className="start-title">{t('start.title')}</h1>
          <p className="start-subtitle">{t('start.subtitle')}</p>
        </div>

        <div className="start-body">
          <div className="start-left">
            <div className="field-label">
              <span>{t('start.questionsLabel')}</span>
              <button className="btn-load-sample" onClick={() => setText(SAMPLE)}>
                {t('start.loadSample')}
              </button>
            </div>
            <div
              className={`textarea-wrap ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <textarea
                className="start-textarea"
                placeholder={t('start.placeholder')}
                value={text}
                onChange={e => { setText(e.target.value); setError(''); }}
              />
              {isDragging && <div className="drop-overlay">{t('start.dropHint')}</div>}
            </div>
            {text && (
              <div className="text-stats">
                <span>{t('start.statsChars', { count: text.length.toLocaleString() })}</span>
                <span>·</span>
                <span>{t('start.statsLines', { count: text.split('\n').length })}</span>
              </div>
            )}
          </div>

          <div className="start-right">
            <div className="config-card">
              <h3 className="config-title">{t('start.configTitle')}</h3>

              <div className="config-field">
                <label>{t('start.durationLabel')}</label>
                <div className="duration-options">
                  {[30, 60, 90, 120, 180].map(d => (
                    <button
                      key={d}
                      className={`duration-btn ${duration === d ? 'active' : ''}`}
                      onClick={() => setDuration(d)}
                    >
                      {d >= 60 ? `${Math.floor(d / 60)}h${d % 60 ? (d % 60) + 'min' : ''}` : `${d}min`}
                    </button>
                  ))}
                </div>
                <div className="duration-custom">
                  <label>{t('start.durationCustomLabel')}</label>
                  <input
                    type="number"
                    min="1" max="360"
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value) || 90)}
                    className="duration-input"
                  />
                  <span>{t('start.minutes')}</span>
                </div>
              </div>

              <div className="config-info">
                <div className="info-row">
                  <span className="info-dot green" />
                  <span>{t('start.correctSelected')}</span>
                </div>
                <div className="info-row">
                  <span className="info-dot red" />
                  <span>{t('start.incorrectSelected')}</span>
                </div>
                <div className="info-row">
                  <span className="info-dot gray" />
                  <span>{t('start.correctNotSelected')}</span>
                </div>
                <div className="info-row">
                  <span className="info-dot blue" />
                  <span>{t('start.scoreMin')}</span>
                </div>
              </div>

              {error && <div className="start-error">⚠ {error}</div>}

              <button
                className="btn btn-primary btn-start"
                onClick={handleStart}
                disabled={!text.trim()}
              >
                <span>▶</span>
                {t('start.startButton')}
              </button>
            </div>

            <div className="features-grid">
              <div className="feature">
                <span className="feature-icon">⏱</span>
                <span>{t('start.features.chrono')}</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📊</span>
                <span>{t('start.features.scoring')}</span>
              </div>
              <div className="feature">
                <span className="feature-icon">💾</span>
                <span>{t('start.features.autosave')}</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📋</span>
                <span>{t('start.features.report')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
