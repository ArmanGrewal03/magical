# Magical Take-Home

Multi-agent browser automation for filling out medical forms. Built with TypeScript, Playwright, and Gemini.

## What It Does

Fills out the [Magical medical form](https://magical-medical-form.netlify.app/) using AI agents. Each agent handles one section:
- Personal info (name, DOB, medical ID)
- Medical info (gender, blood type, allergies)
- Emergency contact
- Form submission

## Quick Start

```bash
npm install
npx playwright install
```

Create `.env`:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

Run it:
```bash
npm run dev
```

Check `run_logs/` for the HTML report with screenshots.

## Commands

```bash
npm run dev              # Run once
npm run eval             # Run 3 times, get success rate
npm run start:server     # Start API + CRON scheduler
```

## API Usage

```bash
curl -X POST http://localhost:3000/workflow \
  -H "Content-Type: application/json" \
  -d '{"variables": {"firstName": "John", "lastName": "Doe"}}'
```

## How It Works

**Multi-Agent Pattern**: One supervisor coordinates 4 specialized agents. Each agent has a narrow job, which reduces errors.

**Smart Tools**: Instead of brittle CSS selectors, tools find elements by label, role, or text. If the HTML changes slightly, it still works.

**Audit Logs**: Every run saves an HTML report with screenshots and reasoning steps.

**Human Fallback**: If automated verification fails, it asks you to confirm success.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full diagram and design decisions.

## Project Structure

```
src/
├── agent/
│   ├── core.ts       # Supervisor
│   ├── worker.ts     # Agent loop
│   ├── tools.ts      # Smart tools
│   └── logger.ts     # HTML reports
├── scripts/
│   └── run_evals.ts  # Evaluation framework
└── server/
    └── index.ts      # API + CRON
```

## Bonus Features

- ✅ Handles complex accordion navigation
- ✅ REST API endpoint
- ✅ Dynamic variable passing
- ✅ CRON scheduling (every 5 min)
- ✅ Multi-agent framework with evals
