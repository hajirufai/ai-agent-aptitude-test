'use strict';
/*
 * AI Agent Aptitude Test - challenge engine
 *
 * Stateless and cheat-resistant:
 *  - /api/start derives a fresh challenge set from a random 32-bit seed
 *  - the seed is returned inside an HMAC-signed token (cannot be forged or edited)
 *  - expected answers are NEVER sent to the client; they are re-derived from the
 *    seed at grading time, so an agent cannot read the answer key
 *
 * Ten tasks spanning the capabilities that separate a strong agent from a weak one:
 *   precise arithmetic, character-level counting, string ops, pattern induction,
 *   code tracing, structured data extraction, calendar math, strict JSON output,
 *   exact format compliance, and hallucination resistance.
 */

const crypto = require('crypto');

// ---- deterministic PRNG (mulberry32) -------------------------------------
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

const WORDS = ['river', 'forest', 'mirror', 'thunder', 'orange', 'parrot', 'silver',
  'garden', 'rocket', 'pepper', 'harbor', 'marble', 'crimson', 'pretzel', 'terror',
  'corner', 'barrier', 'arrow', 'carrot', 'error', 'morning', 'ranger', 'warrior'];
const NAMES = ['Ada', 'Linus', 'Grace', 'Alan', 'Hedy', 'Dennis', 'Margaret', 'Ken'];
const STATUSES = ['paid', 'pending', 'refunded', 'failed'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ---- the ten task builders -----------------------------------------------
// Each returns { id, category, points, prompt, grader } where grader(answer)->bool|number(0..1)

function buildTasks(seed) {
  const r = rng(seed);
  const tasks = [];

  // 1. precise modular arithmetic
  {
    const a = int(r, 23, 99), b = int(r, 23, 99), c = int(r, 100, 999), d = int(r, 7, 97);
    const expected = ((a * b + c) % d);
    tasks.push({
      id: 'arithmetic', category: 'Precise computation', points: 10,
      prompt: `Compute ((${a} * ${b}) + ${c}) mod ${d}. Reply with the single integer result.`,
      expected,
      grade: (ans) => Number(String(ans).trim()) === expected,
    });
  }

  // 2. character-level counting (a classic LLM weak spot)
  {
    const n = int(r, 7, 10);
    const phrase = Array.from({ length: n }, () => pick(r, WORDS)).join(' ');
    const letter = pick(r, ['r', 'e', 'o', 'a']);
    const expected = (phrase.match(new RegExp(letter, 'g')) || []).length;
    tasks.push({
      id: 'letter_count', category: 'Character-level reasoning', points: 10,
      prompt: `In the text below, how many times does the lowercase letter "${letter}" appear? Reply with a single integer.\n\nTEXT: ${phrase}`,
      expected,
      grade: (ans) => Number(String(ans).trim()) === expected,
    });
  }

  // 3. string reversal
  {
    const len = int(r, 10, 14);
    const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
    let s = '';
    for (let i = 0; i < len; i++) s += alphabet[Math.floor(r() * alphabet.length)];
    const expected = s.split('').reverse().join('');
    tasks.push({
      id: 'string_reverse', category: 'String manipulation', points: 10,
      prompt: `Reverse this string exactly (character order). Reply with only the reversed string.\n\nSTRING: ${s}`,
      expected,
      grade: (ans) => String(ans).trim() === expected,
    });
  }

  // 4. pattern induction (mixed arithmetic / geometric)
  {
    const geometric = r() < 0.5;
    let seq, expected;
    if (geometric) {
      const start = int(r, 2, 5), ratio = int(r, 2, 4);
      seq = [start]; for (let i = 1; i < 5; i++) seq.push(seq[i - 1] * ratio);
      expected = seq[4] * ratio;
    } else {
      const start = int(r, 3, 12), step = int(r, 3, 11);
      seq = [start]; for (let i = 1; i < 5; i++) seq.push(seq[i - 1] + step);
      expected = seq[4] + step;
    }
    tasks.push({
      id: 'sequence', category: 'Pattern induction', points: 10,
      prompt: `What is the next number in this sequence? Reply with a single integer.\n\n${seq.join(', ')}, ?`,
      expected,
      grade: (ans) => Number(String(ans).trim()) === expected,
    });
  }

  // 5. code tracing
  {
    const arr = Array.from({ length: 6 }, () => int(r, 1, 20));
    const mode = pick(r, ['even', 'odd', 'gt10']);
    let expected;
    if (mode === 'even') expected = arr.filter(x => x % 2 === 0).reduce((a, b) => a + b, 0);
    else if (mode === 'odd') expected = arr.filter(x => x % 2 === 1).reduce((a, b) => a + b, 0);
    else expected = arr.filter(x => x > 10).reduce((a, b) => a + b, 0);
    const cond = mode === 'even' ? 'x % 2 == 0' : mode === 'odd' ? 'x % 2 == 1' : 'x > 10';
    tasks.push({
      id: 'code_trace', category: 'Code tracing', points: 10,
      prompt: `Trace this Python and give the printed value (a single integer):\n\n` +
        `data = ${JSON.stringify(arr)}\n` +
        `print(sum(x for x in data if ${cond}))`,
      expected,
      grade: (ans) => Number(String(ans).trim()) === expected,
    });
  }

  // 6. structured data extraction
  {
    const rows = [];
    for (let i = 0; i < 6; i++) rows.push({ id: 1000 + i, amount: int(r, 10, 500), status: pick(r, STATUSES) });
    const expected = rows.filter(x => x.status === 'paid').reduce((a, b) => a + b.amount, 0);
    const csv = 'id,amount,status\n' + rows.map(x => `${x.id},${x.amount},${x.status}`).join('\n');
    tasks.push({
      id: 'data_extract', category: 'Data extraction', points: 10,
      prompt: `From the CSV below, sum the "amount" of every row whose status is exactly "paid". Reply with a single integer (0 if none).\n\n${csv}`,
      expected,
      grade: (ans) => Number(String(ans).trim()) === expected,
    });
  }

  // 7. calendar math
  {
    const baseIdx = int(r, 0, 6);
    const addDays = int(r, 10, 90);
    const expected = WEEKDAYS[(baseIdx + (addDays % 7)) % 7];
    tasks.push({
      id: 'date_math', category: 'Calendar reasoning', points: 10,
      prompt: `If a certain day is a ${WEEKDAYS[baseIdx]}, what weekday is it ${addDays} days later? Reply with the weekday name only (e.g. Monday).`,
      expected,
      grade: (ans) => String(ans).trim().toLowerCase() === expected.toLowerCase(),
    });
  }

  // 8. strict JSON output
  {
    const name = pick(r, NAMES);
    const score = int(r, 1, 100);
    const tagCount = int(r, 2, 3);
    const tagPool = ['alpha', 'beta', 'gamma', 'delta', 'omega'];
    const tags = [];
    for (let i = 0; i < tagCount; i++) { const t = pick(r, tagPool); if (!tags.includes(t)) tags.push(t); }
    const expected = { name, score, passed: score >= 50, tags };
    tasks.push({
      id: 'json_build', category: 'Structured output', points: 10,
      prompt: `Return ONLY a JSON object (no prose, no code fences) with exactly these keys:\n` +
        `- "name": ${name}\n- "score": ${score}\n- "passed": true if score >= 50 else false\n- "tags": ${JSON.stringify(tags)}\n` +
        `Order does not matter.`,
      expected,
      grade: (ans) => {
        try {
          let raw = String(ans).trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
          const o = JSON.parse(raw);
          return o && o.name === expected.name && Number(o.score) === expected.score &&
            o.passed === expected.passed && Array.isArray(o.tags) &&
            o.tags.length === expected.tags.length && o.tags.every((t, i) => t === expected.tags[i]);
        } catch (_) { return false; }
      },
    });
  }

  // 9. exact format compliance
  {
    const word = pick(r, ['PING', 'NODE', 'AGENT', 'TOKEN']);
    const reps = int(r, 4, 7);
    const sep = pick(r, ['-', '_', '|']);
    const expected = Array(reps).fill(word).join(sep);
    tasks.push({
      id: 'format_compliance', category: 'Instruction following', points: 10,
      prompt: `Output the word "${word}" repeated exactly ${reps} times, joined by "${sep}" with no spaces and nothing else.`,
      expected,
      grade: (ans) => String(ans).trim() === expected,
    });
  }

  // 10. hallucination resistance
  {
    tasks.push({
      id: 'anti_hallucination', category: 'Hallucination resistance', points: 10,
      prompt: `Trick question: "What is the 4th-from-last digit of the population of the fictional city of Zarnovia in 2031?" ` +
        `This has no real answer. If a question cannot be answered truthfully, you must refuse rather than invent data. ` +
        `Reply with exactly this token and nothing else: NO_ANSWER`,
      expected: 'NO_ANSWER',
      grade: (ans) => String(ans).trim() === 'NO_ANSWER',
    });
  }

  return tasks;
}

// ---- public-facing challenge (no answers) --------------------------------
function publicChallenge(seed) {
  return buildTasks(seed).map(t => ({
    id: t.id, category: t.category, points: t.points, prompt: t.prompt,
  }));
}

// ---- grading -------------------------------------------------------------
function grade(seed, answers) {
  const tasks = buildTasks(seed);
  const byId = {};
  (answers || []).forEach(a => { if (a && a.id != null) byId[a.id] = a.answer; });
  let total = 0, earned = 0;
  const breakdown = tasks.map(t => {
    total += t.points;
    const submitted = byId[t.id];
    let correct = false;
    if (submitted !== undefined) { try { correct = !!t.grade(submitted); } catch (_) { correct = false; } }
    const pts = correct ? t.points : 0;
    earned += pts;
    return { id: t.id, category: t.category, max: t.points, awarded: pts, correct };
  });
  const pct = Math.round((earned / total) * 100);
  return { earned, total, percent: pct, grade: letter(pct), rank: rankLabel(pct), breakdown };
}

function letter(p) {
  if (p >= 95) return 'A+'; if (p >= 90) return 'A'; if (p >= 85) return 'A-';
  if (p >= 80) return 'B'; if (p >= 70) return 'C'; if (p >= 60) return 'D';
  return 'F';
}
function rankLabel(p) {
  if (p === 100) return 'Flawless - Frontier-class agent';
  if (p >= 90) return 'Elite - production-ready autonomous agent';
  if (p >= 70) return 'Capable - solid with occasional slips';
  if (p >= 50) return 'Developing - needs supervision';
  return 'Unreliable - not ready for autonomous work';
}

// ---- signed tokens (seed only; HMAC-protected) ---------------------------
function sign(seed, secret) {
  const payload = Buffer.from(JSON.stringify({ seed, ts: Date.now() })).toString('base64url');
  const mac = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${mac}`;
}
function verify(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, mac] = token.split('.');
  const expect = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (mac !== expect) return null;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch (_) { return null; }
}

module.exports = { buildTasks, publicChallenge, grade, sign, verify, rng };
