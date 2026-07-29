import React, { useState } from 'react';
import { t } from '../i18n';
import logo from '../assets/logo.jpeg';
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
            <img src={logo} alt="ExamPro" className="logo-image-sm" />
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
            <span className="progress-label">{t('test.answeredRemaining', { answered: answeredCount, remaining: unanswered })}</span>
          </div>
        </div>

        <div className="topbar-right">
          <button
            className={`btn-cheat-toggle ${showCheat ? 'active' : ''}`}
            onClick={() => setShowCheat(!showCheat)}
            title={t('test.toggleAnswersTitle')}
          >
            {showCheat ? '🙈' : '👁'}
          </button>
          <Timer timeLeft={timeLeft} totalTime={totalTime} />
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowSubmitConfirm(true)}
          >
            {t('test.finish')}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={resetTest}>
            {t('test.reset')}
          </button>
        </div>
      </header>

      {/* Confirm modal */}
      {showSubmitConfirm && (
        <div className="modal-backdrop" onClick={() => setShowSubmitConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{t('test.submitConfirmTitle')}</div>
            <div className="modal-body">
              {unanswered > 0 && (
                <div className="modal-warn">
                  {t('test.unansweredWarning', { count: unanswered })}
                </div>
              )}
              <p>{t('test.irreversible')}</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowSubmitConfirm(false)}>{t('test.cancel')}</button>
              <button className="btn btn-primary" onClick={() => { setShowSubmitConfirm(false); handleSubmit(); }}>
                {t('test.confirm')}
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
            key={q.id}
            question={q}
            selectedKeys={answers[q.id] || []}
            correctKeys={correctAnswers[q.id] || []}
            onToggle={toggleAnswer}
            onSetCorrect={setCorrectForQuestion}
            showCheat={showCheat}
            reviewMode={reviewMode}
            questionScore={score}
          />

          {/* Prev / Next */}
          <div className="question-nav-btns">
            <button
              className="btn btn-ghost"
              disabled={currentIdx === 0}
              onClick={() => goToQuestion(currentIdx - 1)}
            >
              {t('test.previous')}
            </button>
            <span className="nav-indicator">{currentIdx + 1} / {questions.length}</span>
            {currentIdx < questions.length - 1 ? (
              <button className="btn btn-secondary" onClick={() => goToQuestion(currentIdx + 1)}>
                {t('test.next')}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowSubmitConfirm(true)}>
                {t('test.finishExam')}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
