import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import { query, getClient } from './db.js';
import { createUser, verifyUser, signToken, verifyToken } from './auth.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  req.user = payload;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  });
}

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

  const user = await verifyUser(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials or disabled account' });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, studentId: user.student_id } });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password, studentId, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'Missing required field' });
  try {
    const user = await createUser({ username, password, studentId, role });
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/exams', requireAdmin, async (req, res) => {
  const exams = await query('SELECT * FROM exams ORDER BY created_at DESC');
  res.json({ exams });
});

app.post('/api/admin/exams', requireAdmin, async (req, res) => {
  const { title, description, classId, scheduledAt, durationMinutes, status, passingScore, maxScore, questionCount, randomize, examText, instructions } = req.body;
  if (!title) return res.status(400).json({ error: 'Exam title is required' });
  if (!classId) return res.status(400).json({ error: 'Class is required for exam scheduling' });
  if (!durationMinutes) return res.status(400).json({ error: 'Duration is required' });
  const result = await query(
    'INSERT INTO exams (title, description, class_id, created_by, scheduled_at, duration_minutes, status, passing_score, max_score, question_count, randomize, exam_text, instructions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
    [title, description, classId, req.user.id, scheduledAt, durationMinutes, status || 'scheduled', passingScore || 0, maxScore || 100, questionCount || 0, randomize || false, examText || null, instructions || null]
  );
  res.json({ exam: result.rows[0] });
});

app.get('/api/admin/classes', requireAdmin, async (req, res) => {
  const result = await query('SELECT * FROM classes ORDER BY created_at DESC');
  res.json({ classes: result.rows });
});

app.post('/api/admin/classes', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Class name is required' });
  const result = await query('INSERT INTO classes (name, description, created_by) VALUES ($1, $2, $3) RETURNING *', [name, description, req.user.id]);
  res.json({ class: result.rows[0] });
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  const result = await query('SELECT id, username, student_id, role, is_active, department, created_at FROM users ORDER BY created_at DESC');
  res.json({ users: result.rows });
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { username, password, studentId, role, department, isActive } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'Missing required user fields' });
  try {
    const user = await createUser({ username, password, studentId, role, department, isActive });
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const { username, studentId, role, department, isActive } = req.body;
  const result = await query(
    'UPDATE users SET username = COALESCE($1, username), student_id = COALESCE($2, student_id), role = COALESCE($3, role), department = COALESCE($4, department), is_active = COALESCE($5, is_active) WHERE id = $6 RETURNING id, username, student_id, role, is_active, department',
    [username, studentId, role, department, isActive, userId]
  );
  res.json({ user: result.rows[0] });
});

app.post('/api/admin/users/:userId/reset-password', requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });
  const password_hash = await bcrypt.hash(password, 10);
  const result = await query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username, role', [password_hash, userId]);
  res.json({ user: result.rows[0] });
});

app.get('/api/admin/questions', requireAdmin, async (req, res) => {
  const result = await query('SELECT q.*, u.username AS author FROM questions q LEFT JOIN users u ON q.author_id = u.id ORDER BY q.created_at DESC');
  res.json({ questions: result.rows });
});

app.post('/api/admin/questions', requireAdmin, async (req, res) => {
  const { text, options, correctKeys, marks, difficulty, topic, explanation } = req.body;
  if (!text) return res.status(400).json({ error: 'Question text is required' });
  if (!options || typeof options !== 'object' || Array.isArray(options) || Object.keys(options).length === 0) {
    return res.status(400).json({ error: 'Question options must be provided' });
  }
  if (!correctKeys || !Array.isArray(correctKeys) || correctKeys.length === 0) {
    return res.status(400).json({ error: 'Correct answer keys are required' });
  }
  const result = await query(
    'INSERT INTO questions (author_id, text, options, correct_keys, marks, difficulty, topic, explanation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [req.user.id, text, options, correctKeys || [], marks || 1, difficulty || null, topic || null, explanation || null]
  );
  res.json({ question: result.rows[0] });
});

app.patch('/api/admin/questions/:questionId', requireAdmin, async (req, res) => {
  const { questionId } = req.params;
  const { text, options, correctKeys, marks, difficulty, topic, explanation } = req.body;
  const result = await query(
    'UPDATE questions SET text = COALESCE($1, text), options = COALESCE($2, options), correct_keys = COALESCE($3, correct_keys), marks = COALESCE($4, marks), difficulty = COALESCE($5, difficulty), topic = COALESCE($6, topic), explanation = COALESCE($7, explanation) WHERE id = $8 RETURNING *',
    [text, options, correctKeys, marks, difficulty, topic, explanation, questionId]
  );
  res.json({ question: result.rows[0] });
});

app.post('/api/admin/assign-student', requireAdmin, async (req, res) => {
  const { classId, studentId } = req.body;
  const result = await query('INSERT INTO class_members (class_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *', [classId, studentId, 'student']);
  res.json({ assigned: result.rows[0] });
});

app.get('/api/exams/:examId/sessions', requireAdmin, async (req, res) => {
  const { examId } = req.params;
  const sessions = await query('SELECT * FROM exam_sessions WHERE exam_id = $1 ORDER BY created_at DESC', [examId]);
  res.json({ sessions });
});

app.get('/api/student/exams', requireAuth, async (req, res) => {
  const exams = await query(
    `SELECT e.*, (now() BETWEEN e.scheduled_at AND e.scheduled_at + e.duration_minutes * interval '1 minute') AS is_active
     FROM exams e
     JOIN class_members cm ON cm.class_id = e.class_id
     WHERE cm.user_id = $1 AND cm.role = 'student'
     ORDER BY e.scheduled_at DESC`,
    [req.user.id]
  );
  res.json({ exams: exams.rows });
});

app.get('/api/exams/:examId', requireAuth, async (req, res) => {
  const { examId } = req.params;
  let result;
  if (req.user.role === 'admin') {
    result = await query('SELECT * FROM exams WHERE id = $1', [examId]);
  } else {
    result = await query(
      `SELECT e.*
       FROM exams e
       JOIN class_members cm ON cm.class_id = e.class_id
       WHERE e.id = $1 AND cm.user_id = $2 AND cm.role = 'student'`,
      [examId, req.user.id]
    );
  }
  if (!result.rows[0]) return res.status(404).json({ error: 'Exam not found' });
  res.json({ exam: result.rows[0] });
});

app.get('/api/admin/exam-sessions', requireAdmin, async (req, res) => {
  const sessions = await query(
    `SELECT s.*, u.username AS student_name, e.title AS exam_title
     FROM exam_sessions s
     JOIN users u ON u.id = s.student_id
     JOIN exams e ON e.id = s.exam_id
     ORDER BY s.created_at DESC`
  );
  res.json({ sessions: sessions.rows });
});

app.post('/api/exam-sessions/:sessionId/pause', requireAdmin, async (req, res) => {
  const { sessionId } = req.params;
  await query('UPDATE exam_sessions SET status = $1 WHERE id = $2', ['paused', sessionId]);
  res.json({ paused: true });
});

app.post('/api/exam-sessions/:sessionId/resume', requireAdmin, async (req, res) => {
  const { sessionId } = req.params;
  await query('UPDATE exam_sessions SET status = $1 WHERE id = $2', ['running', sessionId]);
  res.json({ resumed: true });
});

app.post('/api/exam-sessions/:sessionId/terminate', requireAdmin, async (req, res) => {
  const { sessionId } = req.params;
  await query('UPDATE exam_sessions SET status = $1, finished_at = now() WHERE id = $2', ['terminated', sessionId]);
  res.json({ terminated: true });
});

app.post('/api/exam-sessions', requireAuth, async (req, res) => {
  const { examId, timeLeft, currentQuestion, answers } = req.body;
  if (!examId) return res.status(400).json({ error: 'Exam ID is required' });
  if (timeLeft == null) return res.status(400).json({ error: 'Remaining time is required' });
  if (currentQuestion == null) return res.status(400).json({ error: 'Current question index is required' });
  if (answers == null) return res.status(400).json({ error: 'Answer payload is required' });
  const result = await query(
    'INSERT INTO exam_sessions (exam_id, student_id, started_at, status, current_question, time_left, answers, auto_saved_at) VALUES ($1, $2, now(), $3, $4, $5, $6, now()) RETURNING *',
    [examId, req.user.id, 'running', currentQuestion, timeLeft, answers]
  );
  res.json({ session: result.rows[0] });
});

app.patch('/api/exam-sessions/:sessionId', requireAuth, async (req, res) => {
  const { sessionId } = req.params;
  const { timeLeft, currentQuestion, answers, status } = req.body;
  const result = await query(
    'UPDATE exam_sessions SET time_left = $1, current_question = $2, answers = $3, auto_saved_at = now(), status = COALESCE($4, status) WHERE id = $5 RETURNING *',
    [timeLeft, currentQuestion, answers, status, sessionId]
  );
  res.json({ session: result.rows[0] });
});

app.post('/api/exam-sessions/:sessionId/log', requireAuth, async (req, res) => {
  const { sessionId } = req.params;
  const { eventType, payload } = req.body;
  const result = await query('INSERT INTO exam_logs (exam_session_id, event_type, payload) VALUES ($1, $2, $3) RETURNING *', [sessionId, eventType, payload]);
  res.json({ log: result.rows[0] });
});

app.get('/api/admin/reports', requireAdmin, async (req, res) => {
  const reports = await query('SELECT * FROM reports ORDER BY created_at DESC');
  res.json({ reports });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
