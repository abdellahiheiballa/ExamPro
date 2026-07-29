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
  fetchClassMembers,
  importAdminUsers,
  fetchExamSessionLogs,
  fetchActiveMonitoringSessions,
  fetchAdminReports,
} from '../api';
import {
  OverviewPage,
  ClassesPage,
  ExamsPage,
  UsersPage,
  QuestionsPage,
  MonitoringPage,
  ReportsPage,
  AuditPage,
} from './admin/AdminPages';
import './AdminDashboard.css';

const translations = {
  en: {
    dashboard: 'Admin Dashboard',
    welcome: 'Welcome, {name}. Manage the academy from this modular workspace.',
    overview: 'Overview',
    classes: 'Classes',
    exams: 'Exams',
    users: 'Users',
    questions: 'Questions',
    monitoring: 'Monitoring',
    reports: 'Reports',
    audit: 'Audit',
    overviewSummary: 'Overview',
    createClass: 'Create Class',
    createExam: 'Create Exam',
    createUser: 'Create User',
    questionBank: 'Question Bank',
    noActiveSessions: 'No active sessions.',
    noReports: 'No reports available yet.',
    completedSessions: 'Completed sessions',
    passRate: 'Pass rate',
    auditHint: 'Select a session to inspect its logs and incidents.',
    createClassBtn: 'Create Class',
    classList: 'Classes',
    createExamBtn: 'Create Exam',
    examList: 'Exams',
    createUserBtn: 'Create User',
    userList: 'Users',
    bulkImport: 'Bulk Import Candidates',
    questionList: 'Questions',
    addQuestion: 'Add Question',
    noClasses: 'No classes created yet.',
    noExams: 'No exams created yet.',
    noUsers: 'No users created yet.',
    noQuestions: 'No questions created yet.',
    noDescription: 'No description',
    name: 'Name',
    description: 'Description',
    title: 'Title',
    classLabel: 'Class',
    selectClass: 'Select class',
    scheduledDate: 'Scheduled Date',
    durationMinutes: 'Duration (minutes)',
    examText: 'Exam Text',
    examTextPlaceholder: 'Paste question text here...',
    instructions: 'Instructions',
    instructionsPlaceholder: 'Exam instructions...',
    username: 'Username',
    password: 'Password',
    role: 'Role',
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Admin',
    studentId: 'Student ID',
    department: 'Department',
    nationalId: 'National ID',
    email: 'Email',
    phone: 'Phone',
    photoUrl: 'Photo URL',
    active: 'Active',
    csv: 'CSV',
    importUsers: 'Import Users',
    resetPassword: 'Reset Password',
    questionText: 'Question text',
    questionType: 'Question type',
    multipleChoice: 'Multiple choice',
    essay: 'Essay',
    options: 'Options (one per line, e.g. a. Option A)',
    correctKeys: 'Correct keys (comma separated)',
    marks: 'Marks',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    topic: 'Topic',
    explanation: 'Explanation',
    timeEstimate: 'Time estimate (minutes)',
    tags: 'Tags',
    category: 'Category',
    attachments: 'Attachments (one per line)',
    tagsPlaceholder: 'comma separated',
    assignStudent: 'Assign student',
    selectStudent: 'Select student',
    assignBtn: 'Assign',
    members: 'Members',
    noStudentsAssigned: 'No students assigned.',
    noId: 'no ID',
    general: 'General',
    actions: 'Actions',
    yes: 'Yes',
    no: 'No',
    duration: 'Duration',
    minutes: 'min',
    status: 'Status',
    timeLeft: 'Time Left',
    progress: 'Progress',
    logs: 'Logs',
    incidents: 'Incidents',
    sessionId: 'Session ID',
    loadSessionLogs: 'Load session logs',
    logout: 'Logout',
  },
  ar: {
    dashboard: 'لوحة الإدارة',
    welcome: 'مرحبًا، {name}. أدر الأكاديمية من هذه المساحة المعيارية.',
    overview: 'نظرة عامة',
    classes: 'الصفوف',
    exams: 'الاختبارات',
    users: 'المستخدمون',
    questions: 'الأسئلة',
    monitoring: 'المراقبة',
    reports: 'التقارير',
    audit: 'السجل',
    overviewSummary: 'نظرة عامة',
    createClass: 'إنشاء صف',
    createExam: 'إنشاء اختبار',
    createUser: 'إنشاء مستخدم',
    questionBank: 'بنك الأسئلة',
    noActiveSessions: 'لا توجد جلسات نشطة.',
    noReports: 'لا توجد تقارير بعد.',
    completedSessions: 'الجلسات المكتملة',
    passRate: 'نسبة النجاح',
    auditHint: 'اختر جلسة لعرض السجلات والحوادث.',
    createClassBtn: 'إنشاء صف',
    classList: 'الصفوف',
    createExamBtn: 'إنشاء اختبار',
    examList: 'الاختبارات',
    createUserBtn: 'إنشاء مستخدم',
    userList: 'المستخدمون',
    bulkImport: 'استيراد المرشحين بالجملة',
    questionList: 'الأسئلة',
    addQuestion: 'إضافة سؤال',
    noClasses: 'لم يتم إنشاء صفوف بعد.',
    noExams: 'لم يتم إنشاء اختبارات بعد.',
    noUsers: 'لم يتم إنشاء مستخدمين بعد.',
    noQuestions: 'لم يتم إضافة أسئلة بعد.',
    noDescription: 'لا يوجد وصف',
    name: 'الاسم',
    description: 'الوصف',
    title: 'العنوان',
    classLabel: 'الصف',
    selectClass: 'اختر الصف',
    scheduledDate: 'التاريخ المجدول',
    durationMinutes: 'المدة (دقيقة)',
    examText: 'نص الاختبار',
    examTextPlaceholder: 'الصق نص السؤال هنا...',
    instructions: 'التعليمات',
    instructionsPlaceholder: 'تعليمات الاختبار...',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    role: 'الدور',
    student: 'طالب',
    teacher: 'معلم',
    admin: 'مسؤول',
    studentId: 'معرّف الطالب',
    department: 'القسم',
    nationalId: 'الهوية الوطنية',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    photoUrl: 'رابط الصورة',
    active: 'نشط',
    csv: 'CSV',
    importUsers: 'استيراد المستخدمين',
    resetPassword: 'إعادة تعيين كلمة المرور',
    questionText: 'نص السؤال',
    questionType: 'نوع السؤال',
    multipleChoice: 'اختيار من متعدد',
    essay: 'مقال',
    options: 'الخيارات (سطرًا واحدًا لكل خيار، مثال: a. الخيار أ)',
    correctKeys: 'المفاتيح الصحيحة (مفصولة بفواصل)',
    marks: 'الدرجات',
    difficulty: 'الصعوبة',
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    topic: 'الموضوع',
    explanation: 'التفسير',
    timeEstimate: 'الوقت المتوقع (دقيقة)',
    tags: 'الوسوم',
    category: 'الفئة',
    attachments: 'المرفقات (سطرًا واحدًا لكل مرفق)',
    tagsPlaceholder: 'مفصولة بفواصل',
    assignStudent: 'تعيين طالب',
    selectStudent: 'اختر طالبًا',
    assignBtn: 'تعيين',
    members: 'الأعضاء',
    noStudentsAssigned: 'لا يوجد طلاب معينون.',
    noId: 'بدون معرف',
    general: 'عام',
    actions: 'الإجراءات',
    yes: 'نعم',
    no: 'لا',
    duration: 'المدة',
    minutes: 'د',
    status: 'الحالة',
    timeLeft: 'الوقت المتبقي',
    progress: 'التقدم',
    logs: 'السجلات',
    incidents: 'الحوادث',
    sessionId: 'معرّف الجلسة',
    loadSessionLogs: 'تحميل سجلات الجلسة',
    logout: 'تسجيل الخروج',
  },
  fr: {
    dashboard: 'Tableau de bord administrateur',
    welcome: 'Bienvenue, {name}. Gérez l’académie depuis cet espace modulaire.',
    overview: 'Vue d’ensemble',
    classes: 'Classes',
    exams: 'Examens',
    users: 'Utilisateurs',
    questions: 'Questions',
    monitoring: 'Surveillance',
    reports: 'Rapports',
    audit: 'Audit',
    overviewSummary: 'Vue d’ensemble',
    createClass: 'Créer une classe',
    createExam: 'Créer un examen',
    createUser: 'Créer un utilisateur',
    questionBank: 'Banque de questions',
    noActiveSessions: 'Aucune session active.',
    noReports: 'Aucun rapport disponible pour le moment.',
    completedSessions: 'Sessions terminées',
    passRate: 'Taux de réussite',
    auditHint: 'Sélectionnez une session pour voir ses journaux et incidents.',
    createClassBtn: 'Créer une classe',
    classList: 'Classes',
    createExamBtn: 'Créer un examen',
    examList: 'Examens',
    createUserBtn: 'Créer un utilisateur',
    userList: 'Utilisateurs',
    bulkImport: 'Import en masse des candidats',
    questionList: 'Questions',
    addQuestion: 'Ajouter une question',
    noClasses: 'Aucune classe créée pour le moment.',
    noExams: 'Aucun examen créé pour le moment.',
    noUsers: 'Aucun utilisateur créé pour le moment.',
    noQuestions: 'Aucune question créée pour le moment.',
    noDescription: 'Aucune description',
    name: 'Nom',
    description: 'Description',
    title: 'Titre',
    classLabel: 'Classe',
    selectClass: 'Sélectionner une classe',
    scheduledDate: 'Date programmée',
    durationMinutes: 'Durée (minutes)',
    examText: 'Texte de l’examen',
    examTextPlaceholder: 'Collez le texte de la question ici...',
    instructions: 'Instructions',
    instructionsPlaceholder: 'Instructions de l’examen...',
    username: 'Nom d’utilisateur',
    password: 'Mot de passe',
    role: 'Rôle',
    student: 'Étudiant',
    teacher: 'Enseignant',
    admin: 'Administrateur',
    studentId: 'Identifiant étudiant',
    department: 'Département',
    nationalId: 'CNI',
    email: 'E-mail',
    phone: 'Téléphone',
    photoUrl: 'URL de la photo',
    active: 'Actif',
    csv: 'CSV',
    importUsers: 'Importer les utilisateurs',
    resetPassword: 'Réinitialiser le mot de passe',
    questionText: 'Texte de la question',
    questionType: 'Type de question',
    multipleChoice: 'Choix multiples',
    essay: 'Essai',
    options: 'Options (une par ligne, par exemple a. Option A)',
    correctKeys: 'Clés correctes (séparées par des virgules)',
    marks: 'Points',
    difficulty: 'Difficulté',
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    topic: 'Sujet',
    explanation: 'Explication',
    timeEstimate: 'Temps estimé (minutes)',
    tags: 'Étiquettes',
    category: 'Catégorie',
    attachments: 'Pièces jointes (une par ligne)',
    tagsPlaceholder: 'séparées par des virgules',
    assignStudent: 'Affectuer un étudiant',
    selectStudent: 'Sélectionner un étudiant',
    assignBtn: 'Affectuer',
    members: 'Membres',
    noStudentsAssigned: 'Aucun étudiant affecté.',
    noId: 'sans identifiant',
    general: 'Général',
    actions: 'Actions',
    yes: 'Oui',
    no: 'Non',
    duration: 'Durée',
    minutes: 'min',
    status: 'Statut',
    timeLeft: 'Temps restant',
    progress: 'Progression',
    logs: 'Journaux',
    incidents: 'Incidents',
    sessionId: 'ID de session',
    loadSessionLogs: 'Charger les journaux de session',
    logout: 'Déconnexion',
  },
};

const navItems = [
  { key: 'overview', labelKey: 'overview' },
  { key: 'classes', labelKey: 'classes' },
  { key: 'exams', labelKey: 'exams' },
  { key: 'users', labelKey: 'users' },
  { key: 'questions', labelKey: 'questions' },
  { key: 'monitoring', labelKey: 'monitoring' },
  { key: 'reports', labelKey: 'reports' },
  { key: 'audit', labelKey: 'audit' },
];

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
  const [userNationalId, setUserNationalId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPhotoUrl, setUserPhotoUrl] = useState('');
  const [userActive, setUserActive] = useState(true);
  const [classMembers, setClassMembers] = useState({});
  const [assignSelection, setAssignSelection] = useState({});
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [questionTimeEstimate, setQuestionTimeEstimate] = useState('');
  const [questionTags, setQuestionTags] = useState('');
  const [questionCategory, setQuestionCategory] = useState('');
  const [questionAttachments, setQuestionAttachments] = useState('');
  const [bulkCsv, setBulkCsv] = useState('username,password,role,studentId,nationalId,email,phone\nstudent1,Test123!,student,12345,123456789,student@example.com,1234567890');
  const [monitoringSessions, setMonitoringSessions] = useState([]);
  const [reports, setReports] = useState(null);
  const [selectedSessionLogs, setSelectedSessionLogs] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [questionOptions, setQuestionOptions] = useState('a. Option A\nb. Option B\nc. Option C');
  const [questionKeys, setQuestionKeys] = useState('a');
  const [questionMarks, setQuestionMarks] = useState(1);
  const [questionDifficulty, setQuestionDifficulty] = useState('Medium');
  const [questionTopic, setQuestionTopic] = useState('General');
  const [questionExplanation, setQuestionExplanation] = useState('');
  const [activePage, setActivePage] = useState('overview');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const [classData, examData, userData, questionData, monitoringData, reportsData] = await Promise.all([
        fetchAdminClasses({ token }),
        fetchAdminExams({ token }),
        fetchAdminUsers({ token }),
        fetchAdminQuestions({ token }),
        fetchActiveMonitoringSessions({ token }),
        fetchAdminReports({ token }),
      ]);
      const classList = Array.isArray(classData?.classes) ? classData.classes : [];
      const examList = Array.isArray(examData?.exams) ? examData.exams : [];
      const userList = Array.isArray(userData?.users) ? userData.users : [];
      const questionList = Array.isArray(questionData?.questions) ? questionData.questions : [];
      const monitoringList = Array.isArray(monitoringData?.sessions) ? monitoringData.sessions : [];
      const reportsPayload = reportsData || null;
      setClasses(classList);
      setExams(examList);
      setUsers(userList);
      setQuestions(questionList);
      setMonitoringSessions(monitoringList);
      setReports(reportsPayload);
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
        nationalId: userNationalId,
        email: userEmail,
        phone: userPhone,
        photoUrl: userPhotoUrl,
      });
      setSuccess('User created successfully.');
      setUserName('');
      setUserPassword('');
      setUserStudentId('');
      setUserDepartment('');
      setUserNationalId('');
      setUserEmail('');
      setUserPhone('');
      setUserPhotoUrl('');
      setUserRole('student');
      setUserActive(true);
      setUsers(prev => Array.isArray(prev) ? [res.user, ...prev] : [res.user]);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleBulkImportUsers = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await importAdminUsers({ token, csv: bulkCsv });
      setSuccess(`Imported ${res.count} users.`);
      setBulkCsv('');
      loadData();
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
      const options = questionType === 'essay'
        ? {}
        : questionOptions
            .split('\n')
            .filter(Boolean)
            .reduce((acc, line) => {
              const [key, ...rest] = line.split('.');
              acc[key.trim()] = rest.join('.').trim();
              return acc;
            }, {});
      const correctKeys = questionType === 'essay'
        ? []
        : questionKeys.split(',').map(k => k.trim()).filter(Boolean);

      const res = await createAdminQuestion({
        token,
        text: questionText,
        options,
        correctKeys,
        marks: Number(questionMarks) || 1,
        difficulty: questionDifficulty,
        topic: questionTopic,
        explanation: questionExplanation,
        questionType,
        timeEstimate: questionTimeEstimate || null,
        tags: questionTags.split(',').map(t => t.trim()).filter(Boolean),
        category: questionCategory || null,
        attachments: questionAttachments.split('\n').map(a => a.trim()).filter(Boolean),
      });
      setSuccess('Question added to bank.');
      setQuestionText('');
      setQuestionOptions('a. Option A\nb. Option B\nc. Option C');
      setQuestionKeys('a');
      setQuestionMarks(1);
      setQuestionDifficulty('Medium');
      setQuestionTopic('General');
      setQuestionExplanation('');
      setQuestionType('multiple_choice');
      setQuestionTimeEstimate('');
      setQuestionTags('');
      setQuestionCategory('');
      setQuestionAttachments('');
      setQuestions(prev => [res.question, ...prev]);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleInspectSession = async (sessionId) => {
    try {
      setError('');
      const res = await fetchExamSessionLogs({ token, sessionId });
      setSelectedSessionId(sessionId);
      setSelectedSessionLogs(res);
    } catch (err) {
      setError(err.message);
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

  const t = translations[language] || translations.en;

  const renderPage = () => {
    switch (activePage) {
      case 'classes':
        return <ClassesPage classes={classes} users={users} className={className} setClassName={setClassName} classDescription={classDescription} setClassDescription={setClassDescription} assignSelection={assignSelection} setAssignSelection={setAssignSelection} classMembers={classMembers} handleCreateClass={handleCreateClass} handleAssignStudent={handleAssignStudent} t={t} />;
      case 'exams':
        return <ExamsPage classes={classes} exams={exams} examTitle={examTitle} setExamTitle={setExamTitle} examDescription={examDescription} setExamDescription={setExamDescription} examClassId={examClassId} setExamClassId={setExamClassId} examDate={examDate} setExamDate={setExamDate} examDuration={examDuration} setExamDuration={setExamDuration} examText={examText} setExamText={setExamText} instructions={instructions} setInstructions={setInstructions} handleCreateExam={handleCreateExam} t={t} />;
      case 'users':
        return <UsersPage users={users} userName={userName} setUserName={setUserName} userPassword={userPassword} setUserPassword={setUserPassword} userRole={userRole} setUserRole={setUserRole} userStudentId={userStudentId} setUserStudentId={setUserStudentId} userDepartment={userDepartment} setUserDepartment={setUserDepartment} userNationalId={userNationalId} setUserNationalId={setUserNationalId} userEmail={userEmail} setUserEmail={setUserEmail} userPhone={userPhone} setUserPhone={setUserPhone} userPhotoUrl={userPhotoUrl} setUserPhotoUrl={setUserPhotoUrl} userActive={userActive} setUserActive={setUserActive} bulkCsv={bulkCsv} setBulkCsv={setBulkCsv} handleCreateUser={handleCreateUser} handleBulkImportUsers={handleBulkImportUsers} handleResetPassword={handleResetPassword} t={t} />;
      case 'questions':
        return <QuestionsPage questionText={questionText} setQuestionText={setQuestionText} questionType={questionType} setQuestionType={setQuestionType} questionOptions={questionOptions} setQuestionOptions={setQuestionOptions} questionKeys={questionKeys} setQuestionKeys={setQuestionKeys} questionMarks={questionMarks} setQuestionMarks={setQuestionMarks} questionDifficulty={questionDifficulty} setQuestionDifficulty={setQuestionDifficulty} questionTopic={questionTopic} setQuestionTopic={setQuestionTopic} questionExplanation={questionExplanation} setQuestionExplanation={setQuestionExplanation} questionTimeEstimate={questionTimeEstimate} setQuestionTimeEstimate={setQuestionTimeEstimate} questionTags={questionTags} setQuestionTags={setQuestionTags} questionCategory={questionCategory} setQuestionCategory={setQuestionCategory} questionAttachments={questionAttachments} setQuestionAttachments={setQuestionAttachments} questions={questions} handleCreateQuestion={handleCreateQuestion} t={t} />;
      case 'monitoring':
        return <MonitoringPage monitoringSessions={monitoringSessions} t={t} />;
      case 'reports':
        return <ReportsPage reports={reports} t={t} />;
      case 'audit':
        return <AuditPage selectedSessionId={selectedSessionId} setSelectedSessionId={setSelectedSessionId} selectedSessionLogs={selectedSessionLogs} handleInspectSession={handleInspectSession} t={t} />;
      default:
        return <OverviewPage classes={classes} exams={exams} users={users} questions={questions} monitoringSessions={monitoringSessions} reports={reports} t={t} />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h1>{t.dashboard}</h1>
          <p>{t.welcome.replace('{name}', user.username)}</p>
        </div>
        <div className="admin-header-actions">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="language-switcher">
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="fr">Français</option>
          </select>
          <button className="btn btn-ghost" onClick={onLogout}>{t.logout}</button>
        </div>
      </div>

      <nav className="admin-nav">
        {navItems.map((item) => (
          <button key={item.key} className={`admin-nav-btn ${activePage === item.key ? 'active' : ''}`} type="button" onClick={() => setActivePage(item.key)}>
            {t[item.labelKey]}
          </button>
        ))}
      </nav>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {renderPage()}
    </div>
  );
}
