import { query } from './src/db.js';

const queries = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE classes ADD COLUMN IF NOT EXISTS department TEXT`,
  `ALTER TABLE classes ADD COLUMN IF NOT EXISTS level TEXT`,
  `ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL`,
  `ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS marks NUMERIC NOT NULL DEFAULT 1`,
  `ALTER TABLE exams ADD COLUMN IF NOT EXISTS randomize_options BOOLEAN NOT NULL DEFAULT FALSE`,
  `CREATE TABLE IF NOT EXISTS exam_assignments (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_order INTEGER[] NOT NULL,
    option_order JSONB,
    UNIQUE (exam_id, student_id)
  )`,
  `CREATE TABLE IF NOT EXISTS exam_incidents (
    id SERIAL PRIMARY KEY,
    exam_session_id INTEGER REFERENCES exam_sessions(id) ON DELETE CASCADE,
    incident_type TEXT NOT NULL,
    detail JSONB,
    reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS exam_stats_cache (
    exam_id INTEGER PRIMARY KEY REFERENCES exams(id) ON DELETE CASCADE,
    participants INTEGER,
    average_score NUMERIC,
    average_percentage NUMERIC,
    passed_count INTEGER,
    failed_count INTEGER,
    hardest_question_id INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  )`,
];

for (const q of queries) {
  console.log('Running:', q.split('\n')[0]);
  await query(q);
}

console.log('Migration v2 complete');
