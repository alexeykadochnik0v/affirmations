// Загрузчик аффирмаций из public/affirmations.json
// Новый ожидаемый формат файла:
// [
//   { "id": "...", "category": "love", "text": "...", "practice": "...", "расшифровка": "..." },
//   ...
// ]

function parseCSV(text) {
  // Minimal CSV parser supporting quotes and commas inside quotes
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cur);
        cur = '';
      } else if (ch === '\n') {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
      } else if (ch === '\r') {
        // ignore
      } else {
        cur += ch;
      }
    }
  }
  // push last value
  if (cur.length > 0 || row.length) {
    row.push(cur);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const obj = {};
    const vals = rows[r];
    headers.forEach((h, idx) => { obj[h] = (vals[idx] ?? '').trim(); });
    out.push(obj);
  }
  return out;
}

async function tryFetch(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res;
}

export async function loadAffirmations() {
  try {
    // Try JSON first
    let res = await tryFetch(`${import.meta.env.BASE_URL}affirmations.json`);
    if (!res) {
      // Try CSV fallback
      const csvRes = await tryFetch(`${import.meta.env.BASE_URL}affirmations.csv`);
      if (!csvRes) throw new Error('Not OK');
      const csvText = await csvRes.text();
      const rawCsv = parseCSV(csvText);
      // Normalize CSV rows to expected shape
      const mapped = rawCsv.map((r) => ({
        id: r.id,
        category: r.category || r.cat || r.type,
        text: r.text || r.affirmation || r.affirma || r['аффирмация'],
        practice: r.practice || r['практика'],
        explanation: r['расшифровка'] || r.explanation,
      }));
      return normalize(mapped);
    }
    const raw = await res.json();
    return normalize(raw);
  } catch (e) {
    // Если файла нет — вернём null, чтобы использовать локальный fallback
    return null;
  }
}

function normalize(raw) {
  const byCategory = {};
  for (const item of raw) {
    const cat = (item.category || 'love').toLowerCase();
    const id = item.id || `${cat}-${Math.random().toString(36).slice(2, 9)}`;
    const normalized = {
      id,
      text: String(item.text || '').trim(),
      practice: String(item.practice || '').trim(),
      explanation: String(item['расшифровка'] || item.explanation || '').trim(),
    };
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(normalized);
  }
  for (const k of Object.keys(byCategory)) {
    byCategory[k] = byCategory[k].filter(x => x.text).sort((a, b) => a.id.localeCompare(b.id));
  }
  return byCategory;
}
