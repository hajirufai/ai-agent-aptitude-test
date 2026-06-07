'use strict';
// Validates the engine: a correct solver must score 100, a blank submission 0.
const C = require('./challenges');

function refSolve(t) {
  switch (t.id) {
    case 'arithmetic': case 'letter_count': case 'string_reverse': case 'sequence':
    case 'code_trace': case 'data_extract': case 'date_math': case 'format_compliance':
      return t.expected;
    case 'json_build':
      return JSON.stringify(t.expected);
    case 'anti_hallucination':
      return 'NO_ANSWER';
    default: return '';
  }
}

let pass = 0, fail = 0;
for (let i = 0; i < 200; i++) {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const tasks = C.buildTasks(seed);
  const answers = tasks.map(t => ({ id: t.id, answer: refSolve(t) }));
  const r = C.grade(seed, answers);
  if (r.percent === 100) pass++; else { fail++; if (fail <= 5) console.log('MISS seed', seed, r.breakdown.filter(b => !b.correct).map(b => b.id)); }
}
console.log(`correct-solver: ${pass}/200 perfect, ${fail} imperfect`);

// blank submission should be 0
const seed = 12345;
const blank = C.grade(seed, []);
console.log(`blank submission: ${blank.percent}% (expect 0)`);

// token tamper test
const tok = C.sign(777, 'secretA');
console.log('valid token verifies:', !!C.verify(tok, 'secretA'));
console.log('tampered token rejected:', C.verify(tok.slice(0, -2) + 'xx', 'secretA') === null);
console.log('wrong-secret rejected:', C.verify(tok, 'secretB') === null);

process.exit(fail === 0 && blank.percent === 0 ? 0 : 1);
