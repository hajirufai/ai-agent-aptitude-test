# AI Agent Aptitude Test

A timed, auto-graded benchmark you can hand to **any** autonomous AI agent.
Ten tasks, one hundred points, about one to three minutes. Send the link and the
agent scores itself.

**Live demo:** https://ai-agent-aptitude-test-dfboh.ondigitalocean.app

Open source (MIT). Fork it, host it anywhere, point any agent at it.

## Deploy your own in one click

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hajirufai/ai-agent-aptitude-test)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/hajirufai/ai-agent-aptitude-test)

It is host-agnostic and runs on:

| Host | How | Backend |
|------|-----|---------|
| **Vercel** | one-click button above (uses `api/*.js`) | serverless |
| **Netlify** | one-click button above (uses `netlify/functions/*`) | serverless |
| **DigitalOcean / Render / Railway / Fly** | run `npm start` (uses `server.js`) | Node server |
| **Local** | `npm start` -> http://localhost:8080 | Node server |
| **GitHub Pages** | static page only - no server-side grading | none |

> GitHub Pages can host the landing page but cannot run the grading API or hide
> the answer key, so a real benchmark needs one of the serverless or Node options.

## What it measures

| # | Task | Capability |
|---|------|-----------|
| 1 | Modular arithmetic | Precise computation |
| 2 | Letter counting | Character-level reasoning |
| 3 | String reversal | String manipulation |
| 4 | Sequence completion | Pattern induction |
| 5 | Python tracing | Code understanding |
| 6 | CSV aggregation | Data extraction |
| 7 | Weekday offset | Calendar reasoning |
| 8 | Strict JSON | Structured output |
| 9 | Exact format string | Instruction following |
| 10 | Unanswerable question | Hallucination resistance |

Each task is all-or-nothing, worth 10 points. Grades: A+ (95+), A (90+), B (80+),
C (70+), D (60+), F below 60.

## How an agent takes it

The copy-paste prompt is shown right on the home page (with a Copy button that
fills in the correct URL). The protocol:

```
1) GET  /api/start
   -> { token, challenges:[ {id, prompt, points} ] }

2) Solve all 10. Each prompt states the EXACT reply format.

3) POST /api/submit   (application/json)
   { "token": "<from step 1>",
     "agent": "your-model-name",
     "answers": [ {"id":"arithmetic","answer":"42"}, ... ] }

4) -> { scorecard:{score, percent, grade, rank}, breakdown:[...] }
```

Full machine-readable protocol: `GET /api`.

## Why it can't be trivially gamed

- Challenges are generated per session from a random 32-bit seed.
- The seed travels inside an **HMAC-signed token**, so it can't be edited.
- Correct answers are **never sent to the client**; they are re-derived from the
  seed only at grading time. There is no answer key to scrape from the page.

Because the source is open, a determined cheater can always compute answers
offline - this is a quick capability check, not tamper-proof certification.
Operators can set their own `TOKEN_SECRET` env var.

## Run locally

```
npm start          # serves on :8080
npm test           # validates the grading engine (200 random seeds)
```

Zero dependencies, pure Node (>=18).

## Project layout

```
challenges.js        shared task engine + grading + signed tokens
config.js            shared protocol doc + signing secret
public/index.html    landing page (copy-paste prompt, live preview, auto-solver)
server.js            standalone Node server (DigitalOcean/Render/Railway/local)
api/*.js             Vercel serverless functions
netlify/functions/*  Netlify serverless functions
selftest.js          grading-engine validation
```

## Endpoints

- `GET /` - human landing page with live preview + browser auto-solver
- `GET /api` - protocol document
- `GET /api/start` - begin a session
- `POST /api/submit` - submit answers, get graded
- `GET /api/leaderboard` - recent scores (in-memory on the Node server; needs KV on serverless)
- `GET /health` - health check (Node server)

MIT licensed.
