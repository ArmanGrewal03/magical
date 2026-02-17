# Magical Agentic Workflow

This repository contains a robust, multi-agent browser automation framework built for the Magical Junior Software Engineer take-home challenge. It meets all core requirements and includes several enhancements inspired by Magical's engineering philosophy: multi-agent orchestration, human-in-the-loop fallback, and automated evaluations.

## Key Features

*   **Multi-Agent Architecture**: Uses a **Supervisor-Worker** pattern. A main orchestrator spawns specialized agents (`PersonalInformationAgent`, `MedicalInformationAgent`, `EmergencyContactAgent`, `SubmissionAgent`) to handle distinct parts of the workflow. This reduces context window usage and hallucinations.
*   **Reliability & Auditing**: Every run generates a detailed **HTML Report** with screenshots and reasoning traces, saved to `run_logs/`.
*   **Self-Healing Selectors**: Agents use "smart" tools that locate elements by Label, Role, or Text, ensuring resilience against minor UI changes.
*   **Human-in-the-Loop**: Includes an `askHuman` tool that allows an agent to pause and request help via the console if it gets stuck.
*   **Automated Evaluations**: Includes a dedicated script (`npm run eval`) to run multiple iterations and calculate a Reliability Score (Success Rate & Avg Duration).
*   **API & Scheduling**: A Hono server exposes a REST endpoint and runs a cron job for automated execution.

## Why This Architecture?

1.  **Reliability First**: The prompt highlighted that "Magical's agents are purpose-built to be predictable."
    *   **Solution**: I implemented a **Supervisor-Worker** pattern. Instead of one large prompt, specialized agents (`MedicalInformationAgent`, `EmergencyContactAgent`) focus on small, isolated tasks. This significantly reduces hallucinations.
2.  **Auditability**: "Auditing, recording, and keeping track of every reasoning step."
    *   **Solution**: Every run generates a **Visual HTML Report** (with step-by-step screenshots and reasoning logs) locally in `run_logs/`. This provides full transparency into *why* the agent took an action.
3.  **Evaluations**: "Use evals frameworks... to decide which model is best."
    *   **Solution**: I built a dedicated `npm run eval` script that runs the workflow `N` times to calculate a **Reliability Score (Success Rate)**. This ensures code changes don't silently break the agent.
4.  **Resilience**: The video showed an agent navigating through complex workflows.
    *   **Solution**: My `click` and `fillField` tools use "fuzzy matching" strategies (Label -> Role -> Text -> Selector) to "self-heal" if the underlying HTML changes slightly.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    npx playwright install
    ```

2.  **Configure Environment**
    Create a `.env` file with your Gemini API key:
    ```bash
    GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
    ```

## Usage

### 1. Run the Agent (Local Dev)
Executes a single run of the workflow with full logging.
```bash
npm run dev
```
Check the `run_logs/` folder for the generated HTML report.

### 2. Run Evaluations (Reliability Test)
Runs the workflow `N` times (default: 3) to measure stability and performance.
```bash
npm run eval         # Runs 3 times
npm run eval 5       # Runs 5 times
```

### 3. Start the Server (API & Cron)
Starts the Hono server with a POST endpoint and a 5-minute cron scheduler.
```bash
npm run start:server
```
**Trigger via API:**
```bash
curl -X POST http://localhost:3000/workflow \
  -H "Content-Type: application/json" \
  -d '{"variables": {"firstName": "API", "lastName": "User"}}'
```

## Project Structure

*   **src/agent/core.ts**: The Supervisor orchestrator logic.
*   **src/agent/worker.ts**: The reusable Worker Agent loop.
*   **src/agent/tools.ts**: Smart tools (fillField, click) with fuzzy matching.
*   **src/agent/logger.ts**: Structured logging and HTML report generation.
*   **src/scripts/run_evals.ts**: The evaluation framework script.
*   **src/server/**: Hono server and cron job configuration.

## Bonus Points Implemented
1.  **Complex Form Handling**: Dynamic accordion navigation (Medical/Emergency sections).
2.  **API Endpoint**: Trigger runs remotely via `POST /workflow`.
3.  **Dynamic Variables**: Prompt accepts custom variables.
4.  **Scheduling**: Cron job runs every 5 minutes.
5.  **Something Else**: Implemented a **Multi-Agent Framework**, **Evaluations Script**, and **Visual Audit Logs**.
