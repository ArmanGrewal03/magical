import { chromium } from "playwright";
import { runWorkflow } from "./agent/core";

export async function main() {
  console.log("Starting execution via main.ts...");

  const browser = await chromium.launch({
    args: ["--window-size=1366,768"],
    headless: false
  });

  let success = false;
  try {
    const page = await browser.newPage();
    await page.goto("https://magical-medical-form.netlify.app/");

    // Define variables (could come from env or args)
    const variables = {
      firstName: "John",
      lastName: "Doe",
      dob: "1990-01-01",
      medicalId: "91927885",
      gender: "Male",
      bloodType: "O+",
      allergies: "Penicillin",
      medications: "None",
      emergencyContact: "Jane Doe",
      emergencyPhone: "555-0123"
    };

    success = await runWorkflow(page, "Fill out the complete medical form for John Doe, including personal information, medical history, and emergency contact.", variables);

  } catch (error) {
    console.error("Main execution error:", error);
  } finally {
    if (browser) await browser.close();
  }
  if (success) {
    console.log("Workflow completed successfully.");
  } else {
    console.log("Workflow failed.");
  }
}
