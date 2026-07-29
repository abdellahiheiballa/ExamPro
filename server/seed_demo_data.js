import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { query } from './src/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoUsers = [
  { username: 'admin', password: 'admin123', studentId: null, role: 'admin' },
  { username: 'student', password: 'student123', studentId: 'student001', role: 'student' },
  { username: 'student2', password: 'student123', studentId: 'student002', role: 'student' },
  { username: 'teacher', password: 'teacher123', studentId: null, role: 'teacher' },
];

const demoClasses = [
  { name: 'Class A - AI Engineering', description: 'Advanced AI and MLOps cohort' },
  { name: 'Class B - Data Science', description: 'Statistics and analytics practice' },
];

const demoExams = [
  {
    title: 'AI Fundamentals Quiz',
    description: 'Multiple-choice assessment for foundational AI concepts.',
    status: 'scheduled',
    durationMinutes: 45,
    passingScore: 60,
    maxScore: 100,
    questionCount: 2,
    examText: 'Question 1\nContext: You are evaluating an AI model.\nTask: Choose the best monitoring strategy.\na. Track accuracy only\nb. Monitor drift and performance over time\nc. Ignore retraining\nd. Disable logging\n\nQuestion 2\nContext: You need a robust ML pipeline.\nTask: Which option best improves reliability?\na. Manual deployment only\nb. Automated CI/CD and rollback strategy\nc. No tests\nd. Hard-coded thresholds',
    instructions: 'Answer all questions. Choose one option per question.'
  },
  {
    title: 'Case Study Review',
    description: 'Scenario-based review for business and ethics.',
    status: 'scheduled',
    durationMinutes: 60,
    passingScore: 70,
    maxScore: 100,
    questionCount: 2,
    examText: 'Question 1\nContext: A company deploys a facial recognition system.\nTask: Which risk should be addressed first?\na. Customer support response time\nb. Bias and privacy concerns\nc. Office lighting\nd. Website font size\n\nQuestion 2\nContext: A team is choosing a deployment strategy.\nTask: Which is the most responsible approach?\na. Deploy without documentation\nb. Use logging, human review, and rollback plans\nc. Hide failures from users\nd. Skip monitoring',
    instructions: 'Discuss the rationale in the written answers.'
  }
];

const demoQuestions = [
  {
    text: 'Which of the following best improves an ML system after deployment?',
    options: { a: 'A. Monitor drift and feedback', b: 'B. Disable alerts', c: 'C. Ignore data changes', d: 'D. Freeze the model permanently' },
    correctKeys: ['a'],
    marks: 2,
    difficulty: 'Medium',
    topic: 'MLOps',
    explanation: 'Continuous monitoring helps detect drift and performance degradation.',
    questionType: 'multiple_choice',
    timeEstimate: 5,
    tags: ['mlops', 'monitoring'],
    category: 'AI',
    attachments: []
  },
  {
    text: 'What is the most important ethical concern for a predictive system used in hiring?',
    options: { a: 'A. User interface color', b: 'B. Bias and fairness', c: 'C. File naming', d: 'D. Typography' },
    correctKeys: ['b'],
    marks: 3,
    difficulty: 'Hard',
    topic: 'Ethics',
    explanation: 'Fairness and bias mitigation are essential for responsible AI.',
    questionType: 'multiple_choice',
    timeEstimate: 6,
    tags: ['ethics', 'bias'],
    category: 'Governance',
    attachments: []
  },
  {
    text: 'Explain how you would handle an AI model that starts producing biased outputs in production.',
    options: {},
    correctKeys: [],
    marks: 5,
    difficulty: 'Hard',
    topic: 'Governance',
    explanation: 'A strong answer should describe monitoring, rollback, retraining, and audit processes.',
    questionType: 'essay',
    timeEstimate: 10,
    tags: ['essay', 'bias'],
    category: 'Governance',
    attachments: []
  }
];

async function seed() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      student_id TEXT UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      department TEXT,
      must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      national_id TEXT,
      email TEXT,
      phone TEXT,
      photo_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS class_members (
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
      PRIMARY KEY (class_id, user_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS exams (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      scheduled_at TIMESTAMP WITH TIME ZONE,
      start_time TIMESTAMP WITH TIME ZONE,
      end_time TIMESTAMP WITH TIME ZONE,
      duration_minutes INTEGER NOT NULL DEFAULT 90,
      passing_score NUMERIC NOT NULL DEFAULT 0,
      max_score NUMERIC NOT NULL DEFAULT 100,
      question_count INTEGER NOT NULL DEFAULT 0,
      randomize BOOLEAN NOT NULL DEFAULT FALSE,
      exam_text TEXT,
      instructions TEXT,
      status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed')) DEFAULT 'draft',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      text TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      marks NUMERIC NOT NULL DEFAULT 1,
      difficulty TEXT,
      topic TEXT,
      explanation TEXT,
      question_type TEXT NOT NULL DEFAULT 'multiple_choice',
      time_estimate INTEGER,
      tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      category TEXT,
      attachments TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS exam_sessions (
      id SERIAL PRIMARY KEY,
      exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      started_at TIMESTAMP WITH TIME ZONE,
      finished_at TIMESTAMP WITH TIME ZONE,
      status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'submitted', 'terminated')) DEFAULT 'pending',
      current_question INTEGER,
      time_left INTEGER,
      answers JSONB NOT NULL DEFAULT '{}'::JSONB,
      score NUMERIC,
      percentage NUMERIC,
      passed BOOLEAN,
      auto_saved_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS exam_logs (
      id SERIAL PRIMARY KEY,
      exam_session_id INTEGER REFERENCES exam_sessions(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      payload JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      exam_session_id INTEGER REFERENCES exam_sessions(id) ON DELETE CASCADE,
      issue_type TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )
  `);

  const adminId = await insertUser({ username: 'admin', password: 'admin123', role: 'admin' });
  const teacherId = await insertUser({ username: 'teacher', password: 'teacher123', role: 'teacher' });
  const studentId = await insertUser({ username: 'student', password: 'student123', studentId: 'student001', role: 'student' });
  const student2Id = await insertUser({ username: 'student2', password: 'student123', studentId: 'student002', role: 'student' });

  const classAId = await insertClass({ name: 'Class A - AI Engineering', description: 'Advanced AI and MLOps cohort', createdBy: adminId });
  const classBId = await insertClass({ name: 'Class B - Data Science', description: 'Statistics and analytics practice', createdBy: teacherId });

  await query('INSERT INTO class_members (class_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [classAId, studentId, 'student']);
  await query('INSERT INTO class_members (class_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [classAId, student2Id, 'student']);
  await query('INSERT INTO class_members (class_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [classBId, studentId, 'student']);

  const examAId = await insertExam({ title: 'AI Fundamentals Quiz', description: 'Multiple-choice assessment for foundational AI concepts.', classId: classAId, createdBy: teacherId, scheduledAt: new Date().toISOString(), durationMinutes: 45, status: 'scheduled', passingScore: 60, maxScore: 100, questionCount: 2, examText: demoExams[0].examText, instructions: demoExams[0].instructions });
  const examBId = await insertExam({ title: 'Case Study Review', description: 'Scenario-based review for business and ethics.', classId: classBId, createdBy: teacherId, scheduledAt: new Date().toISOString(), durationMinutes: 60, status: 'scheduled', passingScore: 70, maxScore: 100, questionCount: 2, examText: demoExams[1].examText, instructions: demoExams[1].instructions });

  const questionIds = [];
  for (const question of demoQuestions) {
    const questionId = await insertQuestion({ authorId: teacherId, ...question });
    questionIds.push(questionId);
  }

  await insertSession({ examId: examAId, studentId, status: 'submitted', score: 85, percentage: 85, passed: true, currentQuestion: 2, timeLeft: 0, answers: { 1: 'a', 2: 'b' } });
  await insertSession({ examId: examAId, studentId: student2Id, status: 'running', score: null, percentage: null, passed: null, currentQuestion: 1, timeLeft: 1200, answers: { 1: 'c' } });
  await insertSession({ examId: examBId, studentId, status: 'terminated', score: 55, percentage: 55, passed: false, currentQuestion: 2, timeLeft: 0, answers: { 1: 'b', 2: 'a' } });

  console.log('Demo data populated successfully.');
  console.log('Credentials: admin/admin123, teacher/teacher123, student/student123, student2/student123');
}

async function insertUser({ username, password, studentId = null, role }) {
  const hash = await bcrypt.hash(password, 10);
  const res = await query(
    `INSERT INTO users (username, password_hash, student_id, role) VALUES ($1, $2, $3, $4)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, student_id = EXCLUDED.student_id, role = EXCLUDED.role RETURNING id`,
    [username, hash, studentId, role]
  );
  return res.rows[0].id;
}

async function insertClass({ name, description, createdBy }) {
  const res = await query('INSERT INTO classes (name, description, created_by) VALUES ($1, $2, $3) RETURNING id', [name, description, createdBy]);
  return res.rows[0].id;
}

async function insertExam({ title, description, classId, createdBy, scheduledAt, durationMinutes, status, passingScore, maxScore, questionCount, examText, instructions }) {
  const res = await query(
    `INSERT INTO exams (title, description, class_id, created_by, scheduled_at, duration_minutes, status, passing_score, max_score, question_count, exam_text, instructions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
    [title, description, classId, createdBy, scheduledAt, durationMinutes, status, passingScore, maxScore, questionCount, examText, instructions]
  );
  return res.rows[0].id;
}

async function insertQuestion({ authorId, text, options, correctKeys, marks, difficulty, topic, explanation, questionType, timeEstimate, tags, category, attachments }) {
  const res = await query(
    `INSERT INTO questions (author_id, text, options, correct_keys, marks, difficulty, topic, explanation, question_type, time_estimate, tags, category, attachments)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
    [authorId, text, options, correctKeys, marks, difficulty, topic, explanation, questionType, timeEstimate, tags, category, attachments]
  );
  return res.rows[0].id;
}

async function insertSession({ examId, studentId, status, score, percentage, passed, currentQuestion, timeLeft, answers }) {
  await query(
    `INSERT INTO exam_sessions (exam_id, student_id, started_at, finished_at, status, current_question, time_left, answers, score, percentage, passed, auto_saved_at)
     VALUES ($1, $2, now(), now(), $3, $4, $5, $6, $7, $8, $9, now())`,
    [examId, studentId, status, currentQuestion, timeLeft, answers, score, percentage, passed]
  );
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
