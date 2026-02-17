import { chromium } from "playwright";
import { runWorkflow } from "./agent/core";

export async function main() {
  console.log("Starting execution via main.ts...");

  const browser = await chromium.launch({
    args: ["--window-size=1366,768"],
    headless: false
  });

  try {
    const page = await browser.newPage();
    await page.goto("https://magical-medical-form.netlify.app/");

    // Define variables (could come from env or args)
    const variables = {
      firstName: "John",
      lastName: "Doe",
      dob: "1990-01-01",
      medicalId: "91927885"
    };

    await runWorkflow(page, "Fill out the medical form for John Doe.", variables);

  } catch (error) {
    console.error("Main execution error:", error);
  } finally {
    await browser.close();
  }
}
