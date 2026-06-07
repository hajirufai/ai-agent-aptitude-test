'use strict';
const { send } = require('./_cors');

// On serverless hosts there is no shared memory between invocations, so a live
// leaderboard would need external storage (e.g. Vercel KV / Upstash Redis).
// This endpoint stays for API compatibility and documents how to enable it.
module.exports = (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  return send(res, 200, {
    total_runs: null,
    recent: [],
    note: 'Persistent leaderboard is disabled on serverless hosts. Wire up Vercel KV or Upstash Redis to enable it. The standalone Node server (server.js) keeps an in-memory leaderboard.',
  });
};
