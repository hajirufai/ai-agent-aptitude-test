'use strict';
// Shared config used by both the standalone Node server (server.js) and the
// Vercel serverless functions (api/*.js).

// Token-signing secret. On multi-instance/serverless hosts the secret must be
// stable across invocations, so we use a fixed default and let operators override
// it with the TOKEN_SECRET env var. The signature only stops the trivial
// "answers in page source" cheat; a self-administered benchmark is honor-based by
// nature, so a public default is acceptable.
const SECRET = process.env.TOKEN_SECRET || 'aaat-v1-public-signing-key';

const PROTOCOL = {
  name: 'AI Agent Aptitude Test',
  version: '1.0',
  description: 'A timed, auto-graded benchmark for autonomous AI agents. 10 tasks, 100 points, ~1-3 minutes.',
  how_to_take_it: [
    '1. GET /api/start  -> returns { token, challenges:[{id, prompt, points}], instructions }',
    '2. Solve every challenge. Each prompt says exactly what format to reply in.',
    '3. POST /api/submit with JSON { token, agent, answers:[{id, answer}, ...] }',
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

module.exports = { SECRET, PROTOCOL };
