import { z } from "zod";
import { Page } from "playwright";
import { tool } from "ai";

export const createAgentTools = (page: Page) => {
    return {
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
                    return `Failed to navigate to ${url}: ${error}`;
                }
            },
        }),

        fillField: tool({
            description: "Fill a text input field",
            parameters: z.object({
                selector: z.string().describe("The CSS selector or label text of the field"),
                value: z.string().describe("The value to fill"),
            }),
            execute: async ({ selector, value }) => {
                try {
                    const locator = page.locator(selector).first();
                    await locator.waitFor({ state: "visible", timeout: 5000 });
                    await locator.fill(value);
                    return `Filled field '${selector}' with '${value}'`;
                } catch (error) {
                    return `Failed to fill field '${selector}': ${error}`;
                }
            },
        }),

        click: tool({
            description: "Click an element (button, link, etc.)",
            parameters: z.object({
                selector: z.string().describe("The CSS selector or text of the element"),
            }),
            execute: async ({ selector }) => {
                try {
                    const locator = page.locator(selector).first();
                    await locator.waitFor({ state: "visible", timeout: 5000 });
                    await locator.click();
                    return `Clicked element '${selector}'`;
                } catch (error) {
                    return `Failed to click '${selector}': ${error}`;
                }
            },
        }),

        selectOption: tool({
            description: "Select an option from a dropdown",
            parameters: z.object({
                selector: z.string().describe("The CSS selector for the select element"),
                value: z.string().describe("The value (or label) to select"),
            }),
            execute: async ({ selector, value }) => {
                try {
                    const locator = page.locator(selector).first();
                    await locator.waitFor({ state: "visible", timeout: 5000 });
                    // try by label first, then value
                    try {
                        await locator.selectOption({ label: value });
                    } catch {
                        await locator.selectOption({ value: value });
                    }
                    return `Selected '${value}' from '${selector}'`;
                } catch (error) {
                    return `Failed to select '${value}' from '${selector}': ${error}`;
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
