import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const mockResponses: Record<string, string> = {
  route: `### Предлагаемый маршрут по дням (Албания)
1. **День 1 (Приезд в Тирану):** Прилёт, трансфер в отель, прогулка по центральной площади Скандербега. Ужин в аутентичном баре Komiteti Kafe.
2. **День 2 (Знакомство с Тираной):** Посещение Исторического музея и секретного бункера Bunker Art 2. Общий обед в Mullixhiu. Вечерняя прогулка по району Блоку.
3. **День 3 (Тысяча окон Берата):** Автобус до Берата, размещение в историческом отеле Hotel Mangalemi. Подъём в крепость на закат, ужин в Gorica.
4. **День 4 (Отъезд):** Прогулка по Горице, аренда автомобиля, трансфер в аэропорт Ринас.`,
  
  food: `### Рестораны и бары в Берате
- **Ura Gorica** — отличная семейная таверна прямо у моста. Подойдёт для сытного обеда (домашний сыр, овощи гриль, кебабы).
- **Restaurant Mangalemi** — находится в историческом квартале, подают традиционные албанские блюда (таве кози, пироги бырек) с прекрасным панорамным видом.
- **Castle Tavern** — ресторан внутри самой крепости Берата, идеален для ужина после осмотра замка.`,
  
  tips: `### Практические советы по Албании
1. **Наличные (Леки):** Обязательно снимите наличные в банкомате или обменяйте евро в аэропорту. Карты принимают далеко не везде.
2. **Транспорт:** Для передвижения по Тиране используйте приложение Bolt — это безопаснее и дешевле уличных такси.
3. **Офлайн доступ:** В Берате и крепости связь может проседать, держите отельные ваучеры и маршрут сохранёнными на телефоне.
4. **Безопасность:** В Берате каменистые узкие улочки — обувь должна быть удобной и нескользящей.`,
  
  chat: `### Сводка обсуждений в чате
- Максим подтвердил бронирование столика на 6 человек в Mullixhiu на сегодня в 13:00.
- Света попросила добавить в список полезных адресов круглосуточную аптеку рядом с отелем в Тиране (Алина уже сохранила её в местах).
- Иван предложил прикрепить скриншоты автобусных билетов до Берата в раздел «Документы» для быстрого доступа.`
};

export async function POST(request: Request) {
  try {
    const { action, prompt, tripId } = await request.json();

    // 1. Fetch trip context if available to feed to the LLM
    let tripContext = '';
    if (tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          days: { include: { activities: true } },
          places: true,
          notes: true,
          messages: { take: 10, orderBy: { createdAt: 'desc' } }
        }
      });
      if (trip) {
        tripContext = `Контекст поездки: ${trip.name} (${trip.route}), длительность ${trip.duration} дня.
Запланированные места: ${trip.places.map(p => p.name).join(', ')}.
Заметки группы: ${trip.notes.map(n => `${n.title}: ${n.content}`).join('; ')}.
Последние сообщения в чате: ${trip.messages.map(m => m.content).join(' | ')}.`;
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      // 2. If API Key is available, make a real call to Gemini Flash
      const systemInstruction = `Ты — AI-помощник для группового путешествия. Отвечай кратко, информативно и по делу на русском языке. Форматируй ответы с использованием Markdown. Использовать контекст поездки если необходимо.`;
      
      let userPrompt = '';
      if (action && mockResponses[action]) {
        userPrompt = `Выполни действие: "${action}". Предоставь структурированный ответ.\n${tripContext}`;
      } else {
        userPrompt = `Ответь на вопрос: "${prompt || 'Привет!'}"\n${tripContext}`;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
            }
          ]
        })
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        return NextResponse.json({ result: text });
      }
      
      console.warn('Gemini response structure was unexpected, falling back to mock');
    }

    // 3. Fallback to mock responses if no key is present or fetch failed
    if (action && mockResponses[action]) {
      return NextResponse.json({ result: mockResponses[action] });
    }

    const customText = prompt 
      ? `### Ответ на вопрос: «${prompt}»
*(Внимание: Добавьте GEMINI_API_KEY в переменные окружения (.env) для работы с живой нейросетью).*

В реальной поездке здесь отобразится AI-ответ, сгенерированный на основе ваших документов, бюджета и сообщений участников.`
      : 'AI-ассистент готов к работе!';

    return NextResponse.json({ result: customText });
  } catch (err) {
    console.error('Error in /api/ai:', err);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера при генерации ответа' },
      { status: 500 }
    );
  }
}
