import { Page } from "playwright";

export async function verifySuccess(page: Page): Promise<boolean> {
    try {
        // Check for common success indicators
        const content = await page.content();
        const successKeywords = ["Success", "Thank you", "submitted", "completed"];

        // Check URL
        if (page.url().includes("success") || page.url().includes("confirmation")) {
            return true;
        }

        // Check visible text
        for (const keyword of successKeywords) {
            if (content.toLowerCase().includes(keyword.toLowerCase())) {
                // Double check visibility to be sure
                const locator = page.getByText(keyword, { exact: false });
                if (await locator.isVisible()) {
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error("Verification failed:", error);
        return false;
    }
}
