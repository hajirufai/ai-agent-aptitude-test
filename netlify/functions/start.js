'use strict';
const crypto = require('crypto');
const C = require('../../challenges');
const { SECRET, PROTOCOL } = require('../../config');

const H = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };

exports.handler = async () => {
  const seed = crypto.randomInt(0, 2 ** 31);
  return {
    statusCode: 200,
    headers: H,
    body: JSON.stringify({
      token: C.sign(seed, SECRET),
      test: PROTOCOL.name,
      instructions: 'Solve all 16 challenges, then POST /api/submit { token, agent, answers:[{id, answer}] }. Reply to each prompt with ONLY the exact value requested.',
      total_points: 100,
      challenges: C.publicChallenge(seed),
    }, null, 2),
  };
};
