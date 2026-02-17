# TypeScript & Project Walkthrough

## 📁 Project Structure

```
magical/
├── package.json          # Project configuration & dependencies
├── tsconfig.json         # TypeScript compiler settings
├── .env                  # Secret API keys (never commit this!)
├── src/
│   ├── _internal/
│   │   ├── run.ts       # Entry point - starts everything
│   │   └── setup.ts     # AI model configuration
│   ├── session.ts       # Browser automation setup
│   └── main.ts          # Your main application logic
```

---

## 🔄 Execution Flow (What happens when you run `npm run dev`)

### Step 1: `package.json` (The Starting Point)
```json
{
  "scripts": {
    "dev": "ts-node ./src/_internal/run.ts"
  }
}
```
**What it does:** Tells npm to run `run.ts` using `ts-node` (which executes TypeScript directly)

---

### Step 2: `src/_internal/run.ts` (The Entry Point)
```typescript
import "dotenv-defaults/config";  // ← Loads .env file into process.env
import { main } from "../main";   // ← Imports your main function

(async () => {
  main();  // ← Calls your main function
})();
```

**What it does:**
1. Loads environment variables from `.env` (like your API key)
2. Imports and calls the `main()` function

---

### Step 3: `src/_internal/setup.ts` (AI Model Config)
```typescript
import { google } from "@ai-sdk/google";

export const model = google("gemini-2.5-flash");
```

**What it does:**
- Creates a connection to Google's Gemini AI model
- Exports it so other files can use it
- Think of it as "dialing the phone number" to reach the AI

---

### Step 4: `src/session.ts` (Browser Setup)
```typescript
import { chromium, Page } from "playwright";

export async function createSession(url: string): Promise<Page> {
  const browser = await chromium.launch({
    args: ["--window-size=1366,768"],
    headless: false  // ← Shows the browser window (not hidden)
  });
  const activePage = await browser.newPage();
  
  await activePage.goto(url);  // ← Navigate to the URL
  
  return activePage;  // ← Give back the page so you can control it
}
```

**What it does:**
1. Opens a Chrome browser window
2. Creates a new tab (page)
3. Navigates to the URL you specify
4. Returns the page object so you can interact with it (click, type, etc.)

---

### Step 5: `src/main.ts` (Your Application Logic)
```typescript
import { generateText } from "ai";
import { model } from "./_internal/setup";
import { createSession } from "./session";

export async function main() {
  // 1. Open browser and go to Google
  const page = await createSession("https://www.google.com");

  // 2. Ask the AI a question
  const response = await generateText({
    model,  // ← The Gemini AI from setup.ts
    prompt: "How many r's are in strawberry?",
  });
  
  // 3. Print the answer
  console.log("AI Response:", response.text);
  
  // 4. Close the browser
  await page.context().browser()?.close();
}
```

**What it does:**
1. Opens a browser to Google.com
2. Asks the AI model a question
3. Prints the AI's response
4. Closes the browser

---

## 🔑 Key TypeScript Concepts

### 1. **`import` / `export`**
```typescript
// setup.ts
export const model = google("gemini-2.5-flash");  // ← Makes it available to other files

// main.ts
import { model } from "./_internal/setup";  // ← Brings it in from setup.ts
```
Think of it like: "I'm sharing this variable with other files"

---

### 2. **`async` / `await`**
```typescript
async function main() {
  const page = await createSession("https://google.com");
  //            ↑ Wait for the browser to open before continuing
}
```
**Why?** Opening browsers and calling APIs takes time. `await` says "pause here until this finishes."

---

### 3. **Type Annotations**
```typescript
function createSession(url: string): Promise<Page> {
  //                         ↑ Input must be text    ↑ Output will be a Page (eventually)
}
```
TypeScript checks that you're using the right types of data.

---

### 4. **`?.` (Optional Chaining)**
```typescript
await page.context().browser()?.close();
//                             ↑ Only call close() if browser() exists
```
Prevents crashes if something is `null` or `undefined`.

---

## 🎯 What You'll Build Next

For the Magical challenge, you'll modify `main.ts` to:

1. **Navigate** to the medical form
2. **Give the AI "tools"** (functions it can call):
   - `fillInput(selector, value)` - Type into a field
   - `clickButton(selector)` - Click a button
   - `selectDropdown(selector, value)` - Choose from a dropdown
3. **Create a loop** where the AI:
   - Looks at the page
   - Decides what to do next
   - Calls a tool
   - Repeats until the form is submitted

---

## 📦 Dependencies (What's in `package.json`)

- **`playwright`**: Controls the browser (like a robot clicking and typing)
- **`ai`**: Vercel's library for talking to AI models
- **`@ai-sdk/google`**: Connects to Google's Gemini AI
- **`typescript`**: Adds type checking to JavaScript
- **`ts-node`**: Runs TypeScript files directly (without compiling first)
- **`dotenv-defaults`**: Loads `.env` files

---

## 🔐 Environment Variables (`.env`)

```bash
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
```

This is like a password that lets you use Google's AI. The code reads it with:
```typescript
process.env.GOOGLE_GENERATIVE_AI_API_KEY
```

---

## Questions?

Let me know if you want me to explain:
- How to give the AI "tools" to interact with the browser
- How the agentic loop works
- Any specific TypeScript syntax
- How to debug when things go wrong
