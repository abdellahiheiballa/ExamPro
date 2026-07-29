import { query } from './src/db.js';

const queries = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'multiple_choice'`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS time_estimate INTEGER`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS attachments TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`,
];

for (const q of queries) {
  console.log('Running:', q.split('\n')[0]);
  await query(q);
}

console.log('Migration v3 complete');
