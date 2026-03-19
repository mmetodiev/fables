import 'dotenv/config';
import express from 'express';

const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 8787);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5';

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.options('/api/tts', (_req, res) => {
  res.sendStatus(204);
});

app.get('/api/tts', async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY) {
      res.status(500).json({ error: 'Missing ELEVENLABS_API_KEY on server.' });
      return;
    }

    const text = typeof req.query.text === 'string' ? req.query.text.trim() : '';
    if (!text) {
      res.status(400).json({ error: 'Missing required query param: text' });
      return;
    }

    const elevenResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: ELEVENLABS_MODEL_ID,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!elevenResponse.ok || !elevenResponse.body) {
      const errorText = await elevenResponse.text();
      res.status(elevenResponse.status || 502).json({
        error: 'ElevenLabs request failed.',
        details: errorText,
      });
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders();

    for await (const chunk of elevenResponse.body) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    console.error('TTS proxy error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Unexpected server error during TTS.' });
    } else {
      res.end();
    }
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`TTS API server running on http://localhost:${port}`);
});
