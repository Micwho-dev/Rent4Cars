# Rent4Cars - Local Setup Guide for VS Code

Hello! Since you are trying to run the Rent4Cars project locally on your Windows laptop using VS Code, you might be running into some compatibility issues. This guide will help you fix them and get the website running locally.

## Common Issues & Fixes

When you run `npm install` and it fails, or `npm run dev` says it's not supported, it is usually because of one of two things:

1. **Outdated Node.js Version:** This project uses modern tools (Vite 6, React 19) which require a newer version of Node.js.
2. **Missing Global Packages:** The `npm run dev` script uses a tool called `tsx` to run the backend server. If it's not installing properly, the server won't start.

---

## Step-by-Step Setup

### Step 1: Install or Update Node.js
Ensure you have **Node.js version 20 or higher** installed. 
1. Open your terminal in VS Code and type `node -v` to check your version.
2. If it's below `18.x`, download and install the latest LTS version from [nodejs.org](https://nodejs.org/). Restart VS Code after installing.

### Step 2: Clean the directory (Optional but Recommended)
If a previous `npm install` failed, it's best to clear out the broken modules. In your VS Code terminal, run:
```bash
# On Windows PowerShell:
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
```

### Step 3: Install Dependencies
Run the install command again. If it throws minor warnings, that is normal. If it fails due to native modules like `xslt-processor`, you can try appending the `legacy-peer-deps` flag:
```bash
npm install --legacy-peer-deps
```

### Step 4: Environment Variables
Create a file named `.env` in the root folder (next to `package.json`). Copy the contents of `.env.example` into `.env`. 
If you want the AI chat to work locally, you'll need to generate a Gemini API Key from Google AI Studio and put it inside the `.env` file like this:
```env
GEMINI_API_KEY=your_real_key_here
```

### Step 5: Run the Development Server
Now you can start the server. This project has a full-stack architecture (Express Backend + React Frontend).

**Option A (Recommended): Ensure `tsx` is installed globally**
```bash
npm install -g tsx
npm run dev
```

**Option B: Separate Terminal workaround**
If `npm run dev` still gives you issues, you can run the frontend separately. Open *two* terminal panels in VS Code:
- **Terminal 1 (Backend):** `npx tsx server.ts`
- **Terminal 2 (Frontend):** `npx vite --port 5173`

Then open `http://localhost:5173` in your browser. (The Vite config automatically proxies `/api` calls to the backend on port 3000).

### Step 6 (For Production test):
If you want to test the compiled production version just like how it is deployed:
```bash
npm run build
npm run start
```

## Troubleshooting "fetch failed" in AI Chat (Localhost)
If you see the error `"The AI assistant is temporarily unavailable. Error: fetch failed"` only on your local machine (while it works in the preview), it is almost always caused by Node.js blocking the outgoing connection to Google's API due to your local network, antivirus, or DNS settings.

Here is how you can fix it:

**Fix 1: Disable IPv6 for Node.js (Most Common Windows Fix)**
Sometimes Node.js tries to connect to Google via IPv6 and fails. You can force Node to use IPv4.
Instead of running `npm run dev`, run this in your terminal:
```bash
# On Windows PowerShell:
$env:NODE_OPTIONS="--dns-result-order=ipv4first"
npm run dev
```

**Fix 2: Bypass Local Proxy / Antivirus SSL Blocks**
Some corporate laptops, antiviruses (like Kaspersky/Bitdefender), or strict firewalls intercept SSL connections, causing Node's `fetch` to fail. You can temporarily bypass this for testing by turning off strict SSL:
```bash
# On Windows PowerShell:
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
npm run dev
```

**Fix 3: Double Check Node Version**
The modern `@google/genai` library relies on the natively built-in `fetch` API in Node 18+. Ensure you are using at least **Node 20.x**. 

**Fix 4: Check your GEMINI_API_KEY**
Ensure your `.env` file actually has a valid API key, and it is in the root directory (the same folder as `package.json`), not inside `src/`. It should look exactly like:
`GEMINI_API_KEY=AIzaSy...`

## Why are you getting "Failed to fetch locations" errors?
If the website loads but you see errors like `"Failed to fetch locations"` in the console or the cars don't show up, it means the frontend is running, but the **backend (`server.ts`) is NOT running**. Ensure you are launching the backend server correctly on port 3000 before browsing the site!
