import test from 'node:test';
import assert from 'node:assert/strict';
import { setLocale, t } from '../src/i18n.js';

test('Arabic and French translations cover the admin and student UI keys', () => {
  setLocale('ar');
  assert.equal(t('login.mode.student'), 'طالب');
  assert.equal(t('login.mode.admin'), 'مشرف');
  assert.equal(t('login.title.student'), 'تسجيل دخول الطالب');
  assert.equal(t('studentDashboard.loading'), 'جاري تحميل الاختبارات...');
  assert.equal(t('studentDashboard.startExam'), 'بدء الاختبار');
  assert.equal(t('admin.dashboard'), 'لوحة الإدارة');

  setLocale('fr');
  assert.equal(t('login.mode.student'), 'Étudiant');
  assert.equal(t('login.mode.admin'), 'Administrateur');
  assert.equal(t('login.title.student'), 'Connexion étudiant');
  assert.equal(t('studentDashboard.loading'), 'Chargement des examens...');
  assert.equal(t('studentDashboard.startExam'), 'Commencer l’examen');
  assert.equal(t('admin.dashboard'), 'Tableau de bord administrateur');
});
