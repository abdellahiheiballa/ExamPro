import { useState, useEffect, useCallback, useRef } from 'react';
import { parseQuestions, computeQuestionScore } from '../utils/parser';
import { createExamSession, saveExamSession, logExamEvent } from '../api';
import { t } from '../i18n';

const STORAGE_KEY = 'exam_session_v2';

export function useExam(token) {
  const [phase, setPhase] = useState('start'); // start | test | results
  const [rawText, setRawText] = useState('');
  const [examId, setExamId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
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
  const warningLoggedRef = useRef(false);
  const visibilityRef = useRef(false);

  // Restore session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.phase === 'test' || s.phase === 'results') {
          setPhase(s.phase);
          setExamId(s.examId || null);
          setSessionId(s.sessionId || null);
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
      phase, examId, sessionId, questions, answers, correctAnswers,
      currentIdx, timeLeft, totalTime, startedAt, finishedAt
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [phase, examId, sessionId, questions, answers, correctAnswers, currentIdx, timeLeft, totalTime, startedAt, finishedAt]);

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

  const logEvent = useCallback(async (eventType, payload = {}) => {
    if (!token || !sessionId) return;
    try {
      await logExamEvent({ token, sessionId, eventType, payload });
    } catch (err) {
      console.error('Failed to log exam event', err);
    }
  }, [token, sessionId]);

  const saveCurrentSession = useCallback(async (payload = {}) => {
    if (!token || !sessionId) return;
    try {
      await saveExamSession({
        token,
        sessionId,
        timeLeft: payload.timeLeft ?? timeLeft,
        currentQuestion: payload.currentQuestion ?? currentIdx,
        answers: payload.answers ?? answers,
        status: payload.status,
      });
      if (payload.status === 'completed') {
        await logEvent('submission', { completedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.error('Failed to save exam session', err);
    }
  }, [token, sessionId, timeLeft, currentIdx, answers, logEvent]);

  const startTest = useCallback(async (newExamId, text, durationMinutes = 90) => {
    const parsed = parseQuestions(text);
    if (!parsed.length) return { error: t('start.error.noQuestions') };
    const secs = durationMinutes * 60;
    let createdSessionId = null;

    if (token) {
      try {
        const response = await createExamSession({
          token,
          examId: newExamId,
          timeLeft: secs,
          currentQuestion: 0,
          answers: {},
        });
        createdSessionId = response.session?.id || null;
      } catch (err) {
        console.error('Unable to create exam session on server:', err);
      }
    }

    setExamId(newExamId);
    setSessionId(createdSessionId);
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
    await logEvent('exam_start', { examId: newExamId, startedAt: new Date().toISOString() });
    return {};
  }, [token, logEvent]);

  const toggleAnswer = useCallback((questionId, optionKey) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      const exists = current.includes(optionKey);
      const next = {
        ...prev,
        [questionId]: exists
          ? current.filter(k => k !== optionKey)
          : [...current, optionKey],
      };
      saveCurrentSession({ answers: next, currentQuestion: currentIdx, timeLeft });
      void logEvent('answer_changed', { questionId, optionKey, answered: next[questionId] || [] });
      return next;
    });
  }, [currentIdx, saveCurrentSession, timeLeft, logEvent]);

  const setCorrectForQuestion = useCallback((questionId, keys) => {
    setCorrectAnswers(prev => ({ ...prev, [questionId]: keys }));
  }, []);

  const handleSubmit = useCallback(async () => {
    clearInterval(timerRef.current);
    setFinishedAt(Date.now());
    setPhase('results');
    await saveCurrentSession({ status: 'completed', timeLeft: 0, currentQuestion: currentIdx });
    await logEvent('submission', { completedAt: new Date().toISOString() });
  }, [currentIdx, saveCurrentSession, logEvent]);

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
    void logEvent('question_viewed', { questionIndex: idx });
  }, [questions.length, logEvent]);

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

  useEffect(() => {
    if (phase !== 'test' || !token || !sessionId) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && !visibilityRef.current) {
        visibilityRef.current = true;
        void logEvent('tab_blur', { visibilityState: document.visibilityState });
      } else if (document.visibilityState === 'visible' && visibilityRef.current) {
        visibilityRef.current = false;
        void logEvent('reconnect', { visibilityState: document.visibilityState });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', () => {
      void logEvent('logout', { reason: 'page_close' });
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', () => {
        void logEvent('logout', { reason: 'page_close' });
      });
    };
  }, [phase, token, sessionId, logEvent]);

  useEffect(() => {
    if (phase !== 'test' || !token || !sessionId) return;
    if (timeLeft <= 0) return;
    if (warningLoggedRef.current) return;
    if (timeLeft <= 60) {
      warningLoggedRef.current = true;
      void logEvent('timer_warning', { timeLeft });
    }
  }, [phase, sessionId, timeLeft, token, logEvent]);

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
