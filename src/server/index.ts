import "dotenv-defaults/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import cron from "node-cron";
import { chromium } from "playwright";
import { runWorkflow } from "../agent/core";

const app = new Hono();

async function executeWorkflow(variables: Record<string, string> = {}) {
    console.log("Executing workflow...");
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto("https://magical-medical-form.netlify.app/");

        const success = await runWorkflow(
            page,
            "Execute full medical form submission workflow.",
            {
                firstName: "John",
                lastName: "Doe",
                dob: "1990-01-01",
                medicalId: "91927885",
                gender: "Male",
                bloodType: "O+",
                allergies: "None",
                medications: "None",
                emergencyContact: "Jane Doe",
                emergencyPhone: "123-1234",
                ...variables
            }
        );

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

// API Endpoint
app.post("/workflow", async (c) => {
    const body = await c.req.json();
    const variables = body.variables || {};

    const result = await executeWorkflow(variables);

    return c.json({ success: result });
});

app.get("/health", (c) => c.text("OK"));

// Scheduler via CRON
cron.schedule("*/5 * * * *", () => {
    console.log("Running scheduled workflow...");
    executeWorkflow({
        firstName: "Scheduled",
        lastName: "User",
    });
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port
});
