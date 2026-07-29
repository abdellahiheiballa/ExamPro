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
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      studentId: user.student_id,
      mustChangePassword: user.must_change_password || false,
    },
  });
});

app.post('/api/auth/register', requireAdmin, async (req, res) => {
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
  const result = await query('SELECT id, username, student_id, role, is_active, department, national_id, email, phone, photo_url, created_at FROM users ORDER BY created_at DESC');
  res.json({ users: result.rows });
});

app.post('/api/admin/users/bulk-import', requireAdmin, async (req, res) => {
  const { csv } = req.body;
  if (!csv || !csv.trim()) return res.status(400).json({ error: 'CSV content is required' });

  const rows = csv.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return res.status(400).json({ error: 'CSV must include headers and at least one row' });

  const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
  const created = [];

  for (let i = 1; i < rows.length; i += 1) {
    const values = rows[i].split(',').map(v => v.trim());
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
    if (!row.username || !row.password) continue;
    const user = await createUser({
      username: row.username,
      password: row.password,
      studentId: row.studentid || row.student_id || null,
      role: row.role || 'student',
      department: row.department || null,
      isActive: row.isactive !== 'false',
      nationalId: row.nationalid || row.national_id || null,
      email: row.email || null,
      phone: row.phone || null,
      photoUrl: row.photourl || row.photo_url || null,
    });
    created.push(user);
  }

  res.json({ created, count: created.length });
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { username, password, studentId, role, department, isActive, nationalId, email, phone, photoUrl } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'Missing required user fields' });
  try {
    const user = await createUser({ username, password, studentId, role, department, isActive, nationalId, email, phone, photoUrl });
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const { username, studentId, role, department, isActive, nationalId, email, phone, photoUrl } = req.body;
  const result = await query(
    'UPDATE users SET username = COALESCE($1, username), student_id = COALESCE($2, student_id), role = COALESCE($3, role), department = COALESCE($4, department), is_active = COALESCE($5, is_active), national_id = COALESCE($6, national_id), email = COALESCE($7, email), phone = COALESCE($8, phone), photo_url = COALESCE($9, photo_url) WHERE id = $10 RETURNING id, username, student_id, role, is_active, department, national_id, email, phone, photo_url',
    [username, studentId, role, department, isActive, nationalId, email, phone, photoUrl, userId]
  );
  res.json({ user: result.rows[0] });
});

app.post('/api/admin/users/:userId/reset-password', requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
  const password_hash = await bcrypt.hash(tempPassword, 10);
  const result = await query(
    'UPDATE users SET password_hash = $1, must_change_password = true WHERE id = $2 RETURNING id, username, role',
    [password_hash, userId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
  res.json({ user: result.rows[0], temporaryPassword: tempPassword });
});

app.get('/api/admin/questions', requireAdmin, async (req, res) => {
  const result = await query('SELECT q.*, u.username AS author FROM questions q LEFT JOIN users u ON q.author_id = u.id ORDER BY q.created_at DESC');
  res.json({ questions: result.rows });
});

app.post('/api/admin/questions', requireAdmin, async (req, res) => {
  const { text, options, correctKeys, marks, difficulty, topic, explanation, questionType, timeEstimate, tags, category, attachments } = req.body;
  if (!text) return res.status(400).json({ error: 'Question text is required' });
  const isEssay = (questionType || 'multiple_choice') === 'essay';
  if (!isEssay) {
    if (!options || typeof options !== 'object' || Array.isArray(options) || Object.keys(options).length === 0) {
      return res.status(400).json({ error: 'Question options must be provided for non-essay questions' });
    }
    if (!correctKeys || !Array.isArray(correctKeys) || correctKeys.length === 0) {
      return res.status(400).json({ error: 'Correct answer keys are required for non-essay questions' });
    }
  }
  const result = await query(
    'INSERT INTO questions (author_id, text, options, correct_keys, marks, difficulty, topic, explanation, question_type, time_estimate, tags, category, attachments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
    [req.user.id, text, options || {}, correctKeys || [], marks || 1, difficulty || null, topic || null, explanation || null, questionType || 'multiple_choice', timeEstimate || null, tags || [], category || null, attachments || []]
  );
  res.json({ question: result.rows[0] });
});

app.patch('/api/admin/questions/:questionId', requireAdmin, async (req, res) => {
  const { questionId } = req.params;
  const { text, options, correctKeys, marks, difficulty, topic, explanation, questionType, timeEstimate, tags, category, attachments } = req.body;
  const result = await query(
    'UPDATE questions SET text = COALESCE($1, text), options = COALESCE($2, options), correct_keys = COALESCE($3, correct_keys), marks = COALESCE($4, marks), difficulty = COALESCE($5, difficulty), topic = COALESCE($6, topic), explanation = COALESCE($7, explanation), question_type = COALESCE($8, question_type), time_estimate = COALESCE($9, time_estimate), tags = COALESCE($10, tags), category = COALESCE($11, category), attachments = COALESCE($12, attachments) WHERE id = $13 RETURNING *',
    [text, options, correctKeys, marks, difficulty, topic, explanation, questionType, timeEstimate, tags, category, attachments, questionId]
  );
  res.json({ question: result.rows[0] });
});

app.post('/api/admin/assign-student', requireAdmin, async (req, res) => {
  const { classId, studentId } = req.body;
  const result = await query('INSERT INTO class_members (class_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *', [classId, studentId, 'student']);
  res.json({ assigned: result.rows[0] });
});

app.get('/api/admin/classes/:classId/members', requireAdmin, async (req, res) => {
  const { classId } = req.params;
  const result = await query(
    `SELECT u.id, u.username, u.student_id
     FROM class_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.class_id = $1 AND cm.role = 'student'`,
    [classId]
  );
  res.json({ members: result.rows });
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

app.get('/api/admin/monitoring/active-sessions', requireAdmin, async (req, res) => {
  const sessions = await query(
    `SELECT s.id, s.status, s.time_left, s.current_question, s.auto_saved_at, u.username AS student_name, e.title AS exam_title
     FROM exam_sessions s
     JOIN users u ON u.id = s.student_id
     JOIN exams e ON e.id = s.exam_id
     WHERE s.status IN ('running', 'submitted', 'paused')
     ORDER BY s.created_at DESC`
  );

  const rows = sessions.rows.map((session) => {
    const autoSavedAt = session.auto_saved_at ? new Date(session.auto_saved_at).getTime() : 0;
    const now = Date.now();
    const isOnline = autoSavedAt && now - autoSavedAt < 180000;
    const progress = session.current_question != null && session.current_question > 0 ? Math.min(100, Math.round((session.current_question / 20) * 100)) : 0;
    return { ...session, status: isOnline ? 'online' : 'offline', progress };
  });

  res.json({ sessions: rows });
});

app.get('/api/admin/exam-sessions/:sessionId/logs', requireAdmin, async (req, res) => {
  const { sessionId } = req.params;
  const logs = await query('SELECT * FROM exam_logs WHERE exam_session_id = $1 ORDER BY created_at DESC', [sessionId]);
  const incidents = await query('SELECT * FROM reports WHERE exam_session_id = $1 ORDER BY created_at DESC', [sessionId]);
  res.json({ logs: logs.rows, incidents: incidents.rows });
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

  const examCheck = await query(
    `SELECT e.id FROM exams e
     JOIN class_members cm ON cm.class_id = e.class_id
     WHERE e.id = $1 AND cm.user_id = $2 AND cm.role = 'student'`,
    [examId, req.user.id]
  );
  if (!examCheck.rows.length) {
    return res.status(403).json({ error: 'Not authorized for this exam' });
  }

  const result = await query(
    'INSERT INTO exam_sessions (exam_id, student_id, started_at, status, current_question, time_left, answers, auto_saved_at) VALUES ($1, $2, now(), $3, $4, $5, $6, now()) RETURNING *',
    [examId, req.user.id, 'running', currentQuestion, timeLeft, answers]
  );
  res.json({ session: result.rows[0] });
});

app.patch('/api/exam-sessions/:sessionId', requireAuth, async (req, res) => {
  const { sessionId } = req.params;
  const { timeLeft, currentQuestion, answers, status } = req.body;

  const sessionOwner = await query('SELECT student_id FROM exam_sessions WHERE id = $1', [sessionId]);
  if (!sessionOwner.rows.length) return res.status(404).json({ error: 'Session not found' });
  if (sessionOwner.rows[0].student_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to update this session' });
  }

  const result = await query(
    'UPDATE exam_sessions SET time_left = $1, current_question = $2, answers = $3, auto_saved_at = now(), status = COALESCE($4, status) WHERE id = $5 RETURNING *',
    [timeLeft, currentQuestion, answers, status, sessionId]
  );
  res.json({ session: result.rows[0] });
});

app.patch('/api/auth/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }

  const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!userResult.rows.length) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const password_hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2', [password_hash, req.user.id]);
  res.json({ changed: true });
});

app.post('/api/exam-sessions/:sessionId/log', requireAuth, async (req, res) => {
  const { sessionId } = req.params;
  const { eventType, payload } = req.body;
  const result = await query('INSERT INTO exam_logs (exam_session_id, event_type, payload) VALUES ($1, $2, $3) RETURNING *', [sessionId, eventType, payload]);
  res.json({ log: result.rows[0] });
});

app.get('/api/admin/reports', requireAdmin, async (req, res) => {
  const sessions = await query('SELECT score, percentage, passed, status FROM exam_sessions');
  const reports = await query('SELECT * FROM reports ORDER BY created_at DESC');
  const completed = sessions.rows.filter((session) => session.status === 'submitted' || session.status === 'terminated');
  const passed = completed.filter((session) => session.passed);
  const failed = completed.filter((session) => !session.passed && session.passed !== null);
  const averageScore = completed.length ? completed.reduce((sum, session) => sum + Number(session.score || 0), 0) / completed.length : 0;
  const averagePercentage = completed.length ? completed.reduce((sum, session) => sum + Number(session.percentage || 0), 0) / completed.length : 0;

  res.json({
    summary: {
      totalSessions: sessions.rows.length,
      completedSessions: completed.length,
      passedCount: passed.length,
      failedCount: failed.length,
      passRate: completed.length ? (passed.length / completed.length) * 100 : 0,
      averageScore,
      averagePercentage,
    },
    attendance: {
      total: sessions.rows.length,
      completed: completed.length,
      pending: sessions.rows.length - completed.length,
    },
    incidents: reports.rows,
    sessions: sessions.rows,
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
