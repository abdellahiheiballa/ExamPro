import React, { useState } from 'react';
import { getLocale, t } from '../i18n';
import logo from '../assets/logo.jpeg';
import { formatFr, formatDateTime, formatDuration } from '../utils/parser';
import QuestionCard from './QuestionCard';
import QuestionNav from './QuestionNav';
import './ResultsTable.css';

function QuestionCell({ question, selected, correct, score }) {
  if (!correct || correct.length === 0) {
    // No correct key set — show selected count
    const isAnswered = selected.length > 0;
    return (
      <div className="qcell qcell-unknown">
        <span className="qcell-icon">—</span>
        <span className="qcell-score">?</span>
      </div>
    );
  }

  const s = score.score;
  const maxPossible = correct.length * 0.20;
  const isCorrect = s >= Math.min(1, maxPossible) && s > 0;
  const isPartial = s > 0 && !isCorrect;
  const isWrong = s <= 0;

  let cls = 'qcell ';
  let icon = '';
  if (isCorrect) { cls += 'qcell-correct'; icon = '✔'; }
  else if (isPartial) { cls += 'qcell-partial'; icon = '◑'; }
  else { cls += 'qcell-wrong'; icon = '✖'; }

  return (
    <div className={cls}>
      <span className="qcell-icon">{icon}</span>
      <span className="qcell-score">{formatFr(s)}</span>
    </div>
  );
}

export default function ResultsTable({
  questions,
  answers,
  correctAnswers,
  startedAt,
  finishedAt,
  elapsedSeconds,
  getQuestionScore,
  getQuestionStatus,
  resetTest,
  toggleAnswer,
  setCorrectForQuestion,
}) {
  const [reviewIdx, setReviewIdx] = useState(null);

  const totalScore = questions.reduce((s, q) => s + getQuestionScore(q.id).score, 0);
  const maxScore = questions.length;
  const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const scoreColor = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--orange)' : 'var(--red)';

  const answeredCount = Object.values(answers).filter(a => a.length > 0).length;

  // Compute per-question details for the row
  const questionDetails = questions.map(q => ({
    q,
    selected: answers[q.id] || [],
    correct: correctAnswers[q.id] || [],
    score: getQuestionScore(q.id),
  }));

  const correctCount = questionDetails.filter(d => {
    if (!d.correct.length) return false;
    return getQuestionStatus(d.q.id) === 'correct';
  }).length;

  const wrongCount = questionDetails.filter(d => {
    if (!d.correct.length) return false;
    return getQuestionStatus(d.q.id) === 'wrong';
  }).length;

  const partialCount = questionDetails.filter(d => {
    if (!d.correct.length) return false;
    return getQuestionStatus(d.q.id) === 'partial';
  }).length;

  const hasCorrectKeys = Object.keys(correctAnswers).length > 0;

  const locale = getLocale();

  return (
    <div className="results-screen">
      {/* Header */}
      <div className="results-topbar">
        <div className="logo-sm">
          <img src={logo} alt="ExamPro" className="logo-image-sm" />
          <span className="logo-text-sm">ExamPro</span>
        </div>
        <div className="results-title-block">
          <h1 className="results-heading">{t('results.heading')}</h1>
        </div>
        <div className="topbar-actions">
          {reviewIdx !== null && (
            <button className="btn btn-ghost btn-sm" onClick={() => setReviewIdx(null)}>
              {t('results.reviewBack')}
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={resetTest}>
            {t('results.newExam')}
          </button>
        </div>
      </div>

      {/* Score hero */}
      <div className="score-hero">
        <div className="score-hero-inner">
          <div className="score-circle" style={{ '--sc': scoreColor }}>
            <div className="score-circle-inner">
              <div className="score-big" style={{ color: scoreColor }}>
                {formatFr(totalScore)}
              </div>
              <div className="score-denom">/ {formatFr(maxScore, 2)}</div>
            </div>
          </div>

          <div className="score-stats">
            <div className="stat-card">
              <div className="stat-val" style={{ color: 'var(--green)' }}>{correctCount}</div>
              <div className="stat-label">{t('results.correct')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: 'var(--red)' }}>{wrongCount}</div>
              <div className="stat-label">{t('results.wrong')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: 'var(--orange)' }}>{partialCount}</div>
              <div className="stat-label">{t('results.partial')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">{answeredCount}</div>
              <div className="stat-label">{t('results.answered')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">{formatDuration(elapsedSeconds)}</div>
              <div className="stat-label">{t('results.time')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: scoreColor }}>{pct.toFixed(1)}%</div>
              <div className="stat-label">{t('results.successRate')}</div>
            </div>
          </div>
        </div>

        <div className="score-progress-bar">
          <div className="score-progress-fill" style={{ width: `${pct}%`, background: scoreColor }} />
        </div>
      </div>

      {reviewIdx !== null ? (
        /* Review mode */
        <div className="review-layout">
          <aside className="review-nav">
            <QuestionNav
              questions={questions}
              currentIdx={reviewIdx}
              answers={answers}
              correctAnswers={correctAnswers}
              getQuestionStatus={getQuestionStatus}
              onGo={setReviewIdx}
            />
          </aside>
          <div className="review-main">
            {questions[reviewIdx] && (
              <>
                <QuestionCard
                  question={questions[reviewIdx]}
                  selectedKeys={answers[questions[reviewIdx].id] || []}
                  correctKeys={correctAnswers[questions[reviewIdx].id] || []}
                  onToggle={() => {}}
                  onSetCorrect={() => {}}
                  showCheat={false}
                  reviewMode={true}
                  questionScore={getQuestionScore(questions[reviewIdx].id)}
                />
                <div className="review-nav-btns">
                  <button className="btn btn-ghost" disabled={reviewIdx === 0} onClick={() => setReviewIdx(reviewIdx - 1)} aria-label="Previous review item">
                    ← {t('test.previous')}
                  </button>
                  <span className="nav-indicator">{reviewIdx + 1} / {questions.length}</span>
                  <button className="btn btn-secondary" disabled={reviewIdx === questions.length - 1} onClick={() => setReviewIdx(reviewIdx + 1)} aria-label="Next review item">
                    {t('test.next')} →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Results table */
        <div className="results-body">
          {!hasCorrectKeys && (
            <div className="no-correct-notice">
              {t('results.noCorrectKeys')}
            </div>
          )}

          <div className="results-table-wrap">
            <table className="results-table">
              <thead>
                <tr>
                  <th className="th-status sticky-col">{t('results.tableStatus')}</th>
                  <th className="th-meta">{t('results.started')}</th>
                  <th className="th-meta">{t('results.finished')}</th>
                  <th className="th-meta">{t('results.duration')}</th>
                  <th className="th-score sticky-score">{t('results.scoreMax', { max: formatFr(maxScore) })}</th>
                  {questions.map(q => (
                    <th key={q.id} className="th-q">
                      <div className="th-q-inner">
                        <span>Q.{q.id}</span>
                        <span className="th-q-max">/1,00</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="results-row">
                  <td className="td-status sticky-col">
                    <span className="badge-termine">{t('results.completed')}</span>
                  </td>
                  <td className="td-meta">{formatDateTime(startedAt, locale)}</td>
                  <td className="td-meta">{formatDateTime(finishedAt, locale)}</td>
                  <td className="td-meta">{formatDuration(elapsedSeconds)}</td>
                  <td className="td-score sticky-score" style={{ color: scoreColor }}>
                    {formatFr(totalScore)}
                  </td>
                  {questionDetails.map(({ q, selected, correct, score }) => (
                    <td
                      key={q.id}
                      className="td-q"
                      onClick={() => setReviewIdx(questions.indexOf(q))}
                      title={t('results.reviewQuestionTooltip')}
                    >
                      <QuestionCell
                        question={q}
                        selected={selected}
                        correct={correct}
                        score={score}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="results-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setReviewIdx(0)}
            >
              📋 {t('results.reviewAll')}
            </button>
            <button className="btn btn-ghost" onClick={resetTest}>
              🔄 {t('results.newExam')}
            </button>
          </div>

          {/* Per-question score breakdown */}
          <div className="breakdown-section">
            <h2 className="breakdown-title">{t('results.breakdownTitle')}</h2>
            <div className="breakdown-grid">
              {questionDetails.map(({ q, selected, correct, score }) => {
                const status = getQuestionStatus(q.id);
                let cls = 'breakdown-card';
                if (status === 'correct') cls += ' bk-correct';
                else if (status === 'wrong') cls += ' bk-wrong';
                else if (status === 'partial') cls += ' bk-partial';
                else if (selected.length > 0) cls += ' bk-answered';

                const hasCorrect = correct.length > 0;

                return (
                  <div
                    key={q.id}
                    className={cls}
                    onClick={() => setReviewIdx(questions.indexOf(q))}
                  >
                    <div className="bk-header">
                      <span className="bk-num">Q.{q.id}</span>
                      {hasCorrect && (
                        <span className="bk-score" style={{
                          color: status === 'correct' ? 'var(--green)'
                            : status === 'wrong' ? 'var(--red)'
                            : status === 'partial' ? 'var(--orange)'
                            : 'var(--text3)'
                        }}>
                          {formatFr(score.score)}
                        </span>
                      )}
                    </div>
                    <div className="bk-selected">
                      {t('results.selectedLabel')} {selected.length > 0 ? selected.map(k => k.toUpperCase()).join(', ') : '—'}
                    </div>
                    {hasCorrect && (
                      <div className="bk-correct-keys">
                        {t('results.correctLabel')} {correct.map(k => k.toUpperCase()).join(', ')}
                      </div>
                    )}
                    <div className="bk-click-hint">{t('results.clickReviewHint')}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
