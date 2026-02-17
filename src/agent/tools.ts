import { z } from "zod";
import { Page } from "playwright";
import { tool } from "ai";
import * as readline from "readline";
import * as path from "path";

async function promptUser(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question + " ", (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

export const createAgentTools = (page: Page, screenshotDir?: string) => {
    return {
        takeScreenshot: tool({
            description: "Take a screenshot of the current page state. Use this to verify progress or debug issues.",
            parameters: z.object({
                name: z.string().describe("A descriptive name for the screenshot"),
            }),
            execute: async ({ name }) => {
                try {
                    if (!screenshotDir) return "Screenshot directory not found!!.";
                    const filename = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.png`;
                    const filePath = path.join(screenshotDir, filename);
                    await page.screenshot({ path: filePath });
                    return `Screenshot saved @ ${filePath}`;
                } catch (error) {
                    return `Screenshot failed: ${error}`;
                }
            },
        }),

        askHuman: tool({
            description: "Ask the human user for help or verification when you are stuck or need confirmation.",
            parameters: z.object({
                question: z.string().describe("The question to ask the human"),
            }),
            execute: async ({ question }) => {
                console.log(`\n${question}\n`);
                try {
                    // For this take home assignment, using stdio for humaninput
                    const answer = await promptUser("Your answer:");
                    return `Human replied: ${answer}`;
                } catch (error) {
                    return `Failed to get human input: ${error}`;
                }
            },
        }),

        navigate: tool({
            description: "Navigate to a specific URL",
            parameters: z.object({
                url: z.string().describe("The URL to navigate to"),
            }),
            execute: async ({ url }) => {
                try {
                    await page.goto(url);
                    return `Navigated to ${url}`;
                } catch (error) {
                    return `Failed to navigate: ${error}`;
                }
            },
        }),

        fillField: tool({
            description: "Fill a text input field. You can provide a CSS selector OR a label text.",
            parameters: z.object({
                selectorOrLabel: z.string().describe("The CSS selector, label text, or placeholder of the field"),
                value: z.string().describe("The value to fill"),
            }),
            execute: async ({ selectorOrLabel, value }) => {
                try {
                    // Attemps to find element by CSS selector, label, placeholder, or text (in that order)
                    const isSelector = selectorOrLabel.startsWith("#") || selectorOrLabel.startsWith(".") || selectorOrLabel.includes("[");
                    let locator;

                    if (isSelector) {
                        locator = page.locator(selectorOrLabel).first();
                    } else {
                        locator = page.getByLabel(selectorOrLabel).first();
                        if (!(await locator.count())) {
                            locator = page.getByPlaceholder(selectorOrLabel).first();
                        }
                    }

                    await locator.waitFor({ state: "visible", timeout: 3000 });
                    await locator.fill(value);
                    return `Filled '${selectorOrLabel}' with '${value}'`;
                } catch (error) {
                    return `Failed to fill '${selectorOrLabel}': ${error}`;
                }
            },
        }),

        click: tool({
            description: "Click an element (button, link, etc.). Accepts selector or visible text.",
            parameters: z.object({
                selectorOrText: z.string().describe("The CSS selector or visible text of the element"),
            }),
            execute: async ({ selectorOrText }) => {
                try {
                    let locator;
                    const isSelector = selectorOrText.startsWith("#") ||
                        selectorOrText.startsWith(".") ||
                        selectorOrText.includes("[") ||
                        selectorOrText.includes(">");

                    if (isSelector) {
                        locator = page.locator(selectorOrText).first();
                    } else {
                        locator = page.getByRole('button', { name: selectorOrText }).first();
                        if (!(await locator.count())) {
                            locator = page.getByRole('link', { name: selectorOrText }).first();
                        }
                        if (!(await locator.count())) {
                            locator = page.getByText(selectorOrText).first();
                        }
                    }

                    await locator.waitFor({ state: "visible", timeout: 3000 });
                    await locator.click();
                    return `Clicked '${selectorOrText}'`;
                } catch (error) {
                    return `Failed to click '${selectorOrText}': ${error}`;
                }
            },
        }),

        selectOption: tool({
            description: "Select an option from a dropdown.",
            parameters: z.object({
                selectorOrLabel: z.string().describe("The CSS selector or label for the select element"),
                value: z.string().describe("The value (or label) to select"),
            }),
            execute: async ({ selectorOrLabel, value }) => {
                try {
                    let locator;
                    if (selectorOrLabel.startsWith("#") || selectorOrLabel.startsWith(".")) {
                        locator = page.locator(selectorOrLabel).first();
                    } else {
                        locator = page.getByLabel(selectorOrLabel).first();
                    }

                    await locator.waitFor({ state: "visible", timeout: 3000 });
                    try {
                        await locator.selectOption({ label: value });
                    } catch {
                        await locator.selectOption({ value: value });
                    }
                    return `Selected '${value}' from '${selectorOrLabel}'`;
                } catch (error) {
                    return `Failed to select '${value}' from '${selectorOrLabel}': ${error}`;
                }
            }
        }),

        getPageState: tool({
            description: "Get the current state of the page (accessibility tree)",
            parameters: z.object({}),
            execute: async () => {
                try {
                    const snapshot = await page.accessibility.snapshot();
                    if (!snapshot) return "No accessibility tree found.";
                    return JSON.stringify(snapshot, null, 2);
                } catch (error) {
                    return `Failed to get page state: ${error}`;
                }
            },
        }),
    };
};
