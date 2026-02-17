
import { generateText, CoreMessage } from "ai";
import { Page } from "playwright";
import { createAgentTools } from "./tools";
import { model } from "../_internal/setup";
import { WorkflowLogger } from "./logger";

export async function runAgentTask(
    page: Page,
    systemPrompt: string,
    logger: WorkflowLogger,
    agentName: string,
    maxSteps: number = 10
): Promise<boolean> {

    const tools = createAgentTools(page, logger.getLogDir());
    const messages: CoreMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Start the task. Current URL: ${page.url()}` }
    ];

    let currentStepCount = 0;

    try {
        console.log(`[${agentName}] Starting task...`);
        const result = await generateText({
            model,
            messages, // Initial messages
            tools,
            maxSteps: maxSteps, // Allow the model to run its course
            onStepFinish: async ({ text, toolCalls, toolResults }) => {
                currentStepCount++;
                console.log(`[${agentName}] Step ${currentStepCount} finished.`);

                // Log securely
                logger.logStep({
                    step: currentStepCount,
                    agent: agentName,
                    thought: text,
                    toolCalls: toolCalls ? toolCalls.map(tc => ({ name: tc.toolName, args: tc.args })) : [],
                    toolResults: toolResults ? toolResults.map(tr => tr.result) : [],
                    timestamp: new Date().toISOString(),
                    screenshotPath: toolResults?.find(r => r.result?.toString().includes("Screenshot saved"))?.result?.toString().split(" to ")[1]?.trim()
                });
            },
        });

        console.log(`[${agentName}] Task completed.`);
        return true;

    } catch (error) {
        console.error(`[${agentName}] Crashed:`, error);
        // Log the crash
        logger.logStep({
            step: currentStepCount + 1,
            agent: agentName,
            thought: "CRASHED",
            toolCalls: [],
            toolResults: [`Error: ${error}`],
            timestamp: new Date().toISOString(),
        });
        return false;
    }
}
