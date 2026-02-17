
import "dotenv-defaults/config";
import { chromium, Browser } from "playwright";
import { runWorkflow } from "../agent/core";
import * as fs from "fs";
import * as path from "path";

interface EvalResult {
    iteration: number;
    success: boolean;
    durationMs: number;
    logDir?: string;
    error?: string;
}

async function runEvals(iterations: number = 3) {
    console.log(`\nStarting evaluations (${iterations} runs)\n`);
    const results: EvalResult[] = [];
    const startTimeGlobal = Date.now();
    const evalReportPath = path.join(process.cwd(), "evals_report.json");

    for (let i = 1; i <= iterations; i++) {
        console.log(`\nRun ${i}/${iterations}`);
        const result = await runSingleEval(i);
        results.push(result);

        const status = result.success ? "Passed" : "Failed";
        console.log(`Result: ${status} | Time: ${(result.durationMs / 1000).toFixed(2)}s`);
    }

    const endTimeGlobal = Date.now();

    const successfulRuns = results.filter(r => r.success);
    const failedRuns = results.filter(r => !r.success);
    const successRate = (successfulRuns.length / iterations) * 100;
    const avgDuration = results.reduce((sum, r) => sum + r.durationMs, 0) / iterations;

    console.log("\n========================================");
    console.log("Evaluation Summary");
    console.log("========================================");
    console.log(`Total Runs:      ${iterations}`);
    console.log(`Success Rate:    ${successRate.toFixed(1)}%`);
    console.log(`Avg Duration:    ${(avgDuration / 1000).toFixed(2)}s`);
    console.log(`Total Time:      ${((endTimeGlobal - startTimeGlobal) / 1000).toFixed(2)}s`);
    console.log("========================================\n");

    if (failedRuns.length > 0) {
        console.log("Failed Runs:");
        failedRuns.forEach(r => {
            console.log(`- Run ${r.iteration}: ${r.error || "Unknown Error"}`);
        });
    }

    const report = {
        timestamp: new Date().toISOString(),
        config: { iterations },
        metrics: {
            successRate,
            avgDurationMs: avgDuration,
            totalDurationMs: endTimeGlobal - startTimeGlobal
        },
        runs: results
    };

    fs.writeFileSync(evalReportPath, JSON.stringify(report, null, 2));
    console.log(`\n Report saved to: ${evalReportPath}`);
}

async function runSingleEval(iteration: number): Promise<EvalResult> {
    let browser: Browser | null = null;
    const startTime = Date.now();

    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto("https://magical-medical-form.netlify.app/");

        const variables = {
            firstName: "EvalUser",
            lastName: `Test${iteration}`,
            dob: "1995-05-05",
            medicalId: `EVAL-${Date.now()}`,
            gender: "Male",
            bloodType: "A+",
            allergies: "None",
            medications: "None",
            emergencyContact: "Supervisor",
            emergencyPhone: "555-9999"
        };

        const success = await runWorkflow(
            page,
            "Complete the medical form for evaluation purposes.",
            variables
        );

        const duration = Date.now() - startTime;
        return {
            iteration,
            success,
            durationMs: duration,
        };

    } catch (error: any) {
        return {
            iteration,
            success: false,
            durationMs: Date.now() - startTime,
            error: error.message || String(error)
        };
    } finally {
        if (browser) await browser.close();
    }
}

const args = process.argv.slice(2);
const numRuns = args[0] ? parseInt(args[0], 10) : 3;

runEvals(numRuns).catch(console.error);
