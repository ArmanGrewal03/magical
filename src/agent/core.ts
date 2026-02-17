import { Page } from "playwright";
import { runAgentTask } from "./worker";
import { WorkflowLogger } from "./logger";
import { verifySuccess } from "./verifier";

// The Supervisor Orchestrator
export async function runWorkflow(page: Page, goal: string, variables: Record<string, string> = {}) {
    // Initialize Logger
    const logger = new WorkflowLogger();
    console.log(`Starting Multi-Agent Workflow. Logs at: ${logger.getLogDir()}`);

    // Create Variable Context String
    const varContext = Object.entries(variables).map(([k, v]) => `- ${k}: ${v}`).join("\n");

    try {
        // Step 1: Personal Info Agent
        console.log("--- Spawning: PersonalInformationAgent ---");
        const personalInfoSuccess = await runAgentTask(
            page,
            `You are the 'PersonalInformationAgent'. 
             Your goal is to fill out the 'Personal Information' section of the form.
             Use the 'getPageState' tool to understand the fields available (e.g. First Name, Last Name, DOB, Medical ID).
             Use the 'fillField' tool to fill them.
             
             Context Variables:
             ${varContext}
             
             Instructions:
             1. Look at the page.
             2. Identify the fields for First Name, Last Name, Date of Birth, and Medical ID.
             3. Fill them out using the variables provided.
             4. Once filled, stop. DO NOT click buttons to open other sections.
             
             Takes a screenshot named 'personal_info_filled' when done.
            `,
            logger,
            "PersonalInformationAgent"
        );
        if (!personalInfoSuccess) throw new Error("PersonalInformationAgent failed.");

        // Step 2: Medical Info Agent
        console.log("--- Spawning: MedicalInformationAgent ---");
        const medicalInfoSuccess = await runAgentTask(
            page,
            `You are the 'MedicalInformationAgent'.
             Your goal is to fill out the 'Medical Information' section.
             
             Context Variables:
             ${varContext}
             
             Instructions:
             1. Find and click the button that opens 'Medical Information' (it might be an accordion).
             2. Wait for the section to open.
             3. Fill out Gender, Blood Type, Allergies, and Medications.
             4. Use 'fillField' or 'selectOption' as appropriate.
             5. Once filled, stop.
             
             Takes a screenshot named 'medical_info_filled' when done.
            `,
            logger,
            "MedicalInformationAgent"
        );
        if (!medicalInfoSuccess) throw new Error("MedicalInformationAgent failed.");

        // Step 3: Emergency Contact Agent
        console.log("--- Spawning: EmergencyContactAgent ---");
        const emergencySuccess = await runAgentTask(
            page,
            `You are the 'EmergencyContactAgent'.
             Your goal is to fill out the 'Emergency Contact' section.
             
             Context Variables:
             ${varContext}
             
             Instructions:
             1. Find and click the button that opens 'Emergency Contact'.
             2. Fill out Emergency Contact Name and Phone Number.
             3. Once filled, stop.
             
             Takes a screenshot named 'emergency_info_filled' when done.
            `,
            logger,
            "EmergencyContactAgent"
        );
        if (!emergencySuccess) throw new Error("EmergencyContactAgent failed.");

        // Step 4: Submission Agent
        console.log("--- Spawning: SubmissionAgent ---");
        const submissionSuccess = await runAgentTask(
            page,
            `You are the 'SubmissionAgent'.
             Your goal is to submit the form and verify success.
             
             Instructions:
             1. Find and click the 'Submit' button.
             2. Check for success message or URL change.
             3. Take a final screenshot named 'submission_complete'.
            `,
            logger,
            "SubmissionAgent"
        );

        // Final Global Verification
        const finalSuccess = await verifySuccess(page);
        if (finalSuccess) {
            console.log(`Workflow Completion Success! Report generated at ${logger.getLogDir()}/report.html`);
            return true;
        } else {
            // Fallback: Use Human in the Loop if autonomous verification fails?
            // For now, just log failure.
            console.log("Automated verification failed.");
            return false;
        }

    } catch (error) {
        console.error("Workflow Orchestration Error:", error);
        return false;
    }
}
