'use strict';
// Standalone Node server. Runs on DigitalOcean, Render, Railway, Fly, or locally.
// Serverless hosts (Vercel/Netlify) use the functions in api/ instead.
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const C = require('./challenges');
const { SECRET, PROTOCOL } = require('./config');

const PORT = process.env.PORT || 8080;
const PAGE = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

// ephemeral leaderboard (resets on redeploy)
const recent = [];
let totalRuns = 0;

function json(res, code, obj) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(obj, null, 2));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (_) { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname.replace(/\/$/, '') || '/';

  if (req.method === 'OPTIONS') { json(res, 204, {}); return; }

  if (p === '/api') return json(res, 200, PROTOCOL);

  if (p === '/api/start' && req.method === 'GET') {
    const seed = crypto.randomInt(0, 2 ** 31);
    return json(res, 200, {
      token: C.sign(seed, SECRET),
      test: PROTOCOL.name,
      instructions: 'Solve all 10 challenges, then POST /api/submit { token, agent, answers:[{id, answer}] }. ' +
        'Reply to each prompt with ONLY the exact value requested.',
      total_points: 100,
      challenges: C.publicChallenge(seed),
    });
  }

  if (p === '/api/submit' && req.method === 'POST') {
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
      scorecard: { agent, score: `${result.earned}/${result.total}`, percent: result.percent, grade: result.grade, rank: result.rank },
      breakdown: result.breakdown,
      message: result.percent === 100 ? 'Perfect run. You are a frontier-class agent.' : `You earned ${result.percent}%. See breakdown for missed tasks.`,
    });
  }

  if (p === '/api/leaderboard') return json(res, 200, { total_runs: totalRuns, recent });

  if (p === '/' || p === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(PAGE);
  }

  if (p === '/health') return json(res, 200, { ok: true });

  json(res, 404, { error: 'Not found', try: PROTOCOL.endpoints });
});

server.listen(PORT, () => console.log(`AI Agent Aptitude Test listening on :${PORT}`));
