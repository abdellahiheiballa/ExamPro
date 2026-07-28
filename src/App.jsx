import React from 'react';
import { useExam } from './hooks/useExam';
import StartScreen from './components/StartScreen';
import TestInterface from './components/TestInterface';
import ResultsTable from './components/ResultsTable';

export default function App() {
  const exam = useExam();

  if (exam.phase === 'start') {
    return (
      <StartScreen
        onStart={(text, duration) => exam.startTest(text, duration)}
      />
    );
  }

  if (exam.phase === 'test') {
    return (
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
    );
  }

  if (exam.phase === 'results') {
    return (
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
    );
  }

  return null;
}
