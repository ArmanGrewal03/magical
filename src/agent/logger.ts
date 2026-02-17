
import * as fs from "fs";
import * as path from "path";

export interface LogEntry {
  step: number;
  agent: string;
  thought: string;
  toolCalls: { name: string; args: any }[];
  toolResults: any[];
  screenshotPath?: string;
  timestamp: string;
}

export class WorkflowLogger {
  private logs: LogEntry[] = [];
  private logDir: string;
  private logFile: string;

  constructor(baseDir: string = "run_logs") {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.logDir = path.join(process.cwd(), baseDir, timestamp);
    this.logFile = path.join(this.logDir, "workflow_log.json");

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    fs.writeFileSync(this.logFile, JSON.stringify([], null, 2));
  }

  getLogDir(): string {
    return this.logDir;
  }

  logStep(entry: LogEntry) {
    this.logs.push(entry);
    this.save();
  }

  save() {
    fs.writeFileSync(this.logFile, JSON.stringify(this.logs, null, 2));
    this.generateHtmlReport();
  }

  private generateHtmlReport() {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Workflow Log</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 14px;
          padding: 20px;
        }
        h1 {
          font-size: 18px;
        }
        .step {
          margin-bottom: 30px;
        }
        pre {
          background: #f5f5f5;
          padding: 10px;
          overflow-x: auto;
        }
        img {
          max-width: 600px;
          display: block;
          margin-top: 10px;
        }
        hr {
          margin: 30px 0;
        }
      </style>
    </head>
    <body>

    <h1>Workflow Log</h1>

    ${this.logs.map(log => `
      <div class="step">
        <strong>Step:</strong> ${log.step}<br>
        <strong>Agent:</strong> ${log.agent}<br>
        <strong>Time:</strong> ${log.timestamp}

        <h3>Thought</h3>
        <pre>${log.thought}</pre>

        ${log.toolCalls.length > 0 ? `
          <h3>Tool Calls</h3>
          <pre>${JSON.stringify(log.toolCalls, null, 2)}</pre>

          <h3>Tool Results</h3>
          <pre>${JSON.stringify(log.toolResults, null, 2)}</pre>
        ` : ''}

        ${log.screenshotPath ? `
          <h3>Screenshot</h3>
          <img src="./${path.basename(log.screenshotPath)}" />
        ` : ''}

        <hr>
      </div>
    `).join("")}

    </body>
    </html>
    `;

    fs.writeFileSync(path.join(this.logDir, "report.html"), html);
  }
}
