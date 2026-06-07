'use strict';
// Validates the engine:
//  - a perfect solver (using each task's own canonical expected value) scores 100
//  - a blank submission scores 0
//  - every task has a unique/consistent answer key (no broken generators)
//  - tokens are tamper-proof
const C = require('./challenges');

function refAnswer(t) {
  if (t.id === 'anti_hallucination') return 'NO_ANSWER';
  if (t.expected && typeof t.expected === 'object') return JSON.stringify(t.expected);
  return t.expected;
}

let pass = 0, fail = 0;
const N = 500;
for (let i = 0; i < N; i++) {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const tasks = C.buildTasks(seed);
  if (tasks.length !== 16) { fail++; console.log('WRONG TASK COUNT', seed, tasks.length); continue; }
  const answers = tasks.map(t => ({ id: t.id, answer: refAnswer(t) }));
  const r = C.grade(seed, answers);
  if (r.percent === 100) pass++;
  else { fail++; if (fail <= 5) console.log('MISS seed', seed, r.breakdown.filter(b => !b.correct).map(b => b.id)); }
}
console.log(`perfect-solver: ${pass}/${N} scored 100, ${fail} imperfect`);

// total points must equal 100
const pts = C.buildTasks(1).reduce((a, t) => a + t.points, 0);
console.log(`total points: ${pts} (expect 100)`);

const blank = C.grade(12345, []);
console.log(`blank submission: ${blank.percent}% (expect 0)`);

const tok = C.sign(777, 'secretA');
console.log('valid token verifies:', !!C.verify(tok, 'secretA'));
console.log('tampered token rejected:', C.verify(tok.slice(0, -2) + 'xx', 'secretA') === null);
console.log('wrong-secret rejected:', C.verify(tok, 'secretB') === null);

process.exit(fail === 0 && pts === 100 && blank.percent === 0 ? 0 : 1);
