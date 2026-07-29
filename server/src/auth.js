import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'exampro-secret';
const JWT_EXPIRY = '8h';

export async function createUser({ username, password, studentId, role = 'student', department = null, isActive = true, mustChangePassword = false, nationalId = null, email = null, phone = null, photoUrl = null }) {
  const password_hash = await bcrypt.hash(password, 10);
  const text = `INSERT INTO users (username, password_hash, student_id, role, department, is_active, must_change_password, national_id, email, phone, photo_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, username, student_id, role, department, is_active, must_change_password, national_id, email, phone, photo_url`;
  const values = [username, password_hash, studentId, role, department, isActive, mustChangePassword, nationalId, email, phone, photoUrl];
  const res = await query(text, values);
  return res.rows[0];
}

export async function verifyUser(identifier, password) {
  const res = await query(
    'SELECT id, username, password_hash, student_id, role, is_active, must_change_password FROM users WHERE (username = $1 OR student_id = $1) AND is_active = true',
    [identifier]
  );
  const user = res.rows[0];
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;
  return user;
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      studentId: user.student_id,
      mustChangePassword: user.must_change_password || false,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
