import { generateText, CoreMessage, tool } from "ai";
import { Page } from "playwright";
import * as fs from "fs";
import { createAgentTools } from "./tools";
import { verifySuccess } from "./verifier";
import { model } from "../_internal/setup";

interface AgentStep {
    step: number;
    thought: string;
    action: string; // JSON string of tool calls
    result: string; // JSON string of tool results
    timestamp: string;
}

export async function runWorkflow(page: Page, goal: string, variables: Record<string, string> = {}) {
    const tools = createAgentTools(page);
    const maxSteps = 20;
    let steps = 0;
    const logs: AgentStep[] = [];
    const logFile = "run_logs.json";

    console.log(`Starting workflow: ${goal}`);
    console.log(`Variables:`, variables);

    // Initialize messages with system prompt and user goal
    const messages: CoreMessage[] = [
        {
            role: "system",
            content: `You are a precise browser automation agent. 
      Your goal is to complete the form submission workflow designated by the user.
      
      IMPORTANT: Use CSS selectors for form fields. The form has these fields:
      - First Name: #firstName
      - Last Name: #lastName  
      - Date of Birth: #dateOfBirth
      - Medical ID: #medicalId
      - To expand "Personal Information" section: button:has-text("Personal Information")
      - Submit button: button:has-text("Submit")
      
      ALWAYS use getPageState first if you need to see the page structure.
      Verify your actions were successful by checking the result messages.
      If you encounter an error, try a different selector or approach.
      The user has provided the following variables: ${JSON.stringify(variables)}`
        },
        {
            role: "user",
            content: `Goal: ${goal}\nCurrent URL: ${page.url()}`
        }
    ];

    // Start log file
    fs.writeFileSync(logFile, JSON.stringify([], null, 2));

    while (steps < maxSteps) {
        steps++;
        console.log(`--- Step ${steps} ---`);

        try {
            // Generate text with tools
            const response = await generateText({
                model,
                messages,
                tools: tools,
                maxSteps: 5, // Allow multi-step reasoning/tool calls in one go if needed
            });

            // Add the assistant's response to history
            const content: any[] = [];
            if (response.text) {
                content.push({ type: "text", text: response.text });
            }
            if (response.toolCalls) {
                response.toolCalls.forEach(tc => {
                    content.push({ type: "tool-call", toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.args });
                });
            }

            messages.push({
                role: "assistant",
                content: content as any,
            });

            // Also add tool results to history if any
            if (response.toolResults && response.toolResults.length > 0) {
                messages.push({
                    role: "tool",
                    content: response.toolResults,
                });
            }

            // Log the step (structured logging)
            const stepLog: AgentStep = {
                step: steps,
                thought: response.text || "No text thought (Tool call only)",
                action: JSON.stringify(response.toolCalls),
                result: JSON.stringify(response.toolResults),
                timestamp: new Date().toISOString(),
            };
            logs.push(stepLog);
            fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

            console.log(`Thought: ${stepLog.thought}`);
            if (response.toolCalls?.length) {
                console.log(`Tool Calls: ${response.toolCalls.map(tc => tc.toolName).join(", ")}`);
            }

            // Check for success via verifying logic
            // Note: We check AFTER the model has acted.
            const success = await verifySuccess(page);
            if (success) {
                console.log("Success criteria met based on verification!");
                return true;
            }

            // If the model decides it is done, it might just stop calling tools.
            // But we enforce "success" via verifySuccess. 
            // If no tools called and verifySuccess is false, we might be stuck.
            // We can prompt it to continue if needed, but the loop continues naturally.
            // Let's inject current URL to keep it grounded if it's struggling?
            // For now, relies on the `toolResults` from `navigate` etc to provide feedback.

        } catch (error: any) {
            console.error("Error during step:", error);

            messages.push({
                role: "user",
                content: `Error occurred: ${error}. Please try to fix or try a different approach.`
            });
        }
    }

    console.log("Max steps reached without success.");
    return false;
}
