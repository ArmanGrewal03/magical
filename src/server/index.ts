import "dotenv-defaults/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import cron from "node-cron";
import { chromium } from "playwright";
import { runWorkflow } from "../agent/core";

const app = new Hono();

// Helper to run workflow in a fresh browser context
async function executeWorkflow(variables: Record<string, string> = {}) {
    console.log("Executing workflow...");
    const browser = await chromium.launch({ headless: false }); // Headless false for demo/debug
    const page = await browser.newPage();

    try {
        // Navigate to start
        await page.goto("https://magical-medical-form.netlify.app/");

        // Run the agent
        const success = await runWorkflow(page, "Fill out the medical form with the provided details.", variables);

        if (success) {
            console.log("Workflow completed successfully.");
        } else {
            console.log("Workflow failed.");
        }

        return success;
    } catch (err) {
        console.error("Fatal workflow error:", err);
        return false;
    } finally {
        await browser.close();
    }
}

// API Endpoint to trigger workflow
app.post("/workflow", async (c) => {
    const body = await c.req.json();
    const variables = body.variables || {};

    // triggers asynchronously to not block response? 
    // For this demo, let's await it so we can see result in response
    const result = await executeWorkflow(variables);

    return c.json({ success: result });
});

app.get("/health", (c) => c.text("OK"));

// Scheduler: Run every 5 minutes
cron.schedule("*/5 * * * *", () => {
    console.log("Running scheduled workflow...");
    executeWorkflow({
        firstName: "Scheduled",
        lastName: "User",
        // We can add logic to randomize this if needed
    });
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port
});
