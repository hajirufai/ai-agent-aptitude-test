'use strict';
// Shared helper for the Vercel serverless functions.
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
}
function send(res, code, obj) {
  cors(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(code).send(JSON.stringify(obj, null, 2));
}
function readJson(req) {
  // Vercel parses JSON bodies automatically when Content-Type is set, but fall
  // back to manual parsing for safety.
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => { d += c; });
    req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch (_) { resolve({}); } });
  });
}
module.exports = { cors, send, readJson };
