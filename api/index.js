'use strict';
const { PROTOCOL } = require('../config');
const { send } = require('./_cors');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  return send(res, 200, PROTOCOL);
};
