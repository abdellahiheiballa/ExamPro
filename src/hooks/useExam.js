import { useState, useEffect, useCallback, useRef } from 'react';
import { parseQuestions, computeQuestionScore } from '../utils/parser';
import { t } from '../i18n';

const STORAGE_KEY = 'exam_session_v2';

export function useExam() {
  const [phase, setPhase] = useState('start'); // start | test | results
  const [rawText, setRawText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { qId: [selectedKeys] }
  const [correctAnswers, setCorrectAnswers] = useState({}); // { qId: [correctKeys] }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [totalTime, setTotalTime] = useState(90 * 60);
  const [startedAt, setStartedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);
  const [showCheat, setShowCheat] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [cheatRevealedFor, setCheatRevealedFor] = useState({}); // track what was revealed

  const timerRef = useRef(null);

  // Restore session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.phase === 'test' || s.phase === 'results') {
          setPhase(s.phase);
          setQuestions(s.questions || []);
          setAnswers(s.answers || {});
          setCorrectAnswers(s.correctAnswers || {});
          setCurrentIdx(s.currentIdx || 0);
          setTimeLeft(s.timeLeft ?? 90 * 60);
          setTotalTime(s.totalTime ?? 90 * 60);
          setStartedAt(s.startedAt || null);
          setFinishedAt(s.finishedAt || null);
        }
      }
    } catch {}
  }, []);

  // Persist session
  useEffect(() => {
    if (phase === 'start') return;
    const session = {
      phase, questions, answers, correctAnswers,
      currentIdx, timeLeft, totalTime, startedAt, finishedAt
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [phase, questions, answers, correctAnswers, currentIdx, timeLeft, totalTime, startedAt, finishedAt]);

  // Timer
  useEffect(() => {
    if (phase !== 'test') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startTest = useCallback((text, durationMinutes = 90) => {
    const parsed = parseQuestions(text);
    if (!parsed.length) return { error: t('start.error.noQuestions') };
    const secs = durationMinutes * 60;
    setQuestions(parsed);
    setAnswers({});
    setCorrectAnswers({});
    setCurrentIdx(0);
    setTimeLeft(secs);
    setTotalTime(secs);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setPhase('test');
    setReviewMode(false);
    return {};
  }, []);

  const toggleAnswer = useCallback((questionId, optionKey) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      const exists = current.includes(optionKey);
      return {
        ...prev,
        [questionId]: exists
          ? current.filter(k => k !== optionKey)
          : [...current, optionKey],
      };
    });
  }, []);

  const setCorrectForQuestion = useCallback((questionId, keys) => {
    setCorrectAnswers(prev => ({ ...prev, [questionId]: keys }));
  }, []);

  const handleSubmit = useCallback(() => {
    clearInterval(timerRef.current);
    setFinishedAt(Date.now());
    setPhase('results');
  }, []);

  const resetTest = useCallback(() => {
    clearInterval(timerRef.current);
    localStorage.removeItem(STORAGE_KEY);
    setPhase('start');
    setQuestions([]);
    setAnswers({});
    setCorrectAnswers({});
    setCurrentIdx(0);
    setTimeLeft(90 * 60);
    setStartedAt(null);
    setFinishedAt(null);
    setReviewMode(false);
    setShowCheat(false);
    setCheatRevealedFor({});
    setRawText('');
  }, []);

  const goToQuestion = useCallback((idx) => {
    setCurrentIdx(Math.max(0, Math.min(idx, questions.length - 1)));
  }, [questions.length]);

  // Scoring helpers
  const getQuestionScore = useCallback((questionId) => {
    const q = questions.find(q => q.id === questionId);
    if (!q) return { score: 0, max: 1 };
    const selected = answers[questionId] || [];
    const correct = correctAnswers[questionId] || [];
    return computeQuestionScore(q, selected, correct);
  }, [questions, answers, correctAnswers]);

  const getTotalScore = useCallback(() => {
    return questions.reduce((sum, q) => sum + getQuestionScore(q.id).score, 0);
  }, [questions, getQuestionScore]);

  const getQuestionStatus = useCallback((questionId) => {
    const correct = correctAnswers[questionId];
    if (!correct) return 'unanswered'; // no correct key set yet
    const { score } = getQuestionScore(questionId);
    const max = (correct.length || 1) * 0.20;
    if (score <= 0) return 'wrong';
    if (score >= Math.min(1, max)) return 'correct';
    return 'partial';
  }, [correctAnswers, getQuestionScore]);

  const revealCheat = useCallback((questionId) => {
    setCheatRevealedFor(prev => ({ ...prev, [questionId]: true }));
  }, []);

  const elapsedSeconds = startedAt
    ? (finishedAt ? Math.floor((finishedAt - startedAt) / 1000) : totalTime - timeLeft)
    : 0;

  return {
    phase, rawText, setRawText,
    questions, answers, correctAnswers,
    currentIdx, timeLeft, totalTime,
    startedAt, finishedAt, elapsedSeconds,
    showCheat, setShowCheat,
    reviewMode, setReviewMode,
    cheatRevealedFor, revealCheat,
    startTest, toggleAnswer,
    setCorrectForQuestion,
    handleSubmit, resetTest,
    goToQuestion,
    getQuestionScore, getTotalScore, getQuestionStatus,
  };
}
