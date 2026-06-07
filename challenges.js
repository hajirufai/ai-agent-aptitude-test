'use strict';
/*
 * AI Agent Aptitude Test - challenge engine (HARD edition)
 *
 * Stateless and cheat-resistant:
 *  - /api/start derives a fresh challenge set from a random 32-bit seed
 *  - the seed is returned inside an HMAC-signed token (cannot be forged or edited)
 *  - expected answers are NEVER sent to the client; they are re-derived from the
 *    seed at grading time, so an agent cannot read the answer key
 *
 * Ten deliberately hard tasks. Each is computable by careful step-by-step work,
 * but every one targets a place where language models slip when they reason in
 * their head instead of executing: modular exponentiation, long character
 * counting, multi-step string transforms, quadratic pattern induction, nested
 * loop simulation, multi-condition data aggregation, real calendar weekdays,
 * computed nested JSON, computed format patterns, and hallucination resistance.
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
const num = (ans) => Number(String(ans).replace(/[,\s]/g, '').trim());

// modular exponentiation with BigInt for exactness
function modpow(base, exp, mod) {
  let b = BigInt(base) % BigInt(mod), e = BigInt(exp), m = BigInt(mod), res = 1n;
  while (e > 0n) { if (e & 1n) res = (res * b) % m; b = (b * b) % m; e >>= 1n; }
  return res;
}

const WORDS = ['river', 'forest', 'mirror', 'thunder', 'orange', 'parrot', 'silver',
  'garden', 'rocket', 'pepper', 'harbor', 'marble', 'crimson', 'pretzel', 'terror',
  'corner', 'barrier', 'arrow', 'carrot', 'error', 'morning', 'ranger', 'warrior',
  'lantern', 'pattern', 'breeze', 'tunnel', 'velvet', 'cluster', 'meadow'];
const NAMES = ['Ada', 'Linus', 'Grace', 'Alan', 'Hedy', 'Dennis', 'Margaret', 'Ken'];
const STATUSES = ['paid', 'pending', 'refunded', 'failed'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ---- the ten HARD task builders ------------------------------------------
// Each returns { id, category, points, prompt, expected, grade(answer)->bool }
function buildTasks(seed) {
  const r = rng(seed);
  const tasks = [];

  // 1. modular exponentiation (sum of two powers, mod m)
  {
    const a = int(r, 3, 9), b = int(r, 14, 31), c = int(r, 3, 9), d = int(r, 14, 31), m = int(r, 1000, 9999);
    const expected = Number((modpow(a, b, m) + modpow(c, d, m)) % BigInt(m));
    tasks.push({
      id: 'modexp', category: 'Precise computation', points: 10,
      prompt: `Compute (${a}^${b} + ${c}^${d}) mod ${m}. That is, raise each base to its exponent, add the two results, then take the remainder modulo ${m}. Reply with the single integer result.`,
      expected,
      grade: (ans) => num(ans) === expected,
    });
  }

  // 2. long single-letter counting (canonical LLM failure mode)
  {
    const n = int(r, 28, 36);
    const phrase = Array.from({ length: n }, () => pick(r, WORDS)).join(' ');
    const letter = pick(r, ['r', 'e', 'a', 'o', 't', 'n']);
    const expected = (phrase.match(new RegExp(letter, 'g')) || []).length;
    tasks.push({
      id: 'letter_count', category: 'Character-level reasoning', points: 10,
      prompt: `In the text below, count exactly how many times the lowercase letter "${letter}" appears (count every occurrence, including repeats inside a word). Reply with a single integer.\n\nTEXT: ${phrase}`,
      expected,
      grade: (ans) => num(ans) === expected,
    });
  }

  // 3. multi-step string transform
  {
    const len = int(r, 14, 18);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let s = '';
    for (let i = 0; i < len; i++) s += alphabet[Math.floor(r() * alphabet.length)];
    const expected = s.replace(/[aeiou]/g, '').split('').reverse().join('').toUpperCase();
    tasks.push({
      id: 'string_transform', category: 'String manipulation', points: 10,
      prompt: `Apply these three steps to the STRING below, in order:\n` +
        `(1) delete every vowel (a, e, i, o, u),\n(2) reverse the characters that remain,\n(3) convert the result to UPPERCASE.\n` +
        `Reply with only the final string.\n\nSTRING: ${s}`,
      expected,
      grade: (ans) => String(ans).trim() === expected,
    });
  }

  // 4. quadratic pattern induction (constant second difference)
  {
    const A = int(r, 1, 3), B = int(r, 0, 6), C = int(r, 0, 9);
    const f = (k) => A * k * k + B * k + C;
    const seq = [1, 2, 3, 4, 5].map(f);
    const expected = f(6);
    tasks.push({
      id: 'sequence', category: 'Pattern induction', points: 10,
      prompt: `These numbers follow a fixed quadratic rule (the difference between consecutive differences is constant). What is the next number? Reply with a single integer.\n\n${seq.join(', ')}, ?`,
      expected,
      grade: (ans) => num(ans) === expected,
    });
  }

  // 5. nested-loop code tracing (long simulation)
  {
    const N = int(r, 6, 9);
    let x = 0;
    for (let i = 1; i < N; i++) for (let j = 0; j < i; j++) { if ((i + j) % 3 === 0) x += i * j; else x -= 1; }
    const expected = x;
    tasks.push({
      id: 'code_trace', category: 'Code tracing', points: 10,
      prompt: `Trace this Python exactly and give the printed value (a single integer, may be negative):\n\n` +
        `x = 0\n` +
        `for i in range(1, ${N}):\n` +
        `    for j in range(i):\n` +
        `        if (i + j) % 3 == 0:\n` +
        `            x += i * j\n` +
        `        else:\n` +
        `            x -= 1\n` +
        `print(x)`,
      expected,
      grade: (ans) => num(ans) === expected,
    });
  }

  // 6. multi-condition data aggregation (signed result)
  {
    const rows = [];
    for (let i = 0; i < 12; i++) rows.push({ id: 1000 + i, amount: int(r, 10, 500), status: pick(r, STATUSES) });
    // guarantee at least one paid and one refunded
    rows[int(r, 0, 5)].status = 'paid';
    rows[int(r, 6, 11)].status = 'refunded';
    const sumPaid = rows.filter(x => x.status === 'paid').reduce((a, b) => a + b.amount, 0);
    const sumRef = rows.filter(x => x.status === 'refunded').reduce((a, b) => a + b.amount, 0);
    const expected = sumPaid - sumRef;
    const csv = 'id,amount,status\n' + rows.map(x => `${x.id},${x.amount},${x.status}`).join('\n');
    tasks.push({
      id: 'data_extract', category: 'Data extraction', points: 10,
      prompt: `From the CSV below: sum the "amount" of every row whose status is exactly "paid", then subtract the sum of "amount" of every row whose status is exactly "refunded". Reply with a single integer (it may be negative).\n\n${csv}`,
      expected,
      grade: (ans) => num(ans) === expected,
    });
  }

  // 7. real calendar weekday
  {
    const y = int(r, 2024, 2031), mo = int(r, 1, 12), da = int(r, 1, 28);
    const expected = WEEKDAYS[new Date(Date.UTC(y, mo - 1, da)).getUTCDay()];
    const mm = String(mo).padStart(2, '0'), dd = String(da).padStart(2, '0');
    tasks.push({
      id: 'date_weekday', category: 'Calendar reasoning', points: 10,
      prompt: `On which day of the week does ${y}-${mm}-${dd} fall in the Gregorian calendar? Reply with the weekday name only (for example: Monday).`,
      expected,
      grade: (ans) => String(ans).trim().toLowerCase() === expected.toLowerCase(),
    });
  }

  // 8. computed, nested JSON output
  {
    const name = pick(r, NAMES);
    const scores = [int(r, 1, 100), int(r, 1, 100), int(r, 1, 100)];
    const total = scores[0] + scores[1] + scores[2];
    const average = Math.round((total / 3) * 100) / 100;
    const passed = average >= 50;
    const expected = { name, scores, total, average, passed };
    tasks.push({
      id: 'json_build', category: 'Structured output', points: 10,
      prompt: `Return ONLY a JSON object (no prose, no code fences) with exactly these keys:\n` +
        `- "name": ${name}\n` +
        `- "scores": ${JSON.stringify(scores)}\n` +
        `- "total": the sum of the three scores (integer)\n` +
        `- "average": the mean of the three scores rounded to exactly 2 decimal places, as a number\n` +
        `- "passed": true if the average is >= 50, otherwise false\n` +
        `Key order does not matter.`,
      expected,
      grade: (ans) => {
        try {
          const raw = String(ans).trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
          const o = JSON.parse(raw);
          return o && o.name === name && Array.isArray(o.scores) && o.scores.length === 3 &&
            o.scores.every((v, i) => Number(v) === scores[i]) &&
            Number(o.total) === total && Math.abs(Number(o.average) - average) < 0.005 &&
            o.passed === passed;
        } catch (_) { return false; }
      },
    });
  }

  // 9. computed format pattern
  {
    const N = int(r, 4, 7);
    const expected = Array.from({ length: N }, (_, i) => `${i + 1}:${(i + 1) * (i + 1)}`).join(', ');
    tasks.push({
      id: 'format_pattern', category: 'Instruction following', points: 10,
      prompt: `For each integer k from 1 to ${N}, write k, then a colon, then k squared (k times k). ` +
        `Join consecutive entries with a comma and a single space. Output nothing else. ` +
        `Example for k from 1 to 3: 1:1, 2:4, 3:9`,
      expected,
      grade: (ans) => String(ans).trim() === expected,
    });
  }

  // 10. hallucination resistance
  {
    tasks.push({
      id: 'anti_hallucination', category: 'Hallucination resistance', points: 10,
      prompt: `Question: "What is the 4th-from-last digit of the population of the fictional city of Zarnovia in 2031?" ` +
        `This refers to invented data and has no truthful answer. If a question cannot be answered truthfully, you must refuse instead of inventing a value. ` +
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
  if (p === 100) return 'Flawless - frontier-class agent';
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
