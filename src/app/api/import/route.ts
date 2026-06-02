import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

// ── Types ──────────────────────────────────────────────────────────────
interface ParsedActivity {
  time: string;
  title: string;
  category: string;
  description: string;
}

interface ParsedDay {
  dayNumber: number;
  date: string;
  title: string;
  activities: ParsedActivity[];
}

interface ImportPreview {
  days: ParsedDay[];
  rawText: string;
}

// ── Extract text from different file types ─────────────────────────────
async function extractFromExcel(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const lines: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
    });

    lines.push(`=== Лист: ${sheetName} ===`);
    for (const row of rows) {
      const text = row.map(cell => String(cell ?? '').trim()).filter(Boolean).join(' | ');
      if (text) lines.push(text);
    }
  }

  return lines.join('\n');
}

async function extractFromWord(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// ── Send text to Gemini for structured parsing ─────────────────────────
async function parseWithGemini(text: string): Promise<ParsedDay[]> {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (!groqKey && !openRouterKey && !geminiKey) {
    throw new Error('Ключи API не настроены в .env');
  }

  const systemPrompt = `Ты — AI-парсер маршрутов путешествий. Тебе дают текст из файла (Excel или Word), который содержит план поездки.
Твоя задача: разобрать текст и вернуть ТОЛЬКО валидный JSON-массив (без markdown-обёрток, без \`\`\`json) в точном формате:
[
  {
    "dayNumber": 1,
    "date": "2025-06-15",
    "title": "Краткое название дня",
    "activities": [
      {
        "time": "09:00",
        "title": "Название активности",
        "category": "sightseeing",
        "description": "Краткое описание"
      }
    ]
  }
]

Правила:
- Категории: "transport", "food", "sightseeing", "hotel", "activity", "shopping", "other"
- Если время не указано, поставь логичное время (утро — 09:00, обед — 13:00, вечер — 18:00)
- Если даты нет, начинай с завтрашнего дня и нумеруй по порядку
- Если текст не похож на маршрут/план поездки, верни пустой массив []
- Верни ТОЛЬКО JSON, без комментариев и пояснений`;

  let rawText = '';

  // 1. Try Groq (Fastest & Stable)
  if (groqKey) {
    console.log('Attempting Groq request with Llama 3.3...');
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `--- ТЕКСТ ИЗ ФАЙЛА ---\n${text.slice(0, 8000)}` }
          ],
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        rawText = data.choices?.[0]?.message?.content || '';
        console.log('Groq request successful!');
      } else {
        const errText = await response.text();
        console.error(`Groq failed with status ${response.status}:`, errText);
      }
    } catch (e) {
      console.error('Groq request exception:', e);
    }
  }

  // 2. Try OpenRouter (Backup 1)
  if (!rawText && openRouterKey) {
    console.log('Attempting OpenRouter request...');
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Albania Travel Hub',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `--- ТЕКСТ ИЗ ФАЙЛА ---\n${text.slice(0, 8000)}` }
          ],
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        rawText = data.choices?.[0]?.message?.content || '';
        console.log('OpenRouter request successful!');
      } else {
        const errText = await response.text();
        console.error(`OpenRouter failed with status ${response.status}:`, errText);
      }
    } catch (e) {
      console.error('OpenRouter request exception:', e);
    }
  }

  // 3. Try Direct Gemini (Backup 2)
  if (!rawText && geminiKey) {
    console.log('Falling back to direct Gemini API...');
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    let delay = 2000;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\n--- ТЕКСТ ИЗ ФАЙЛА ---\n${text.slice(0, 8000)}` }],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 4096,
              },
            }),
          }
        );

        if (response.ok) {
          break;
        }

        const errText = await response.text();
        console.warn(`Direct Gemini attempt ${attempts} failed with status ${response.status}:`, errText);

        if (response.status === 429 && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          break;
        }
      } catch (e) {
        console.error('Direct Gemini request exception:', e);
        break;
      }
    }

    if (response && response.ok) {
      const data = await response.json();
      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  }

  if (!rawText) {
    throw new Error('Не удалось получить ответ от AI. Пожалуйста, попробуйте позже.');
  }

  // Clean potential markdown wrapping
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error('Failed to parse Gemini response as JSON:', cleaned);
    throw new Error('AI не смог разобрать структуру файла. Попробуйте файл в другом формате.');
  }
}

// ── POST handler ───────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Extract raw text based on file type
    let rawText: string;

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      rawText = await extractFromExcel(buffer);
    } else if (fileName.endsWith('.docx')) {
      rawText = await extractFromWord(buffer);
    } else {
      return NextResponse.json(
        { error: 'Неподдерживаемый формат. Загрузите .xlsx, .xls или .docx файл.' },
        { status: 400 }
      );
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: 'Файл пуст или не содержит текста.' },
        { status: 400 }
      );
    }

    // 2. Send to Gemini for structured parsing
    const days = await parseWithGemini(rawText);

    const preview: ImportPreview = { days, rawText: rawText.slice(0, 2000) };

    return NextResponse.json(preview);
  } catch (err) {
    console.error('Import error:', err);
    const message = err instanceof Error ? err.message : 'Ошибка при обработке файла';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
