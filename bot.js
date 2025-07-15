import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';

// Твой токен от BotFather
const BOT_TOKEN = '7239215232:AAGVWS2oG8KvlaJWnl3JOZcvS1P0HlRhf1c';
// Твой ключ Mistral API
const MISTRAL_API_KEY = 'XY5HurrCbil8xtO95LLdpuk9YQ54LBJV';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const userSessions = new Map();

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userSessions.set(chatId, {
    lang: 'ru',
    history: [],
  });

  bot.sendMessage(chatId, 👋 Добро пожаловать! Выберите язык:
🇷🇺 Русский: /ru  
🇬🇧 English: /en  
🇪🇸 Español: /es);
});

bot.onText(/\/(ru|en|es)/, (msg, match) => {
  const chatId = msg.chat.id;
  const lang = match[1];

  userSessions.set(chatId, {
    lang,
    history: [],
  });

  const langNames = { ru: 'Русский', en: 'English', es: 'Español' };
  bot.sendMessage(chatId, 🌍 Язык установлен: ${langNames[lang]});
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text.startsWith('/')) return; // команды уже обработаны

  if (!userSessions.has(chatId)) {
    userSessions.set(chatId, {
      lang: 'ru',
      history: [],
    });
  }

  const session = userSessions.get(chatId);
  session.history.push({ role: 'user', content: text });

  // Оповещение, что бот думает
  bot.sendChatAction(chatId, 'typing');

  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': Bearer ${MISTRAL_API_KEY},
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: session.history,
        temperature: 0.7
      })
    });

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || '⚠️ Ошибка ответа от Mistral';

    session.history.push({ role: 'assistant', content: reply });

    bot.sendMessage(chatId, reply);
  } catch (err) {
    bot.sendMessage(chatId, ❌ Ошибка запроса: ${err.message});
  }
});
