
import "dotenv-defaults/config";
import { chromium, Browser } from "playwright";
import { runWorkflow } from "../agent/core";
import * as fs from "fs";
import * as path from "path";

// 1. Define Typed Interface for Result
interface EvalResult {
    iteration: number;
    success: boolean;
    durationMs: number;
    logDir?: string;
    error?: string;
}

// 2. Main Eval Function
async function runEvals(iterations: number = 5) {
    console.log(`\n🧪 STARTING EVALUATIONS (${iterations} Runs)\n`);
    const results: EvalResult[] = [];
    const startTimeGlobal = Date.now();
    const evalReportPath = path.join(process.cwd(), "evals_report.json");

    for (let i = 1; i <= iterations; i++) {
        console.log(`\n--- Run ${i}/${iterations} ---`);
        const result = await runSingleEval(i);
        results.push(result);

        // Immediate Feedback
        const status = result.success ? "✅ SUCCESS" : "❌ FAILED";
        console.log(`Result: ${status} | Time: ${(result.durationMs / 1000).toFixed(2)}s`);
    }

    const endTimeGlobal = Date.now();

    // 3. calculate Stats
    const successfulRuns = results.filter(r => r.success);
    const failedRuns = results.filter(r => !r.success);
    const successRate = (successfulRuns.length / iterations) * 100;
    const avgDuration = results.reduce((sum, r) => sum + r.durationMs, 0) / iterations;

    // 4. Output Summary
    console.log("\n========================================");
    console.log("📊 EVALUATION SUMMARY");
    console.log("========================================");
    console.log(`Total Runs:      ${iterations}`);
    console.log(`Success Rate:    ${successRate.toFixed(1)}%`);
    console.log(`Avg Duration:    ${(avgDuration / 1000).toFixed(2)}s`);
    console.log(`Total Time:      ${((endTimeGlobal - startTimeGlobal) / 1000).toFixed(2)}s`);
    console.log("========================================\n");

    if (failedRuns.length > 0) {
        console.log("⚠️ FAILED RUNS:");
        failedRuns.forEach(r => {
            console.log(`- Run ${r.iteration}: ${r.error || "Unknown Error"}`);
        });
    }

    // 5. Save Report to Disk
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
    console.log(`\nDetailed report saved to: ${evalReportPath}`);
}

// 6. Helper to run a single iteration
async function runSingleEval(iteration: number): Promise<EvalResult> {
    let browser: Browser | null = null;
    const startTime = Date.now();

    try {
        browser = await chromium.launch({ headless: true }); // Headless for speed during evals
        const page = await browser.newPage();

        // Navigate
        await page.goto("https://magical-medical-form.netlify.app/");

        // Define test variables (randomized slightly if needed to test robustness)
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

        // Run Agent
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

// Execute
// Allow passing number of iterations as CLI arg
const args = process.argv.slice(2);
const numRuns = args[0] ? parseInt(args[0], 10) : 3; // Default to 3 for quick checking

runEvals(numRuns).catch(console.error);
