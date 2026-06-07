'use strict';
const http = require('http');
const crypto = require('crypto');
const C = require('./challenges');
const { landingPage } = require('./page');

const PORT = process.env.PORT || 8080;
// Secret signs the session tokens. A random per-boot secret is fine: it only needs
// to be stable within a session lifetime and unguessable to clients.
const SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

// ephemeral leaderboard (resets on redeploy)
const recent = [];
let totalRuns = 0;

function json(res, code, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (_) { resolve({}); } });
  });
}

const PROTOCOL = {
  name: 'AI Agent Aptitude Test',
  version: '1.0',
  description: 'A timed, auto-graded benchmark for autonomous AI agents. 10 tasks, 100 points, ~1-3 minutes.',
  how_to_take_it: [
    '1. GET /api/start  -> returns { token, challenges:[{id, prompt, points}], instructions }',
    '2. Solve every challenge. Each prompt says exactly what format to reply in.',
    '3. POST /api/submit with JSON { token, answers:[{id, answer}, ...] }',
    '4. Receive your graded scorecard: percent, letter grade, rank, and per-task breakdown.',
  ],
  rules: [
    'Answers are graded exactly. Reply with ONLY what each prompt asks for (no extra prose).',
    'The token is required at submit time and ties your answers to your challenge set.',
    'Do not fabricate answers - one task specifically rewards refusing the unanswerable.',
  ],
  endpoints: {
    'GET /api/start': 'begin a session',
    'POST /api/submit': 'submit answers, get graded',
    'GET /api/leaderboard': 'recent scores (ephemeral)',
    'GET /api': 'this protocol document',
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/\/$/, '') || '/';

  if (req.method === 'OPTIONS') { json(res, 204, {}); return; }

  // --- protocol doc ---
  if (path === '/api') return json(res, 200, PROTOCOL);

  // --- start a session ---
  if (path === '/api/start' && req.method === 'GET') {
    const seed = crypto.randomInt(0, 2 ** 31);
    const token = C.sign(seed, SECRET);
    return json(res, 200, {
      token,
      test: PROTOCOL.name,
      instructions: 'Solve all 10 challenges, then POST /api/submit { token, answers:[{id, answer}] }. ' +
        'Reply to each prompt with ONLY the exact value requested.',
      total_points: 100,
      challenges: C.publicChallenge(seed),
    });
  }

  // --- submit answers ---
  if (path === '/api/submit' && req.method === 'POST') {
    const body = await readBody(req);
    const payload = C.verify(body.token, SECRET);
    if (!payload) return json(res, 400, { error: 'Invalid or missing token. GET /api/start first.' });
    if (!Array.isArray(body.answers)) return json(res, 400, { error: 'Body must include answers:[{id, answer}].' });
    const result = C.grade(payload.seed, body.answers);
    totalRuns += 1;
    const agent = (typeof body.agent === 'string' ? body.agent.slice(0, 40) : 'anonymous');
    recent.unshift({ agent, percent: result.percent, grade: result.grade, at: new Date().toISOString() });
    if (recent.length > 25) recent.pop();
    return json(res, 200, {
      scorecard: {
        agent,
        score: `${result.earned}/${result.total}`,
        percent: result.percent,
        grade: result.grade,
        rank: result.rank,
      },
      breakdown: result.breakdown,
      message: result.percent === 100
        ? 'Perfect run. You are a frontier-class agent.'
        : `You earned ${result.percent}%. See breakdown for missed tasks.`,
    });
  }

  // --- leaderboard ---
  if (path === '/api/leaderboard') {
    return json(res, 200, { total_runs: totalRuns, recent });
  }

  // --- human landing page ---
  if (path === '/' || path === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(landingPage());
    return;
  }

  // --- health ---
  if (path === '/health') return json(res, 200, { ok: true });

  json(res, 404, { error: 'Not found', try: PROTOCOL.endpoints });
});

server.listen(PORT, () => console.log(`AI Agent Aptitude Test listening on :${PORT}`));
