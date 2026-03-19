<div align="center">
<img width="800" alt="FableQuest" src="./fable-quest.png" />
</div>

# FableQuest

Browse short fables and listen to them using ElevenLabs TTS. The browser calls a small Express proxy (`/api/tts`) so ElevenLabs credentials stay server-side.

## Run Locally

1. Install deps: `npm install`
2. Create `.env` from `.env.example`
3. Start the TTS server: `npm run dev:api`
4. Start the web app: `npm run dev`

## Deploy split frontend/backend

- Frontend (GitHub Pages): set `VITE_TTS_API_URL` to your deployed API origin (example: `https://your-app-name.herokuapp.com`) before building.
- Backend (Heroku): deploy `api-server.mjs` and set `ELEVENLABS_API_KEY` (plus optional `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`) as Heroku config vars.
- The app automatically falls back to relative `/api` when `VITE_TTS_API_URL` is not set (useful for local proxy dev).
