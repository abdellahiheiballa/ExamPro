import { query } from './src/db.js';

const queries = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT`,
  `ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_text TEXT`,
  `ALTER TABLE exams ADD COLUMN IF NOT EXISTS instructions TEXT`,
  `ALTER TABLE exams ADD COLUMN IF NOT EXISTS passing_score NUMERIC NOT NULL DEFAULT 0`,
  `ALTER TABLE exams ADD COLUMN IF NOT EXISTS max_score NUMERIC NOT NULL DEFAULT 100`,
  `ALTER TABLE exams ADD COLUMN IF NOT EXISTS question_count INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE exams ADD COLUMN IF NOT EXISTS randomize BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE exams ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE`,
  `ALTER TABLE exams ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE`,
  `CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    marks NUMERIC NOT NULL DEFAULT 1,
    difficulty TEXT,
    topic TEXT,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  )`,
  `ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS score NUMERIC`,
  `ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS percentage NUMERIC`,
  `ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS passed BOOLEAN`,
];

for (const q of queries) {
  console.log('Running:', q.split('\n')[0]);
  await query(q);
}

console.log('Migration complete');
