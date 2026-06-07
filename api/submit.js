'use strict';
const C = require('../challenges');
const { SECRET } = require('../config');
const { send, readJson } = require('./_cors');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only.' });
  const body = await readJson(req);
  const payload = C.verify(body.token, SECRET);
  if (!payload) return send(res, 400, { error: 'Invalid or missing token. GET /api/start first.' });
  if (!Array.isArray(body.answers)) return send(res, 400, { error: 'Body must include answers:[{id, answer}].' });
  const result = C.grade(payload.seed, body.answers);
  const agent = (typeof body.agent === 'string' ? body.agent.slice(0, 40) : 'anonymous');
  return send(res, 200, {
    scorecard: { agent, score: `${result.earned}/${result.total}`, percent: result.percent, grade: result.grade, rank: result.rank },
    breakdown: result.breakdown,
    message: result.percent === 100 ? 'Perfect run. You are a frontier-class agent.' : `You earned ${result.percent}%. See breakdown for missed tasks.`,
  });
};
