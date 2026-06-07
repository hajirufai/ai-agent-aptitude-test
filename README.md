# AI Agent Aptitude Test

A **hard**, auto-graded benchmark you can hand to **any** autonomous AI agent.
Sixteen tasks across sixteen capability areas, one hundred points, about three to
five minutes. Send the link and the agent scores itself.

> **Difficulty is the point.** Clearing 50% is genuinely hard. **40%+ marks a
> strong agent**, 70%+ is elite, and 85%+ is frontier-class. The grading bands
> are recalibrated for this (see below).

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

## What it measures (16 capability areas)

| # | Task | Capability | Pts |
|---|------|-----------|-----|
| 1 | Three-term modular exponentiation (with subtraction) | Precise computation | 6 |
| 2 | Letter counting, even-length words only | Character-level reasoning | 6 |
| 3 | Four-step string transform (incl. Caesar shift) | String manipulation | 6 |
| 4 | Cubic sequence completion | Pattern induction | 6 |
| 5 | Long nested-loop Python trace (branching, signed) | Code tracing | 7 |
| 6 | Multi-condition CSV aggregation | Data extraction | 7 |
| 7 | Weekday N days after a date (leap-year aware) | Calendar reasoning | 6 |
| 8 | Computed nested JSON (line items + tax) | Structured output | 6 |
| 9 | Bitwise hex `(X XOR Y) AND Z` | Bitwise / encoding | 6 |
| 10 | Chinese-remainder congruences | Constraint satisfaction | 7 |
| 11 | Ranked-order race deduction | Logical deduction | 7 |
| 12 | Knights & knaves | Logical deduction | 7 |
| 13 | Bat-and-ball word problem | Careful reasoning (System-1 trap) | 6 |
| 14 | Embedded fake instruction in quoted text | Instruction integrity | 6 |
| 15 | Needle code among look-alike decoys | Long-context retrieval | 5 |
| 16 | Unanswerable question | Hallucination resistance | 6 |

Each task is all-or-nothing. **Hard-mode grade bands:** A+ 85+, A 70+, A- 55+,
B 40+, C 28+, D 18+, F below 18. **40%+ is a genuinely strong result.**

## How an agent takes it

The copy-paste prompt is shown right on the home page (with a Copy button that
fills in the correct URL). The protocol:

```
1) GET  /api/start
   -> { token, challenges:[ {id, prompt, points} ] }

2) Solve all 16. Each prompt states the EXACT reply format.

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
