import React from 'react';
import './QuestionNav.css';

export default function QuestionNav({
  questions,
  currentIdx,
  answers,
  correctAnswers,
  getQuestionStatus,
  onGo,
}) {
  return (
    <div className="qnav">
      <div className="qnav-title">Navigation</div>
      <div className="qnav-grid">
        {questions.map((q, i) => {
          const answered = (answers[q.id] || []).length > 0;
          const status = getQuestionStatus(q.id);
          const isCurrent = i === currentIdx;

          let cls = 'qnav-btn';
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
        <div className="leg-row"><span className="leg-dot dot-answered" />Répondu</div>
        <div className="leg-row"><span className="leg-dot dot-correct" />Correct</div>
        <div className="leg-row"><span className="leg-dot dot-wrong" />Incorrect</div>
        <div className="leg-row"><span className="leg-dot dot-current" />Actuel</div>
      </div>
    </div>
  );
}
