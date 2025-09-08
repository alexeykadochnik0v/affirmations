// Simple AI service to generate an affirmation using OpenAI Chat Completions
// Sources API key from Vite env (VITE_OPENAI_API_KEY) or localStorage ('openai:key').
// Returns a normalized object: { title, text, practice, explanation }

export function getOpenAIApiKey() {
  // prefer env if provided at build time, else localStorage
  const fromEnv = import.meta.env.VITE_OPENAI_API_KEY;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim();
  try {
    const raw = localStorage.getItem('openai:key');
    if (raw && raw.trim()) return raw.trim();
  } catch {}
  return '';
}

export function setOpenAIApiKey(k) {
  try { localStorage.setItem('openai:key', k || ''); } catch {}
}

function buildPrompt(category, userPrompt) {
  const safeCategory = (category || 'growth').toLowerCase();
  const guidance = `Ты — эмпатичный коуч по осознанности. На основе категории "${safeCategory}" и описания пользователя создай короткую, тёплую аффирмацию.
Верни строгий JSON с полями:
{
  "title": "краткий вдохновляющий заголовок",
  "text": "1–2 предложения аффирмации в настоящем времени",
  "practice": "короткая практика осознанности (2–4 предложения)",
  "explanation": "мягкая расшифровка смысла (2–4 предложения)"
}
Тон — доброжелательный, современный, без штампов. Не добавляй лишний текст вокруг JSON.`;
  const userText = `Категория: ${safeCategory}\nЗапрос пользователя: ${userPrompt || ''}`;
  return { system: guidance, user: userText };
}

export async function generateAffirmation({ apiKey, category, prompt }) {
  // 1) Если настроен серверный прокси — используем его
  const proxy = import.meta.env.VITE_AI_PROXY_URL;
  if (proxy && proxy.trim()) {
    const res = await fetch(proxy.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, prompt }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(()=> '');
      throw new Error(`AI_PROXY_ERROR: ${res.status} ${txt}`);
    }
    const p = await res.json();
    const title = (p.title || '').toString().trim();
    const text = (p.text || '').toString().trim();
    const practice = (p.practice || '').toString().trim();
    const explanation = (p.explanation || '').toString().trim();
    if (!text) throw new Error('AI_PROXY_BAD_RESPONSE');
    return { title: title || 'Аффирмация', text, practice: practice || '', explanation: explanation || '' };
  }

  // 2) Иначе — прямой вызов OpenAI на клиенте (требует ключа)
  const key = (apiKey && apiKey.trim()) || getOpenAIApiKey();
  if (!key) throw new Error('OPENAI_API_KEY_NOT_SET');
  const { system, user } = buildPrompt(category, prompt);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    throw new Error(`OPENAI_API_ERROR: ${res.status} ${txt}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';

  // Try parse as JSON directly; if model wrapped in code block, strip it
  let jsonText = content;
  const m = content.match(/```(?:json)?\n([\s\S]*?)\n```/i);
  if (m) jsonText = m[1];
  let payload = {};
  try { payload = JSON.parse(jsonText); } catch { payload = {}; }

  const title = (payload.title || '').toString().trim();
  const text = (payload.text || '').toString().trim();
  const practice = (payload.practice || '').toString().trim();
  const explanation = (payload.explanation || '').toString().trim();

  if (!text) throw new Error('OPENAI_BAD_RESPONSE');
  return { title: title || 'Аффирмация', text, practice: practice || '', explanation: explanation || '' };
}

// === Лимиты на генерации (per device, per day) ===
export function getDailyCounterKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `ai:gen:${y}-${m}-${day}`;
}

export function getDailyUsed() {
  try { return parseInt(localStorage.getItem(getDailyCounterKey())||'0',10) || 0; } catch { return 0; }
}

export function incDailyUsed() {
  try {
    const n = getDailyUsed() + 1;
    localStorage.setItem(getDailyCounterKey(), String(n));
    return n;
  } catch { return 0; }
}
