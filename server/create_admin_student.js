import pg from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:2026@localhost:5432/exampro';
const url = new URL(DATABASE_URL);
const dbName = url.pathname.slice(1) || 'exampro';
const rootUrl = new URL(DATABASE_URL);
rootUrl.pathname = '/postgres';

async function run() {
  const rootClient = new pg.Client({ connectionString: rootUrl.toString() });
  await rootClient.connect();
  try {
    await rootClient.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database ${dbName} created.`);
  } catch (err) {
    if (err.code === '42P04') {
      console.log(`Database ${dbName} already exists.`);
    } else {
      throw err;
    }
  } finally {
    await rootClient.end();
  }

  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const schemaPath = path.resolve('./src/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('Schema created or already exists.');

    const users = [
      { username: 'admin', password: 'admin123', studentId: null, role: 'admin' },
      { username: 'student', password: 'student123', studentId: 'student001', role: 'student' },
    ];

    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);
      await client.query(
        `INSERT INTO users (username, password_hash, student_id, role) VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, student_id = EXCLUDED.student_id, role = EXCLUDED.role`,
        [user.username, hash, user.studentId, user.role]
      );
      console.log(`User ${user.username} (${user.role}) created or updated.`);
    }

    console.log('\nLogin credentials:');
    console.log('Admin: username=admin password=admin123');
    console.log('Student: username=student password=student123 studentId=student001');
  } finally {
    await client.end();
  }
}

run().catch(err => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
