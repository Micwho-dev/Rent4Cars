# Rent4Cars - Local Setup Guide

To get the **AI Chat** and **Supabase** working on `localhost:3000`, you must set up your environment variables locally.

## 1. Create your .env file
Create a file named `.env` in the root directory (where `package.json` is).

## 2. Add these variables
Copy and paste the following, replacing the placeholders with your real keys:

```env
# SUPABASE CONFIG
# Use the API URL from Supabase Settings > API
VITE_SUPABASE_URL=https://lskoejolvcxvloshfosp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your long key)

# GEMINI CONFIG
# For localhost, you MUST use a personal API key.
# 1. Go to: https://aistudio.google.com/app/apikey
# 2. Click "Create API key"
# 3. Paste it here:
GEMINI_API_KEY=your_key_from_aistudio

# Optional: App URL for local development
APP_URL=http://localhost:3000
```

## 3. Important: Restart your Server
After saving the `.env` file, you **MUST** stop and restart your server in your terminal:
1. Press `Ctrl + C` in your VS Code terminal.
2. Run again: `npm run dev`

## 4. Troubleshooting
- **AI Error: [message]**: This means your Gemini API key is working but reached a limit or has a specific error. Check your terminal logs!
- **Failed to process AI chat**: If this still happens, look at your terminal in VS Code. I've added detailed logging there to show you exactly what's wrong.
- **Kafka Simulation generic reply**: This will automatically turn into an "Intelligent Mechanic" once your `GEMINI_API_KEY` is correctly set.
