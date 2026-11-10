const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 8765;

// Middleware для обработки JSON и CORS
app.use(express.json());
app.use(express.static('.'));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Создание директорий, если они не существуют
const dirs = ['chats', 'users'];
dirs.forEach(dir => {
    fs.mkdir(path.join(__dirname, dir), { recursive: true }).catch(console.error);
});

// Функция для чтения JSON файла
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

// Функция для записи JSON файла
async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing file:', error);
        return false;
    }
}

// Получение списка чатов
app.get('/api/chats', async (req, res) => {
    const chats = await readJsonFile('chats/list.json');
    res.json(chats);
});

// Получение категорий
app.get('/api/categories', async (req, res) => {
    const categories = await readJsonFile('chats/categories.json');
    res.json(categories);
});

// Получение сообщений чата
app.get('/api/messages/:chatId', async (req, res) => {
    const messages = await readJsonFile('chats/messages.json');
    const chatMessages = messages.messages.filter(m => m.chatId === req.params.chatId);
    res.json({ messages: chatMessages });
});

// Получение реакций чата
app.get('/api/reactions/:chatId', async (req, res) => {
    const reactions = await readJsonFile(`chats/${req.params.chatId}_reactions.json`);
    res.json(reactions || {});
});

// Создание нового чата
app.post('/api/chats', async (req, res) => {
    const { name, category } = req.body;
    const chats = await readJsonFile('chats/list.json');
    
    const newChat = {
        id: Date.now().toString(),
        name,
        category,
        online: 0,
        reactions: 0,
        created: new Date().toISOString()
    };
    
    chats.chats.push(newChat);
    await writeJsonFile('chats/list.json', chats);
    
    // Создаем файлы для сообщений и реакций
    await writeJsonFile(`chats/${newChat.id}_reactions.json`, {});
    
    res.json(newChat);
});

// Создание новой категории
app.post('/api/categories', async (req, res) => {
    try {
        const { name, description } = req.body;
        const categories = await readJsonFile('chats/categories.json') || { categories: [] };
        
        const newCategory = {
            id: name.toLowerCase().replace(/\s+/g, '_'),
            name,
            description
        };
        
        categories.categories.push(newCategory);
        await writeJsonFile('chats/categories.json', categories);
        
        res.json(newCategory);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Отправка сообщения
app.post('/api/messages', async (req, res) => {
    const { chatId, userId, text } = req.body;
    const messages = await readJsonFile('chats/messages.json');
    
    const newMessage = {
        id: Date.now().toString(),
        chatId,
        userId,
        text,
        timestamp: new Date().toISOString(),
        edited: false
    };
    
    messages.messages.push(newMessage);
    await writeJsonFile('chats/messages.json', messages);
    
    res.json(newMessage);
});

// Обновление статистики чата
app.put('/api/chats/:chatId/stats', async (req, res) => {
    const { online, reactions } = req.body;
    const chats = await readJsonFile('chats/list.json');
    
    const chat = chats.chats.find(c => c.id === req.params.chatId);
    if (chat) {
        if (online !== undefined) chat.online = online;
        if (reactions !== undefined) chat.reactions = reactions;
        await writeJsonFile('chats/list.json', chats);
    }
    
    res.json(chat);
});

// Добавление реакции
app.post('/api/reactions/:chatId', async (req, res) => {
    const { messageId, userId, reactionType } = req.body;
    const reactions = await readJsonFile(`chats/${req.params.chatId}_reactions.json`) || {};
    
    if (!reactions[messageId]) {
        reactions[messageId] = {};
    }
    if (!reactions[messageId][userId]) {
        reactions[messageId][userId] = [];
    }
    
    const userReactions = reactions[messageId][userId];
    const index = userReactions.indexOf(reactionType);
    
    if (index === -1) {
        userReactions.push(reactionType);
    } else {
        userReactions.splice(index, 1);
    }
    
    await writeJsonFile(`chats/${req.params.chatId}_reactions.json`, reactions);
    
    // Обновляем статистику чата
    const totalReactions = Object.values(reactions).reduce((sum, msgReactions) => 
        sum + Object.values(msgReactions).reduce((msgSum, userReactions) => 
            msgSum + userReactions.length, 0), 0);
    
    const chats = await readJsonFile('chats/list.json');
    const chat = chats.chats.find(c => c.id === req.params.chatId);
    if (chat) {
        chat.reactions = totalReactions;
        await writeJsonFile('chats/list.json', chats);
    }
    
    res.json(reactions);
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 