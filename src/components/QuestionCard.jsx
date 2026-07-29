import React, { useState } from 'react';
import { t } from '../i18n';
import './QuestionCard.css';

export default function QuestionCard({
  question,
  selectedKeys,
  correctKeys,
  onToggle,
  onSetCorrect,
  showCheat,
  reviewMode,
  questionScore,
}) {
  const [showCheatLocal, setShowCheatLocal] = useState(false);
  const [localCorrect, setLocalCorrect] = useState(correctKeys || []);

  const isRevealed = showCheat || showCheatLocal;

  const handleToggleCorrect = (key) => {
    const updated = localCorrect.includes(key)
      ? localCorrect.filter(k => k !== key)
      : [...localCorrect, key];
    setLocalCorrect(updated);
    onSetCorrect(question.id, updated);
  };

  const options = Object.entries(question.options);
  const answered = selectedKeys.length > 0;

  return (
    <div className="qcard animate-in">
      {/* Header */}
      <div className="qcard-header">
        <div className="qcard-num">{t('question.number', { id: question.id })}</div>
        {questionScore && (
          <div className="qcard-score-badge">
            <span className={questionScore.score >= 0.8 ? 'score-high' : questionScore.score >= 0.4 ? 'score-mid' : 'score-low'}>
              {questionScore.score.toFixed(2).replace('.', ',')}
            </span>
            <span className="score-max">/ 1,00</span>
          </div>
        )}
      </div>

      {/* Scenario */}
      {question.scenario && (
        <div className="qcard-scenario">
          <div className="scenario-label">{t('question.scenario')}</div>
          <div className="scenario-text">{question.scenario}</div>
        </div>
      )}

      {/* Question text */}
      {question.question && (
        <div className="qcard-question">{question.question}</div>
      )}

      {/* Options */}
      <div className="qcard-options">
        {options.map(([key, text]) => {
          const isSelected = selectedKeys.includes(key);
          const isCorrect = (correctKeys || []).includes(key);
          const isCheatCorrect = isRevealed && localCorrect.includes(key);

          let statusClass = '';
          if (reviewMode && correctKeys?.length > 0) {
            if (isCorrect && isSelected) statusClass = 'opt-correct-selected';
            else if (isCorrect && !isSelected) statusClass = 'opt-correct-missed';
            else if (!isCorrect && isSelected) statusClass = 'opt-wrong-selected';
          } else if (isSelected) {
            statusClass = 'opt-selected';
          }
          if (isCheatCorrect && !reviewMode) statusClass = 'opt-cheat';

          return (
            <label
              key={key}
              className={`option ${statusClass} ${reviewMode ? 'review-mode' : ''}`}
            >
              <div className="option-left">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => !reviewMode && onToggle(question.id, key)}
                  disabled={reviewMode}
                />
                <span className="option-key">{key.toUpperCase()}</span>
              </div>
              <span className="option-text">{text}</span>
              {reviewMode && correctKeys?.length > 0 && (
                <div className="option-badge">
                  {isCorrect && isSelected && <span className="badge-correct">✔ {t('question.correct')}</span>}
                  {isCorrect && !isSelected && <span className="badge-missed">↺ {t('question.missed')}</span>}
                  {!isCorrect && isSelected && <span className="badge-wrong">✖ {t('question.wrong')}</span>}
                </div>
              )}
              {isCheatCorrect && !reviewMode && (
                <span className="cheat-marker">★ {t('question.cheatMarker')}</span>
              )}
            </label>
          );
        })}
      </div>

      {/* Cheat section */}
      {!reviewMode && (
        <div className="qcard-cheat-area">
          <div className="cheat-divider" />
          <div className="cheat-controls">
            <button
              className={`btn-cheat ${showCheatLocal ? 'active' : ''}`}
              onClick={() => setShowCheatLocal(!showCheatLocal)}
            >
              {showCheatLocal ? t('question.hideAnswers') : t('question.showAnswers')}
            </button>
            {(showCheatLocal || isRevealed) && (
              <div className="correct-selector">
                <span className="correct-selector-label">{t('question.markCorrect')}</span>
                <div className="correct-keys">
                  {options.map(([key]) => (
                    <button
                      key={key}
                      className={`key-toggle ${localCorrect.includes(key) ? 'key-active' : ''}`}
                      onClick={() => handleToggleCorrect(key)}
                    >
                      {key.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Not answered notice */}
      {!answered && !reviewMode && (
        <div className="not-answered">{t('question.notAnswered')}</div>
      )}
    </div>
  );
}
