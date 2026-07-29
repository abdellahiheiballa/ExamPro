/**
 * parseQuestions — converts raw pasted exam text into structured JSON
 *
 * Handles:
 *   - "Mise en situation" blocks (scenario)
 *   - "Mission" sub-blocks
 *   - Main question text
 *   - Options a. / b. / c. / d. / e.
 *   - Question numbering
 */
export function parseQuestions(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split('\n');
  const questions = [];
  let current = null;
  let currentOptionKey = null;
  let inScenario = false;
  let inQuestion = false;

  const optionRegex = /^\s*([a-e])\s*[.)]\s*(.*)/i;
  const questionHeaderRegex = /^Question\s+(\d+)\s*$/i;

  const flush = () => {
    if (current) {
      // Clean up trailing whitespace
      current.scenario = current.scenario.trim();
      current.question = current.question.trim();
      Object.keys(current.options).forEach(k => {
        current.options[k] = current.options[k].trim();
      });
      // Ensure minimum structure
      if (current.question || Object.keys(current.options).length > 0) {
        questions.push(current);
      }
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect new question header
    const qMatch = trimmed.match(questionHeaderRegex);
    if (qMatch) {
      flush();
      current = {
        id: parseInt(qMatch[1]),
        scenario: '',
        question: '',
        options: {},
      };
      currentOptionKey = null;
      inScenario = false;
      inQuestion = false;
      continue;
    }

    if (!current) continue;

    // Detect "Mise en situation" start
    if (/^Mise en situation\s*:/i.test(trimmed)) {
      inScenario = true;
      inQuestion = false;
      currentOptionKey = null;
      const afterColon = trimmed.replace(/^Mise en situation\s*:\s*/i, '');
      if (afterColon) current.scenario += afterColon + ' ';
      continue;
    }

    // Detect "Mission :" — append to scenario
    if (/^Mission\s*:/i.test(trimmed)) {
      inScenario = true;
      inQuestion = false;
      currentOptionKey = null;
      current.scenario += '\n\nMission : ' + trimmed.replace(/^Mission\s*:\s*/i, '') + ' ';
      continue;
    }

    // Detect "Question :" line (the actual question text, different from "Question N")
    if (/^Question\s*:/i.test(trimmed)) {
      inScenario = false;
      inQuestion = true;
      currentOptionKey = null;
      const afterColon = trimmed.replace(/^Question\s*:\s*/i, '');
      if (afterColon) current.question += afterColon + ' ';
      continue;
    }

    // Detect option lines: a. / b. / c. etc.
    const optMatch = trimmed.match(optionRegex);
    if (optMatch) {
      inScenario = false;
      inQuestion = false;
      currentOptionKey = optMatch[1].toLowerCase();
      current.options[currentOptionKey] = optMatch[2] ? optMatch[2] + ' ' : '';
      continue;
    }

    // Skip separator lines
    if (/^[.…\-_=]{5,}$/.test(trimmed)) continue;

    // Skip "Questions N à M" header lines
    if (/^Questions?\s+\d+\s+à\s+\d+/i.test(trimmed)) continue;

    // Empty line — might end scenario and start question
    if (trimmed === '') {
      if (inScenario && current.question === '' && !currentOptionKey) {
        // Stay in scenario unless we've seen something after
      }
      continue;
    }

    // Continuation of current option
    if (currentOptionKey) {
      current.options[currentOptionKey] += trimmed + ' ';
      continue;
    }

    // If we're accumulating scenario
    if (inScenario) {
      current.scenario += trimmed + ' ';
      continue;
    }

    // If we're accumulating question
    if (inQuestion) {
      current.question += trimmed + ' ';
      continue;
    }

    // Heuristic: if no options yet, this is likely the question text
    // (handles cases where "Parmi les approches..." is the question without "Question:" prefix)
    if (Object.keys(current.options).length === 0) {
      current.question += trimmed + ' ';
    }
  }

  flush();

  // Post-process: if scenario is empty but question has a long block, try to split
  return questions.map(q => {
    // Normalize spaces
    q.scenario = q.scenario.replace(/\s+/g, ' ').trim();
    q.question = q.question.replace(/\s+/g, ' ').trim();
    Object.keys(q.options).forEach(k => {
      q.options[k] = q.options[k].replace(/\s+/g, ' ').trim();
    });
    return q;
  });
}

/**
 * computeScore — for a single question
 * Each option: correct+selected → +0.20, wrong+selected → -0.05
 * Min 0, Max 1.00
 */
export function computeQuestionScore(question, selectedKeys, correctKeys) {
  if (!correctKeys || correctKeys.length === 0) return { score: 0, max: 1 };

  const allKeys = Object.keys(question.options);
  let score = 0;

  allKeys.forEach(key => {
    const isCorrect = correctKeys.includes(key);
    const isSelected = selectedKeys.includes(key);

    if (isCorrect && isSelected) score += 0.20;
    else if (!isCorrect && isSelected) score -= 0.05;
  });

  return {
    score: Math.max(0, Math.min(1, parseFloat(score.toFixed(4)))),
    max: 1.0,
  };
}

/**
 * formatFrench — format a number French style: 0,84
 */
export function formatFr(n, decimals = 2) {
  return n.toFixed(decimals).replace('.', ',');
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
  if (m > 0) return `${m}min ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export function formatDateTime(ts, locale = 'ar') {
  if (!ts) return '—';
  const d = new Date(ts);
  if (locale === 'fr') {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hh}:${mm}`;
  }

  const day = d.getDate();
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year} ${hh}:${mm}`;
}
