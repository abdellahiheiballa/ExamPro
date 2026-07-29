import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuestions } from '../src/utils/parser.js';

test('parseQuestions recognizes essay questions with explicit type markers', () => {
  const rawText = `Question 1
Type: Essay
Explain the impact of AI on education.`;

  const questions = parseQuestions(rawText);

  assert.equal(questions.length, 1);
  assert.equal(questions[0].type, 'essay');
  assert.match(questions[0].question, /Explain the impact/);
});
