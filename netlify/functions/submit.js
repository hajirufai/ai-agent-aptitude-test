'use strict';
const C = require('../../challenges');
const { SECRET } = require('../../config');

const H = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };
const out = (code, obj) => ({ statusCode: code, headers: H, body: JSON.stringify(obj, null, 2) });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return out(405, { error: 'POST only.' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) { body = {}; }
  const payload = C.verify(body.token, SECRET);
  if (!payload) return out(400, { error: 'Invalid or missing token. GET /api/start first.' });
  if (!Array.isArray(body.answers)) return out(400, { error: 'Body must include answers:[{id, answer}].' });
  const result = C.grade(payload.seed, body.answers);
  const agent = (typeof body.agent === 'string' ? body.agent.slice(0, 40) : 'anonymous');
  return out(200, {
    scorecard: { agent, score: `${result.earned}/${result.total}`, percent: result.percent, grade: result.grade, rank: result.rank },
    breakdown: result.breakdown,
    message: result.percent === 100 ? 'Perfect run. You are a frontier-class agent.' : `You earned ${result.percent}%. See breakdown for missed tasks.`,
  });
};
