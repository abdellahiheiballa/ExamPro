import React from 'react';

function PageCard({ title, children }) {
  return (
    <section className="admin-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function OverviewPage({ classes, exams, users, questions, monitoringSessions, reports, t }) {
  return (
    <div className="admin-grid">
      <PageCard title={t.overviewSummary}>
        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <strong>{classes.length}</strong>
            <span>{t.classes}</span>
          </div>
          <div className="admin-stat-card">
            <strong>{exams.length}</strong>
            <span>{t.exams}</span>
          </div>
          <div className="admin-stat-card">
            <strong>{users.length}</strong>
            <span>{t.users}</span>
          </div>
          <div className="admin-stat-card">
            <strong>{questions.length}</strong>
            <span>{t.questions}</span>
          </div>
        </div>
      </PageCard>
      <PageCard title={t.monitoring}>
        {monitoringSessions.length === 0 ? <p>{t.noActiveSessions}</p> : (
          <ul>
            {monitoringSessions.slice(0, 4).map((session) => (
              <li key={session.id}>
                <strong>{session.student_name}</strong>
                <p>{session.exam_title} · {session.status}</p>
              </li>
            ))}
          </ul>
        )}
      </PageCard>
      <PageCard title={t.reports}>
        {reports ? (
          <>
            <p>{t.completedSessions}: {reports.summary?.completedSessions ?? 0}</p>
            <p>{t.passRate}: {reports.summary?.passRate?.toFixed(1) ?? 0}%</p>
          </>
        ) : <p>{t.noReports}</p>}
      </PageCard>
      <PageCard title={t.audit}>
        <p>{t.auditHint}</p>
      </PageCard>
    </div>
  );
}

export function ClassesPage({ classes, users, className, setClassName, classDescription, setClassDescription, assignSelection, setAssignSelection, classMembers, handleCreateClass, handleAssignStudent, t }) {
  return (
    <div className="admin-grid">
      <PageCard title={t.createClass}>
        <form onSubmit={handleCreateClass}>
          <label>
            {t.name}
            <input value={className} onChange={(e) => setClassName(e.target.value)} required />
          </label>
          <label>
            {t.description}
            <textarea value={classDescription} onChange={(e) => setClassDescription(e.target.value)} rows={4} />
          </label>
          <button className="btn btn-primary" type="submit">{t.createClassBtn}</button>
        </form>
      </PageCard>
      <PageCard title={t.classList}>
        {classes.length === 0 ? <p>{t.noClasses}</p> : (
          <ul>
            {classes.map((cls) => (
              <li key={cls.id}>
                <strong>{cls.name}</strong>
                <p>{cls.description || t.noDescription}</p>
                <label>
                  {t.assignStudent}
                  <select
                    value={assignSelection[cls.id] || ''}
                    onChange={(e) => setAssignSelection((prev) => ({ ...prev, [cls.id]: e.target.value }))}
                  >
                    <option value="">{t.selectStudent}</option>
                    {users.filter((u) => u.role === 'student').map((student) => (
                      <option key={student.id} value={student.id}>{student.username} ({student.student_id || t.noId})</option>
                    ))}
                  </select>
                </label>
                <button className="btn btn-secondary" type="button" disabled={!assignSelection[cls.id]} onClick={() => handleAssignStudent(cls.id, assignSelection[cls.id])}>
                  {t.assignBtn}
                </button>
                <div className="class-members">
                  <strong>{t.members}:</strong>
                  {classMembers[cls.id]?.length ? (
                    <ul>
                      {classMembers[cls.id].map((member) => (
                        <li key={member.id}>{member.username} ({member.student_id || t.noId})</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{t.noStudentsAssigned}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageCard>
    </div>
  );
}

export function ExamsPage({ classes, exams, examTitle, setExamTitle, examDescription, setExamDescription, examClassId, setExamClassId, examDate, setExamDate, examDuration, setExamDuration, examText, setExamText, instructions, setInstructions, handleCreateExam, t }) {
  return (
    <div className="admin-grid">
      <PageCard title={t.createExam}>
        <form onSubmit={handleCreateExam}>
          <label>
            {t.title}
            <input value={examTitle} onChange={(e) => setExamTitle(e.target.value)} required />
          </label>
          <label>
            {t.description}
            <textarea value={examDescription} onChange={(e) => setExamDescription(e.target.value)} rows={3} />
          </label>
          <label>
            {t.classLabel}
            <select value={examClassId} onChange={(e) => setExamClassId(e.target.value)} required>
              <option value="">{t.selectClass}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </label>
          <label>
            {t.scheduledDate}
            <input type="datetime-local" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </label>
          <label>
            {t.durationMinutes}
            <input type="number" min="10" value={examDuration} onChange={(e) => setExamDuration(Number(e.target.value))} required />
          </label>
          <label>
            {t.examText}
            <textarea value={examText} onChange={(e) => setExamText(e.target.value)} rows={6} placeholder={t.examTextPlaceholder} />
          </label>
          <label>
            {t.instructions}
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder={t.instructionsPlaceholder} />
          </label>
          <button className="btn btn-primary" type="submit">{t.createExamBtn}</button>
        </form>
      </PageCard>
      <PageCard title={t.examList}>
        {exams.length === 0 ? <p>{t.noExams}</p> : (
          <ul>
            {exams.map((exam) => (
              <li key={exam.id}>
                <strong>{exam.title}</strong>
                <p>{exam.description || t.noDescription}</p>
                <small>{t.duration}: {exam.duration_minutes} {t.minutes} · {t.status}: {exam.status}</small>
              </li>
            ))}
          </ul>
        )}
      </PageCard>
    </div>
  );
}

export function UsersPage({ users, userName, setUserName, userPassword, setUserPassword, userRole, setUserRole, userStudentId, setUserStudentId, userDepartment, setUserDepartment, userNationalId, setUserNationalId, userEmail, setUserEmail, userPhone, setUserPhone, userPhotoUrl, setUserPhotoUrl, userActive, setUserActive, bulkCsv, setBulkCsv, handleCreateUser, handleBulkImportUsers, handleResetPassword, t }) {
  return (
    <div className="admin-grid">
      <PageCard title={t.createUser}>
        <form onSubmit={handleCreateUser}>
          <label>
            {t.username}
            <input value={userName} onChange={(e) => setUserName(e.target.value)} required />
          </label>
          <label>
            {t.password}
            <input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required />
          </label>
          <label>
            {t.role}
            <select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
              <option value="student">{t.student}</option>
              <option value="teacher">{t.teacher}</option>
              <option value="admin">{t.admin}</option>
            </select>
          </label>
          <label>
            {t.studentId}
            <input value={userStudentId} onChange={(e) => setUserStudentId(e.target.value)} />
          </label>
          <label>
            {t.department}
            <input value={userDepartment} onChange={(e) => setUserDepartment(e.target.value)} />
          </label>
          <label>
            {t.nationalId}
            <input value={userNationalId} onChange={(e) => setUserNationalId(e.target.value)} />
          </label>
          <label>
            {t.email}
            <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
          </label>
          <label>
            {t.phone}
            <input value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
          </label>
          <label>
            {t.photoUrl}
            <input value={userPhotoUrl} onChange={(e) => setUserPhotoUrl(e.target.value)} />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={userActive} onChange={(e) => setUserActive(e.target.checked)} />
            {t.active}
          </label>
          <button className="btn btn-primary" type="submit">{t.createUserBtn}</button>
        </form>
      </PageCard>
      <PageCard title={t.userList}>
        {users.length === 0 ? <p>{t.noUsers}</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.username}</th>
                <th>{t.role}</th>
                <th>{t.studentId}</th>
                <th>{t.email}</th>
                <th>{t.active}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>{u.student_id || '-'}</td>
                  <td>{u.email || '-'}</td>
                  <td>{u.is_active ? t.yes : t.no}</td>
                  <td>
                    <button className="btn btn-secondary" type="button" onClick={() => handleResetPassword(u.id)}>
                      {t.resetPassword}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageCard>
      <PageCard title={t.bulkImport}>
        <form onSubmit={handleBulkImportUsers}>
          <label>
            {t.csv}
            <textarea value={bulkCsv} onChange={(e) => setBulkCsv(e.target.value)} rows={8} />
          </label>
          <button className="btn btn-primary" type="submit">{t.importUsers}</button>
        </form>
      </PageCard>
    </div>
  );
}

export function QuestionsPage({ questionText, setQuestionText, questionType, setQuestionType, questionOptions, setQuestionOptions, questionKeys, setQuestionKeys, questionMarks, setQuestionMarks, questionDifficulty, setQuestionDifficulty, questionTopic, setQuestionTopic, questionExplanation, setQuestionExplanation, questionTimeEstimate, setQuestionTimeEstimate, questionTags, setQuestionTags, questionCategory, setQuestionCategory, questionAttachments, setQuestionAttachments, questions, handleCreateQuestion, t }) {
  return (
    <div className="admin-grid">
      <PageCard title={t.questionBank}>
        <form onSubmit={handleCreateQuestion}>
          <label>
            {t.questionText}
            <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={4} required />
          </label>
          <label>
            {t.questionType}
            <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
              <option value="multiple_choice">{t.multipleChoice}</option>
              <option value="essay">{t.essay}</option>
            </select>
          </label>
          <label>
            {t.options}
            <textarea value={questionOptions} onChange={(e) => setQuestionOptions(e.target.value)} rows={5} disabled={questionType === 'essay'} />
          </label>
          <label>
            {t.correctKeys}
            <input value={questionKeys} onChange={(e) => setQuestionKeys(e.target.value)} disabled={questionType === 'essay'} />
          </label>
          <label>
            {t.marks}
            <input type="number" min="1" value={questionMarks} onChange={(e) => setQuestionMarks(Number(e.target.value))} />
          </label>
          <label>
            {t.difficulty}
            <select value={questionDifficulty} onChange={(e) => setQuestionDifficulty(e.target.value)}>
              <option value="Easy">{t.easy}</option>
              <option value="Medium">{t.medium}</option>
              <option value="Hard">{t.hard}</option>
            </select>
          </label>
          <label>
            {t.topic}
            <input value={questionTopic} onChange={(e) => setQuestionTopic(e.target.value)} />
          </label>
          <label>
            {t.explanation}
            <textarea value={questionExplanation} onChange={(e) => setQuestionExplanation(e.target.value)} rows={3} />
          </label>
          <label>
            {t.timeEstimate}
            <input value={questionTimeEstimate} onChange={(e) => setQuestionTimeEstimate(e.target.value)} />
          </label>
          <label>
            {t.tags}
            <input value={questionTags} onChange={(e) => setQuestionTags(e.target.value)} placeholder={t.tagsPlaceholder} />
          </label>
          <label>
            {t.category}
            <input value={questionCategory} onChange={(e) => setQuestionCategory(e.target.value)} />
          </label>
          <label>
            {t.attachments}
            <textarea value={questionAttachments} onChange={(e) => setQuestionAttachments(e.target.value)} rows={3} />
          </label>
          <button className="btn btn-primary" type="submit">{t.addQuestion}</button>
        </form>
      </PageCard>
      <PageCard title={t.questionList}>
        {questions.length === 0 ? <p>{t.noQuestions}</p> : (
          <ul>
            {questions.map((question) => (
              <li key={question.id}>
                <strong>{question.text}</strong>
                <p>{question.topic || t.general} · {question.question_type || 'multiple_choice'}</p>
              </li>
            ))}
          </ul>
        )}
      </PageCard>
    </div>
  );
}

export function MonitoringPage({ monitoringSessions, t }) {
  return (
    <PageCard title={t.monitoring}>
      {monitoringSessions.length === 0 ? <p>{t.noActiveSessions}</p> : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.student}</th>
              <th>{t.exam}</th>
              <th>{t.status}</th>
              <th>{t.timeLeft}</th>
              <th>{t.progress}</th>
            </tr>
          </thead>
          <tbody>
            {monitoringSessions.map((session) => (
              <tr key={session.id}>
                <td>{session.student_name}</td>
                <td>{session.exam_title}</td>
                <td>{session.status}</td>
                <td>{session.time_left ?? '-'}</td>
                <td>{session.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PageCard>
  );
}

export function ReportsPage({ reports, t }) {
  return (
    <PageCard title={t.reports}>
      {reports ? (
        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <strong>{reports.summary?.completedSessions ?? 0}</strong>
            <span>{t.completedSessions}</span>
          </div>
          <div className="admin-stat-card">
            <strong>{reports.summary?.passRate?.toFixed(1) ?? 0}%</strong>
            <span>{t.passRate}</span>
          </div>
          <div className="admin-stat-card">
            <strong>{reports.summary?.averageScore?.toFixed(1) ?? 0}</strong>
            <span>{t.averageScore}</span>
          </div>
          <div className="admin-stat-card">
            <strong>{reports.summary?.averagePercentage?.toFixed(1) ?? 0}%</strong>
            <span>{t.averagePercentage}</span>
          </div>
        </div>
      ) : <p>{t.noReports}</p>}
    </PageCard>
  );
}

export function AuditPage({ selectedSessionId, setSelectedSessionId, selectedSessionLogs, handleInspectSession, t }) {
  return (
    <PageCard title={t.audit}>
      <label>
        {t.sessionId}
        <input value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} />
      </label>
      <button className="btn btn-secondary" type="button" onClick={() => handleInspectSession(selectedSessionId)}>{t.loadSessionLogs}</button>
      {selectedSessionLogs ? (
        <div className="admin-list">
          <h3>{t.logs}</h3>
          <ul>
            {(selectedSessionLogs.logs || []).map((log) => (
              <li key={log.id}>{log.event_type} — {new Date(log.created_at).toLocaleString()}</li>
            ))}
          </ul>
          <h3>{t.incidents}</h3>
          <ul>
            {(selectedSessionLogs.incidents || []).map((incident) => (
              <li key={incident.id}>{incident.issue_type}</li>
            ))}
          </ul>
        </div>
      ) : <p>{t.auditHint}</p>}
    </PageCard>
  );
}
