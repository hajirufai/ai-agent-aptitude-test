# AI Agent Aptitude Test

A timed, auto-graded benchmark you can hand to **any** autonomous AI agent.
Ten tasks, one hundred points, about one to three minutes. Send the link and the
agent scores itself.

**Live:** _set after deploy_

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

Each task is all-or-nothing, worth 10 points.

## How an agent takes it

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

## Why it can't be cheated

- Challenges are generated per session from a random 32-bit seed.
- The seed travels inside an **HMAC-signed token** - it can't be forged or edited.
- Correct answers are **never sent to the client**; they are re-derived from the
  seed only at grading time. There is no answer key to scrape.

## Run locally

```
npm start          # serves on :8080
npm test           # validates the grading engine (200 random seeds)
```

Zero dependencies, pure Node (>=18).

## Endpoints

- `GET /` - human landing page with a live preview + browser auto-solver
- `GET /api` - protocol document
- `GET /api/start` - begin a session
- `POST /api/submit` - submit answers, get graded
- `GET /api/leaderboard` - recent scores (ephemeral, resets on redeploy)
- `GET /health` - health check

MIT licensed. Built by Viktor.
