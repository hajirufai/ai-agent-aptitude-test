'use strict';
// Validates the engine: a correct solver (using each task's own expected value)
// must score 100, a blank submission 0, and tokens must be tamper-proof.
const C = require('./challenges');

function refAnswer(t) {
  if (t.id === 'anti_hallucination') return 'NO_ANSWER';
  if (t.expected && typeof t.expected === 'object') return JSON.stringify(t.expected);
  return t.expected;
}

let pass = 0, fail = 0;
for (let i = 0; i < 300; i++) {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const tasks = C.buildTasks(seed);
  const answers = tasks.map(t => ({ id: t.id, answer: refAnswer(t) }));
  const r = C.grade(seed, answers);
  if (r.percent === 100) pass++; else { fail++; if (fail <= 5) console.log('MISS seed', seed, r.breakdown.filter(b => !b.correct).map(b => b.id)); }
}
console.log(`correct-solver: ${pass}/300 perfect, ${fail} imperfect`);

const blank = C.grade(12345, []);
console.log(`blank submission: ${blank.percent}% (expect 0)`);

const tok = C.sign(777, 'secretA');
console.log('valid token verifies:', !!C.verify(tok, 'secretA'));
console.log('tampered token rejected:', C.verify(tok.slice(0, -2) + 'xx', 'secretA') === null);
console.log('wrong-secret rejected:', C.verify(tok, 'secretB') === null);

process.exit(fail === 0 && blank.percent === 0 ? 0 : 1);
