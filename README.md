<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FableQuest

Browse short fables and listen to them using ElevenLabs TTS. The browser calls a small Express proxy (`/api/tts`) so ElevenLabs credentials stay server-side.

## Run Locally

1. Install deps: `npm install`
2. Create `.env` from `.env.example`
3. Start the TTS server: `npm run dev:api`
4. Start the web app: `npm run dev`
