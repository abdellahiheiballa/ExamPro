import React, { useState } from 'react';
import Timer from './Timer';
import QuestionCard from './QuestionCard';
import QuestionNav from './QuestionNav';
import './TestInterface.css';

export default function TestInterface({
  questions,
  answers,
  correctAnswers,
  currentIdx,
  timeLeft,
  totalTime,
  showCheat,
  setShowCheat,
  reviewMode,
  setReviewMode,
  toggleAnswer,
  setCorrectForQuestion,
  goToQuestion,
  handleSubmit,
  resetTest,
  getQuestionScore,
  getQuestionStatus,
  startedAt,
  finishedAt,
}) {
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const q = questions[currentIdx];
  if (!q) return null;

  const answeredCount = Object.values(answers).filter(a => a.length > 0).length;
  const unanswered = questions.length - answeredCount;
  const score = getQuestionScore(q.id);

  const handleNav = (idx) => {
    goToQuestion(idx);
  };

  const progressPct = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="test-layout">
      {/* Top bar */}
      <header className="test-topbar">
        <div className="topbar-left">
          <div className="logo-sm">
            <span className="logo-icon-sm">⬡</span>
            <span className="logo-text-sm">ExamPro</span>
          </div>
          <div className="progress-pill">
            <span className="progress-text">Q{q.id}</span>
            <span className="progress-sep">/</span>
            <span className="progress-total">{questions.length}</span>
          </div>
        </div>

        <div className="topbar-center">
          <div className="progress-bar-wrap">
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="progress-label">{answeredCount} répondus · {unanswered} restants</span>
          </div>
        </div>

        <div className="topbar-right">
          <button
            className={`btn-cheat-toggle ${showCheat ? 'active' : ''}`}
            onClick={() => setShowCheat(!showCheat)}
            title="Voir/Masquer toutes les réponses"
          >
            {showCheat ? '🙈' : '👁'}
          </button>
          <Timer timeLeft={timeLeft} totalTime={totalTime} />
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowSubmitConfirm(true)}
          >
            Terminer
          </button>
          <button className="btn btn-ghost btn-sm" onClick={resetTest}>
            Réinitialiser
          </button>
        </div>
      </header>

      {/* Confirm modal */}
      {showSubmitConfirm && (
        <div className="modal-backdrop" onClick={() => setShowSubmitConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Soumettre l'examen ?</div>
            <div className="modal-body">
              {unanswered > 0 && (
                <div className="modal-warn">
                  ⚠ {unanswered} question{unanswered > 1 ? 's' : ''} sans réponse.
                </div>
              )}
              <p>Cette action est irréversible. Vos réponses seront soumises et notées.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowSubmitConfirm(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={() => { setShowSubmitConfirm(false); handleSubmit(); }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="test-body">
        {/* Left nav */}
        <aside className="test-nav">
          <QuestionNav
            questions={questions}
            currentIdx={currentIdx}
            answers={answers}
            correctAnswers={correctAnswers}
            getQuestionStatus={getQuestionStatus}
            onGo={handleNav}
          />
        </aside>

        {/* Main content */}
        <main className="test-main">
          <QuestionCard
            question={q}
            selectedKeys={answers[q.id] || []}
            correctKeys={correctAnswers[q.id] || []}
            onToggle={toggleAnswer}
            onSetCorrect={setCorrectForQuestion}
            showCheat={showCheat}
            reviewMode={false}
            questionScore={score}
          />

          {/* Prev / Next */}
          <div className="question-nav-btns">
            <button
              className="btn btn-ghost"
              disabled={currentIdx === 0}
              onClick={() => goToQuestion(currentIdx - 1)}
            >
              ← Précédent
            </button>
            <span className="nav-indicator">{currentIdx + 1} / {questions.length}</span>
            {currentIdx < questions.length - 1 ? (
              <button className="btn btn-secondary" onClick={() => goToQuestion(currentIdx + 1)}>
                Suivant →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowSubmitConfirm(true)}>
                Terminer l'examen ✓
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
