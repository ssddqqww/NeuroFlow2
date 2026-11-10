const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3003;

// Замените на ваш ключ API DeepSeek
const DEEPSEEK_API_KEY = 'YOUR_DEEPSEEK_API_KEY';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

app.use(cors());
app.use(express.json());

// Инструкция для Вики
const systemPrompt = 'Ты Вика, профессиональный AI-менеджер. Отвечай на все вопросы пользователей вежливо, профессионально и в роли менеджера. Всегда придерживайся этой роли, независимо от вопроса.';

app.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Вопрос не предоставлен' });
  }

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-r3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const answer = response.data.choices[0].message.content;
    res.json({ answer });
  } catch (error) {
    console.error('Ошибка DeepSeek API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Ошибка обработки запроса' });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
