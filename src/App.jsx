import React, { useEffect, useState } from 'react';
import { useExam } from './hooks/useExam';
import { getLocale, setLocale, t } from './i18n';
import StartScreen from './components/StartScreen';
import TestInterface from './components/TestInterface';
import ResultsTable from './components/ResultsTable';

export default function App() {
  const exam = useExam();
  const [locale, setLocaleState] = useState(getLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const handleLocaleChange = (newLocale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
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

      {exam.phase === 'start' && (
        <StartScreen
          onStart={(text, duration) => exam.startTest(text, duration)}
        />
      )}

      {exam.phase === 'test' && (
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
      )}

      {exam.phase === 'results' && (
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
      )}
    </div>
  );
}
