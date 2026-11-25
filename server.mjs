import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';

// Load .env automatically (works on any Node version without extra packages)
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile();

const PORT = Number(process.env.PORT || 8787);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || '';
const MODEL_ID = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.warn('[server.mjs] Warning: GEMINI_API_KEY is missing in .env');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function extractActionsAndCleanReply(rawText, userMessage) {
  let reply = rawText || '';
  let actions = [];

  const actionBlock = reply.match(/```studio-actions\s*\n([\s\S]*?)```/i);
  if (actionBlock?.[1]) {
    try {
      const parsed = JSON.parse(actionBlock[1].trim());
      if (Array.isArray(parsed)) actions = parsed;
    } catch {
      // Ignore malformed action JSON
    }
    reply = reply.replace(actionBlock[0], '').trim();
  }

  // Auto-load into editor if user asked to load/paste/put code and Gemini didn't emit an action block
  if (
    actions.length === 0 &&
    /\b(load|paste|put|replace|insert|edit)\b/i.test(userMessage || '')
  ) {
    const asmMatch = reply.match(/```(?:asm|8085|8086)?\s*\n([\s\S]*?)```/i);
    if (asmMatch?.[1]?.trim()) {
      actions.push({ type: 'replace_code', code: asmMatch[1].trim() });
    }
  }

  return { reply, actions };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/copilot') {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
        sendJson(res, 500, { error: 'GEMINI_API_KEY is not configured in .env' });
        return;
      }

      const body = await readJsonBody(req);
      const { message = '', history = [], systemPrompt = '' } = body;

      const fullSystemInstruction = `${systemPrompt}

ONLINE MODE CAPABILITIES:
- You have Google Search grounding enabled for up-to-date datasheets, Intel 8085/8086 references, and hardware facts.
- If the user asks you to perform a simulator UI action (load code into editor, step, run, pause, reset, switch 8085/8086, jump memory, toggle breakpoint, change theme), append a \`\`\`studio-actions\`\`\` JSON array at the very end of your response using valid StudioAction objects:
  - {"type":"replace_code","code":"..."}
  - {"type":"assemble"} | {"type":"run"} | {"type":"pause"} | {"type":"reset"}
  - {"type":"step_forward","count":1} | {"type":"step_backward","count":1}
  - {"type":"switch_architecture","architecture":"8085"|"8086"}
  - {"type":"jump_memory","address":8192}
  - {"type":"toggle_breakpoint","line":5}
  - {"type":"set_theme","themeId":"silicon-dark"|"cleanroom-light"|"phosphor-crt"|"wafer-gold"}`;

      const contents = [
        ...history.slice(-8).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(m.content || '') }],
        })),
        { role: 'user', parts: [{ text: String(message) }] },
      ];

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents,
        config: {
          systemInstruction: fullSystemInstruction,
          tools: [{ googleSearch: {} }],
          temperature: 0.3,
        },
      });

      const rawText = response.text || '';
      const { reply: cleanedReply, actions } = extractActionsAndCleanReply(rawText, message);

      // Extract Google Search grounding sources if present
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const seenUrls = new Set();
      const sourceLines = [];
      for (const chunk of chunks) {
        const uri = chunk?.web?.uri;
        const title = chunk?.web?.title || uri;
        if (uri && !seenUrls.has(uri)) {
          seenUrls.add(uri);
          sourceLines.push(`- [${title}](${uri})`);
        }
      }

      const finalReply =
        sourceLines.length > 0
          ? `${cleanedReply}\n\n**Sources:**\n${sourceLines.slice(0, 5).join('\n')}`
          : cleanedReply;

      sendJson(res, 200, { reply: finalReply || 'Done.', actions });
    } catch (err) {
      console.error('[server.mjs error]', err);
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : 'Gemini request failed',
      });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`[Silicon Copilot Online Server] Listening on http://localhost:${PORT}/api/copilot`);
});