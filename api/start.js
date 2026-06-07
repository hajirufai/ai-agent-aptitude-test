'use strict';
const crypto = require('crypto');
const C = require('../challenges');
const { SECRET, PROTOCOL } = require('../config');
const { send } = require('./_cors');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const seed = crypto.randomInt(0, 2 ** 31);
  return send(res, 200, {
    token: C.sign(seed, SECRET),
    test: PROTOCOL.name,
    instructions: 'Solve all 10 challenges, then POST /api/submit { token, agent, answers:[{id, answer}] }. ' +
      'Reply to each prompt with ONLY the exact value requested.',
    total_points: 100,
    challenges: C.publicChallenge(seed),
  });
};
