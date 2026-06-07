'use strict';
const { PROTOCOL } = require('../../config');
exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
  body: JSON.stringify(PROTOCOL, null, 2),
});
