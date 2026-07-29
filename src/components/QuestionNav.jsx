import React from 'react';
import { t } from '../i18n';
import './QuestionNav.css';

export default function QuestionNav({
  questions,
  currentIdx,
  answers,
  correctAnswers,
  getQuestionStatus,
  onGo,
  flaggedQuestions = [],
}) {
  return (
    <div className="qnav">
      <div className="qnav-title">{t('navbar.title')}</div>
      <div className="qnav-grid">
        {questions.map((q, i) => {
          const answered = (answers[q.id] || []).length > 0;
          const status = getQuestionStatus(q.id);
          const isCurrent = i === currentIdx;

          let cls = 'qnav-btn';
          if (flaggedQuestions.includes(q.id)) cls += ' flagged';
          if (isCurrent) cls += ' current';
          if (answered && status === 'correct') cls += ' nav-correct';
          else if (answered && status === 'wrong') cls += ' nav-wrong';
          else if (answered && status === 'partial') cls += ' nav-partial';
          else if (answered) cls += ' nav-answered';

          return (
            <button key={q.id} className={cls} onClick={() => onGo(i)}>
              {q.id}
            </button>
          );
        })}
      </div>
      <div className="qnav-legend">
        <div className="leg-row"><span className="leg-dot dot-answered" />{t('navbar.legend.answered')}</div>
        <div className="leg-row"><span className="leg-dot dot-correct" />{t('navbar.legend.correct')}</div>
        <div className="leg-row"><span className="leg-dot dot-wrong" />{t('navbar.legend.wrong')}</div>
        <div className="leg-row"><span className="leg-dot dot-current" />{t('navbar.legend.current')}</div>
      </div>
    </div>
  );
}
