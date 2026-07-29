const API_BASE = import.meta.env.VITE_API_BASE ?? '';

async function request(path, options = {}) {
  const baseUrl = API_BASE || '';
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || 'Request failed');
  }
  return data;
}

export async function login({ username, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchAdminUsers({ token }) {
  return request('/api/admin/users', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createAdminUser({ token, username, password, studentId, role, department, isActive, nationalId, email, phone, photoUrl }) {
  return request('/api/admin/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ username, password, studentId, role, department, isActive, nationalId, email, phone, photoUrl }),
  });
}

export async function updateAdminUser({ token, userId, username, studentId, role, department, isActive, nationalId, email, phone, photoUrl }) {
  return request(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ username, studentId, role, department, isActive, nationalId, email, phone, photoUrl }),
  });
}

export async function importAdminUsers({ token, csv }) {
  return request('/api/admin/users/bulk-import', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ csv }),
  });
}

export async function resetAdminUserPassword({ token, userId }) {
  return request(`/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function changePassword({ token, currentPassword, newPassword }) {
  return request('/api/auth/change-password', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function fetchAdminQuestions({ token }) {
  return request('/api/admin/questions', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createAdminQuestion({ token, text, options, correctKeys, marks, difficulty, topic, explanation, questionType, timeEstimate, tags, category, attachments }) {
  return request('/api/admin/questions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, options, correctKeys, marks, difficulty, topic, explanation, questionType, timeEstimate, tags, category, attachments }),
  });
}

export async function fetchStudentExams({ token }) {
  return request('/api/student/exams', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchExamDetails({ token, examId }) {
  return request(`/api/exams/${examId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createExam({ token, title, description, classId, scheduledAt, durationMinutes, status, passingScore, maxScore, questionCount, randomize, examText, instructions }) {
  return request('/api/admin/exams', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, description, classId, scheduledAt, durationMinutes, status, passingScore, maxScore, questionCount, randomize, examText, instructions }),
  });
}

export async function createClass({ token, name, description }) {
  return request('/api/admin/classes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, description }),
  });
}

export async function assignStudent({ token, classId, studentId }) {
  return request('/api/admin/assign-student', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ classId, studentId }),
  });
}

export async function fetchAdminExams({ token }) {
  return request('/api/admin/exams', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchAdminClasses({ token }) {
  return request('/api/admin/classes', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchClassMembers({ token, classId }) {
  return request(`/api/admin/classes/${classId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchExamSessions({ token, examId }) {
  return request(`/api/exams/${examId}/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchExamSessionLogs({ token, sessionId }) {
  return request(`/api/admin/exam-sessions/${sessionId}/logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createExamSession({ token, examId, timeLeft, currentQuestion, answers }) {
  return request('/api/exam-sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ examId, timeLeft, currentQuestion, answers }),
  });
}

export async function saveExamSession({ token, sessionId, timeLeft, currentQuestion, answers, status }) {
  return request(`/api/exam-sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ timeLeft, currentQuestion, answers, status }),
  });
}

export async function logExamEvent({ token, sessionId, eventType, payload }) {
  return request(`/api/exam-sessions/${sessionId}/log`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ eventType, payload }),
  });
}

export async function fetchActiveMonitoringSessions({ token }) {
  return request('/api/admin/monitoring/active-sessions', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchAdminReports({ token }) {
  return request('/api/admin/reports', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function terminateExamSession({ token, sessionId }) {
  return request(`/api/exam-sessions/${sessionId}/terminate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function pauseExamSession({ token, sessionId }) {
  return request(`/api/exam-sessions/${sessionId}/pause`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function resumeExamSession({ token, sessionId }) {
  return request(`/api/exam-sessions/${sessionId}/resume`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}
