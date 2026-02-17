# Interacting with AI and Playwright

## Part 1: Playwright Basics (Browser Control)

### 1.1 Finding Elements on a Page
```typescript
// Get the page
const page = await createSession("https://example.com");

// Find elements by different selectors
const nameInput = page.locator('#firstName');        // By ID
const submitBtn = page.locator('button[type="submit"]'); // By CSS selector
const heading = page.locator('h1');                  // By tag name
```

### 1.2 Common Playwright Actions
```typescript
// Type into an input field
await page.locator('#firstName').fill('John');

// Click a button
await page.locator('button[type="submit"]').click();

// Select from a dropdown
await page.locator('#country').selectOption('USA');

// Get text from an element
const text = await page.locator('h1').textContent();
console.log(text); // "Welcome to our site"

// Check if element exists
const exists = await page.locator('#firstName').count() > 0;

// Wait for an element to appear
await page.locator('#successMessage').waitFor();
```

### 1.3 Getting Page Information
```typescript
// Get the current URL
const url = page.url();

// Get the page title
const title = await page.title();

// Get all text on the page
const bodyText = await page.locator('body').textContent();

// Take a screenshot
await page.screenshot({ path: 'screenshot.png' });

// Get HTML of an element
const html = await page.locator('#form').innerHTML();
```

---

## Part 2: AI Basics (Vercel AI SDK)

### 2.1 Simple Text Generation
```typescript
import { generateText } from "ai";
import { model } from "./_internal/setup";

// Ask a simple question
const response = await generateText({
  model,
  prompt: "What is 2 + 2?",
});

console.log(response.text); // "4"
```

### 2.2 AI with Context
```typescript
// Give the AI context about what you're doing
const response = await generateText({
  model,
  prompt: `
    I'm looking at a form with these fields:
    - First Name (input)
    - Last Name (input)
    - Submit (button)
    
    I need to fill it with:
    - First Name: John
    - Last Name: Doe
    
    What should I do first?
  `,
});

console.log(response.text);
// "First, fill the First Name field with 'John'"
```

### 2.3 AI with Tools (The Magic Part!)
```typescript
import { generateText, tool } from "ai";
import { z } from "zod";

const response = await generateText({
  model,
  prompt: "Fill out the form with First Name: John, Last Name: Doe",
  tools: {
    // Define a tool the AI can call
    fillInput: tool({
      description: "Fill an input field with text",
      parameters: z.object({
        selector: z.string().describe("CSS selector for the input"),
        value: z.string().describe("Text to type"),
      }),
      execute: async ({ selector, value }) => {
        // This code runs when AI calls the tool
        await page.locator(selector).fill(value);
        return `Filled ${selector} with "${value}"`;
      },
    }),
    
    clickButton: tool({
      description: "Click a button",
      parameters: z.object({
        selector: z.string().describe("CSS selector for the button"),
      }),
      execute: async ({ selector }) => {
        await page.locator(selector).click();
        return `Clicked ${selector}`;
      },
    }),
  },
  maxSteps: 5, // Allow AI to call tools up to 5 times
});

// The AI will automatically call your tools!
console.log(response.text);
```

---

## Part 3: Combining AI + Playwright (The Agentic Loop)

### 3.1 Basic Agent Pattern
```typescript
export async function main() {
  const page = await createSession("https://magical-medical-form.netlify.app/");
  
  // Step 1: Get the current state of the page
  const pageContent = await page.locator('body').textContent();
  
  // Step 2: Ask AI what to do
  const response = await generateText({
    model,
    prompt: `
      You are filling out a medical form.
      
      Current page content:
      ${pageContent}
      
      Task: Fill First Name with "John"
      
      What should you do?
    `,
    tools: {
      fillInput: tool({
        description: "Fill an input field",
        parameters: z.object({
          selector: z.string(),
          value: z.string(),
        }),
        execute: async ({ selector, value }) => {
          await page.locator(selector).fill(value);
          return `Filled ${selector} with ${value}`;
        },
      }),
    },
    maxSteps: 3,
  });
  
  console.log("AI finished:", response.text);
}
```

### 3.2 Advanced: Multi-Step Agent
```typescript
import { generateText, tool } from "ai";
import { z } from "zod";

export async function main() {
  const page = await createSession("https://magical-medical-form.netlify.app/");
  
  // Define tools once
  const tools = {
    fillInput: tool({
      description: "Fill an input field with text",
      parameters: z.object({
        selector: z.string().describe("CSS selector like '#firstName' or 'input[name=\"firstName\"]'"),
        value: z.string().describe("The text to type"),
      }),
      execute: async ({ selector, value }) => {
        console.log(`🤖 AI is typing "${value}" into ${selector}`);
        await page.locator(selector).fill(value);
        return `Successfully filled ${selector}`;
      },
    }),
    
    clickElement: tool({
      description: "Click a button or link",
      parameters: z.object({
        selector: z.string().describe("CSS selector for the element to click"),
      }),
      execute: async ({ selector }) => {
        console.log(`🤖 AI is clicking ${selector}`);
        await page.locator(selector).click();
        await page.waitForTimeout(500); // Wait a bit after clicking
        return `Successfully clicked ${selector}`;
      },
    }),
    
    getPageState: tool({
      description: "Get the current state of the page to see what's visible",
      parameters: z.object({}),
      execute: async () => {
        const bodyText = await page.locator('body').textContent();
        const url = page.url();
        return `URL: ${url}\n\nPage content:\n${bodyText?.substring(0, 1000)}`;
      },
    }),
  };
  
  // Let the AI work autonomously
  const response = await generateText({
    model,
    prompt: `
      You are an AI agent that fills out web forms.
      
      TASK:
      1. Navigate to the medical form
      2. Fill out the form with:
         - First Name: John
         - Last Name: Doe
         - Date of Birth: 1990-01-01
         - Medical ID: 91927885
      3. Click Submit
      
      INSTRUCTIONS:
      - Use getPageState first to see what's on the page
      - Use fillInput to type into fields
      - Use clickElement to click the submit button
      - Work step by step
    `,
    tools,
    maxSteps: 10, // Allow up to 10 tool calls
  });
  
  console.log("\n✅ Agent finished!");
  console.log("Final response:", response.text);
  
  // Keep browser open to see the result
  await page.waitForTimeout(5000);
  await page.context().browser()?.close();
}
```

---

## Part 4: Understanding AI Responses

### 4.1 Response Structure
```typescript
const response = await generateText({
  model,
  prompt: "Hello!",
  tools: { /* ... */ },
});

// What's in the response?
console.log(response.text);           // The AI's final text response
console.log(response.toolCalls);      // Array of tools the AI called
console.log(response.toolResults);    // Results from those tool calls
console.log(response.finishReason);   // Why it stopped ("stop", "length", "tool-calls")
```

### 4.2 Example: Inspecting Tool Calls
```typescript
const response = await generateText({
  model,
  prompt: "Fill First Name with John and Last Name with Doe",
  tools: { fillInput: /* ... */ },
  maxSteps: 5,
});

// See what the AI did
console.log("AI called these tools:");
response.toolCalls?.forEach((call, i) => {
  console.log(`${i + 1}. ${call.toolName}(${JSON.stringify(call.args)})`);
});

// Example output:
// 1. fillInput({"selector": "#firstName", "value": "John"})
// 2. fillInput({"selector": "#lastName", "value": "Doe"})
```

---

## Part 5: Debugging Tips

### 5.1 See What the AI Sees
```typescript
const pageContent = await page.locator('body').textContent();
console.log("Page content:", pageContent);
// Now you know what the AI is working with
```

### 5.2 Slow Down to Watch
```typescript
// Add delays to see what's happening
await page.locator('#firstName').fill('John');
await page.waitForTimeout(1000); // Pause for 1 second
```

### 5.3 Take Screenshots
```typescript
await page.screenshot({ path: 'before.png' });
await page.locator('#submit').click();
await page.screenshot({ path: 'after.png' });
```

### 5.4 Log Everything
```typescript
execute: async ({ selector, value }) => {
  console.log(`Filling ${selector} with ${value}`);
  await page.locator(selector).fill(value);
  console.log(`✓ Success!`);
  return `Filled ${selector}`;
},
```

---

## Quick Reference

### Playwright Cheat Sheet
```typescript
// Navigation
await page.goto('https://example.com');

// Typing
await page.locator('#input').fill('text');

// Clicking
await page.locator('button').click();

// Selecting dropdown
await page.locator('select').selectOption('value');

// Getting text
const text = await page.locator('h1').textContent();

// Waiting
await page.waitForTimeout(1000); // Wait 1 second
await page.locator('#element').waitFor(); // Wait for element
```

### AI SDK Cheat Sheet
```typescript
// Simple generation
const response = await generateText({
  model,
  prompt: "Your question",
});

// With tools
const response = await generateText({
  model,
  prompt: "Your task",
  tools: {
    toolName: tool({
      description: "What it does",
      parameters: z.object({ /* ... */ }),
      execute: async (params) => { /* ... */ },
    }),
  },
  maxSteps: 5,
});
```

---

## Next Steps

Now you understand:
- ✅ How to control the browser with Playwright
- ✅ How to ask the AI questions
- ✅ How to give the AI tools to use
- ✅ How to combine them into an autonomous agent

Ready to build the form-filling agent? Let me know!
