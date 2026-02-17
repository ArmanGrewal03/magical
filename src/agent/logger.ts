
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

        // Create an initial empty log file
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
  <title>Workflow Execution Audit</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #f0f2f5; }
    .step { background: white; margin-bottom: 20px; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
    .agent-badge { background: #007bff; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
    .thought { background: #f8f9fa; padding: 10px; border-left: 4px solid #007bff; margin: 10px 0; white-space: pre-wrap; }
    .tools { margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; }
    .screenshot { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; margin-top: 10px; }
    .timestamp { color: #666; }
  </style>
</head>
<body>
  <h1>Workflow Execution Audit</h1>
  ${this.logs.map(log => `
    <div class="step">
      <div class="header">
        <div>
           <strong>Step ${log.step}</strong> <span class="agent-badge">${log.agent}</span>
        </div>
        <div class="timestamp">${new Date(log.timestamp).toLocaleTimeString()}</div>
      </div>
      
      <div class="thought">
        <strong>Thought:</strong><br>
        ${log.thought}
      </div>

      ${log.screenshotPath ? `
        <div>
          <strong>Screenshot:</strong><br>
          <img src="./${path.basename(log.screenshotPath)}" class="screenshot" />
        </div>
      ` : ''}

      ${log.toolCalls.length > 0 ? `
        <div class="tools">
          <strong>Tool Calls:</strong>
          <ul>
            ${log.toolCalls.map((tc, i) => `
              <li>
                <strong>${tc.name}</strong>(${JSON.stringify(tc.args)})
                <br>
                <em>Result:</em> ${JSON.stringify(log.toolResults[i] || "Pending")}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>`;

        fs.writeFileSync(path.join(this.logDir, "report.html"), html);
    }
}
