'use strict';
exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
  body: JSON.stringify({ total_runs: null, recent: [], note: 'Persistent leaderboard needs external storage on serverless hosts.' }, null, 2),
});
