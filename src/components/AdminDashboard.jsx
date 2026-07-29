import React, { useEffect, useState } from 'react';
import {
  createClass,
  createExam,
  fetchAdminClasses,
  fetchAdminExams,
  fetchAdminUsers,
  createAdminUser,
  resetAdminUserPassword,
  fetchAdminQuestions,
  createAdminQuestion,
  assignStudent,
} from '../api';
import './AdminDashboard.css';

export default function AdminDashboard({ token, user, onLogout }) {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examDuration, setExamDuration] = useState(90);
  const [examClassId, setExamClassId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examStartTime, setExamStartTime] = useState('');
  const [examEndTime, setExamEndTime] = useState('');
  const [passingScore, setPassingScore] = useState(50);
  const [maxScore, setMaxScore] = useState(100);
  const [questionCount, setQuestionCount] = useState(10);
  const [randomize, setRandomize] = useState(false);
  const [examText, setExamText] = useState('');
  const [instructions, setInstructions] = useState('');
  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('student');
  const [userStudentId, setUserStudentId] = useState('');
  const [userDepartment, setUserDepartment] = useState('');
  const [userActive, setUserActive] = useState(true);
  const [classMembers, setClassMembers] = useState({});
  const [assignSelection, setAssignSelection] = useState({});
  const [questionText, setQuestionText] = useState('');
  const [questionOptions, setQuestionOptions] = useState('a. Option A\nb. Option B\nc. Option C');
  const [questionKeys, setQuestionKeys] = useState('a');
  const [questionMarks, setQuestionMarks] = useState(1);
  const [questionDifficulty, setQuestionDifficulty] = useState('Medium');
  const [questionTopic, setQuestionTopic] = useState('General');
  const [questionExplanation, setQuestionExplanation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const [classData, examData, userData, questionData] = await Promise.all([
        fetchAdminClasses({ token }),
        fetchAdminExams({ token }),
        fetchAdminUsers({ token }),
        fetchAdminQuestions({ token }),
      ]);
      const classList = Array.isArray(classData?.classes) ? classData.classes : [];
      const examList = Array.isArray(examData?.exams) ? examData.exams : [];
      const userList = Array.isArray(userData?.users) ? userData.users : [];
      const questionList = Array.isArray(questionData?.questions) ? questionData.questions : [];
      setClasses(classList);
      setExams(examList);
      setUsers(userList);
      setQuestions(questionList);
      if (!examClassId && classList.length > 0) {
        setExamClassId(String(classList[0].id));
      }
      const membersByClass = {};
      await Promise.all(classList.map(async (cls) => {
        const res = await fetchClassMembers({ token, classId: cls.id });
        membersByClass[cls.id] = Array.isArray(res?.members) ? res.members : [];
      }));
      setClassMembers(membersByClass);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await createClass({ token, name: className, description: classDescription });
      setSuccess('Class created successfully.');
      setClassName('');
      setClassDescription('');
      setClasses(prev => [res.class, ...prev]);
      if (!examClassId) setExamClassId(String(res.class.id));
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await createExam({
        token,
        title: examTitle,
        description: examDescription,
        classId: examClassId,
        scheduledAt: examDate,
        durationMinutes: examDuration,
        status: 'scheduled',
        passingScore,
        maxScore,
        questionCount,
        randomize,
        examText,
        instructions,
      });
      setSuccess('Exam created successfully.');
      setExamTitle('');
      setExamDescription('');
      setExamDate('');
      setExamStartTime('');
      setExamEndTime('');
      setExamText('');
      setInstructions('');
      setExams(prev => Array.isArray(prev) ? [res.exam, ...prev] : [res.exam]);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await createAdminUser({
        token,
        username: userName,
        password: userPassword,
        studentId: userStudentId,
        role: userRole,
        department: userDepartment,
        isActive: userActive,
      });
      setSuccess('User created successfully.');
      setUserName('');
      setUserPassword('');
      setUserStudentId('');
      setUserDepartment('');
      setUserRole('student');
      setUserActive(true);
      setUsers(prev => Array.isArray(prev) ? [res.user, ...prev] : [res.user]);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      setError('');
      const res = await resetAdminUserPassword({ token, userId });
      setSuccess(`Password reset to ${res.temporaryPassword}. User must change password at next login.`);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const options = questionOptions
        .split('\n')
        .filter(Boolean)
        .reduce((acc, line) => {
          const [key, ...rest] = line.split('.');
          acc[key.trim()] = rest.join('.').trim();
          return acc;
        }, {});
      const correctKeys = questionKeys.split(',').map(k => k.trim()).filter(Boolean);

      const res = await createAdminQuestion({
        token,
        text: questionText,
        options,
        correctKeys,
        marks: Number(questionMarks) || 1,
        difficulty: questionDifficulty,
        topic: questionTopic,
        explanation: questionExplanation,
      });
      setSuccess('Question added to bank.');
      setQuestionText('');
      setQuestionOptions('a. Option A\nb. Option B\nc. Option C');
      setQuestionKeys('a');
      setQuestionMarks(1);
      setQuestionDifficulty('Medium');
      setQuestionTopic('General');
      setQuestionExplanation('');
      setQuestions(prev => [res.question, ...prev]);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleAssignStudent = async (classId, userId) => {
    try {
      setError('');
      await assignStudent({ token, classId, studentId: userId });
      setSuccess('Student assigned to class.');
      const res = await fetchClassMembers({ token, classId });
      setClassMembers((prev) => ({ ...prev, [classId]: Array.isArray(res?.members) ? res.members : [] }));
      setAssignSelection((prev) => ({ ...prev, [classId]: '' }));
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {user.username}. Use the controls below to manage classes and exams.</p>
        </div>
        <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <h2>Create Class</h2>
          <form onSubmit={handleCreateClass}>
            <label>
              Name
              <input value={className} onChange={(e) => setClassName(e.target.value)} required />
            </label>
            <label>
              Description
              <textarea value={classDescription} onChange={(e) => setClassDescription(e.target.value)} rows={4} />
            </label>
            <button className="btn btn-primary" type="submit">Create Class</button>
          </form>
        </section>

        <section className="admin-card">
          <h2>Create Exam</h2>
          <form onSubmit={handleCreateExam}>
            <label>
              Title
              <input value={examTitle} onChange={(e) => setExamTitle(e.target.value)} required />
            </label>
            <label>
              Description
              <textarea value={examDescription} onChange={(e) => setExamDescription(e.target.value)} rows={3} />
            </label>
            <label>
              Class
              <select value={examClassId} onChange={(e) => setExamClassId(e.target.value)} required>
                <option value="">Select class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </label>
            <label>
              Scheduled Date
              <input type="datetime-local" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </label>
            <label>
              Duration (minutes)
              <input type="number" min="10" value={examDuration} onChange={(e) => setExamDuration(Number(e.target.value))} required />
            </label>
            <label>
              Exam Text
              <textarea value={examText} onChange={(e) => setExamText(e.target.value)} rows={6} placeholder="Paste question text here..." />
            </label>
            <label>
              Instructions
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder="Exam instructions..." />
            </label>
            <button className="btn btn-primary" type="submit">Create Exam</button>
          </form>
        </section>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-grid">
        <section className="admin-card">
          <h2>Create User</h2>
          <form onSubmit={handleCreateUser}>
            <label>
              Username
              <input value={userName} onChange={(e) => setUserName(e.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required />
            </label>
            <label>
              Role
              <select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Student ID
              <input value={userStudentId} onChange={(e) => setUserStudentId(e.target.value)} />
            </label>
            <label>
              Department
              <input value={userDepartment} onChange={(e) => setUserDepartment(e.target.value)} />
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={userActive} onChange={(e) => setUserActive(e.target.checked)} />
              Active
            </label>
            <button className="btn btn-primary" type="submit">Create User</button>
          </form>
        </section>

        <section className="admin-card admin-list">
          <h3>Users</h3>
          {users.length === 0 ? <p>No users created yet.</p> : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Student ID</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.role}</td>
                    <td>{u.student_id || '-'}</td>
                    <td>{u.is_active ? 'Yes' : 'No'}</td>
                    <td>
                      <button className="btn btn-secondary" type="button" onClick={() => handleResetPassword(u.id)}>
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="admin-list-grid">
        <section className="admin-card admin-list">
          <h3>Classes</h3>
          {classes.length === 0 ? <p>No classes created yet.</p> : (
            <ul>
              {classes.map((cls) => (
                <li key={cls.id}>
                  <strong>{cls.name}</strong>
                  <p>{cls.description || 'No description'}</p>
                  <label>
                    Assign student
                    <select
                      value={assignSelection[cls.id] || ''}
                      onChange={(e) => setAssignSelection((prev) => ({ ...prev, [cls.id]: e.target.value }))}
                    >
                      <option value="">Select student</option>
                      {users.filter((u) => u.role === 'student').map((student) => (
                        <option key={student.id} value={student.id}>{student.username} ({student.student_id || 'no ID'})</option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={!assignSelection[cls.id]}
                    onClick={() => handleAssignStudent(cls.id, assignSelection[cls.id])}
                  >
                    Assign
                  </button>
                  <div className="class-members">
                    <strong>Members:</strong>
                    {classMembers[cls.id]?.length ? (
                      <ul>
                        {classMembers[cls.id].map((member) => (
                          <li key={member.id}>{member.username} ({member.student_id || 'no ID'})</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No students assigned.</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card admin-list">
          <h3>Exams</h3>
          {exams.length === 0 ? <p>No exams created yet.</p> : (
            <ul>
              {exams.map((exam) => (
                <li key={exam.id}>
                  <strong>{exam.title}</strong>
                  <p>{exam.description || 'No description'}</p>
                  <small>Duration: {exam.duration_minutes} min · Status: {exam.status}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
