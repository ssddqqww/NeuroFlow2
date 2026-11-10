const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');
const fetch = require('node-fetch');

const app = express();
const port = 5421;

// Создаем WebSocket сервер
const wss = new WebSocket.Server({ port: 8080 });

// Добавляем middleware для логирования
app.use((req, res, next) => {
    // console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// app.use(cors());
app.use(cors({
    origin: '../index.html',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Добавляем кэш для уменьшения количества запросов к файловой системе
const cache = {
    topics: null,
    chats: null,
    messages: null,
    lastUpdate: {}
};

// Функция для получения данных с кэшированием
async function getCachedData(type, maxAge = 1000) {
    const now = Date.now();
    if (!cache[type] || !cache.lastUpdate[type] || (now - cache.lastUpdate[type]) > maxAge) {
        try {
            const data = await fs.readFile(`${type}.json`, 'utf8');
            cache[type] = JSON.parse(data);
            cache.lastUpdate[type] = now;
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Если файл не существует, создаем пустой массив
                cache[type] = [];
                await fs.writeFile(`${type}.json`, JSON.stringify([], null, 2));
                cache.lastUpdate[type] = now;
            } else {
                throw error;
            }
        }
    }
    return cache[type];
}

// Функция для безопасного чтения JSON файла
async function safeReadJsonFile(filename, defaultValue = {}) {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Если файл не существует, создаем его с дефолтным значением
            await fs.writeFile(filename, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        throw error;
    }
}

// Получение всех тем
app.get('/api/topics', async (req, res) => {
    try {
        // console.log('Fetching topics...');
        const data = await fs.readFile('topics.json', 'utf8');
        // console.log('Topics loaded successfully');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ error: 'Error fetching topics' });
    }
});

// Создание новой темы
app.post('/api/topics', async (req, res) => {
    try {
        const { name } = req.body;
        // console.log('Creating new topic:', name);
        const topics = JSON.parse(await fs.readFile('topics.json', 'utf8'));
        const newTopic = {
            id: Date.now().toString(),
            name,
            createdAt: new Date().toISOString()
        };
        topics.push(newTopic);
        await fs.writeFile('topics.json', JSON.stringify(topics, null, 2));
        // console.log('Topic created successfully:', newTopic);
        res.json(newTopic);
    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({ error: 'Error creating topic' });
    }
});

// Получение всех чатов
app.get('/api/chats', async (req, res) => {
    try {
        const chats = await getCachedData('chats');
        const topics = await getCachedData('topics');
        
        // Добавляем информацию о теме к каждому чату
        const chatsWithTopics = chats.map(chat => {
            const topic = topics.find(t => t.id === chat.topicId);
            return {
                ...chat,
                topicName: topic ? topic.name : 'No topic'
            };
        });
        
        res.json(chatsWithTopics);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Error fetching chats' });
    }
});

// Создание нового чата
app.post('/api/chats', async (req, res) => {
    try {
        const { name, topicId, username } = req.body;
        // console.log('Creating new chat:', { name, topicId, username });
        const chats = JSON.parse(await fs.readFile('chats.json', 'utf8'));
        const newChat = {
            id: Date.now().toString(),
            name,
            topicId,
            username,
            rating: 0,
            likes: 0,
            dislikes: 0,
            online: 0,
            createdAt: new Date().toISOString()
        };
        chats.push(newChat);
        await fs.writeFile('chats.json', JSON.stringify(chats, null, 2));
        // console.log('Chat created successfully:', newChat);
        res.json(newChat);
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: 'Error creating chat' });
    }
});

// Получение сообщений чата
app.get('/api/chats/:chatId/messages', async (req, res) => {
    try {
        const { chatId } = req.params;
        // console.log('Fetching messages for chat:', chatId);
        const messages = JSON.parse(await fs.readFile('messages.json', 'utf8'));
        const chatMessages = messages.filter(msg => msg.chatId === chatId);
        // console.log(`Found ${chatMessages.length} messages for chat ${chatId}`);
        res.json(chatMessages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

// Отправка сообщения
app.post('/api/chats/:chatId/messages', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, username } = req.body;
        // console.log('Sending message:', { chatId, content, username });
        const messages = JSON.parse(await fs.readFile('messages.json', 'utf8'));
        const newMessage = {
            id: Date.now().toString(),
            chatId,
            content,
            username,
            reactions: {},
            createdAt: new Date().toISOString()
        };
        messages.push(newMessage);
        await fs.writeFile('messages.json', JSON.stringify(messages, null, 2));
        // console.log('Message sent successfully:', newMessage);
        res.json(newMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error sending message' });
    }
});

// Эндпоинт проверки здоровья сервера
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Обновление рейтинга чата
app.put('/api/chats/:chatId/rating', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { type, action } = req.body;
        const chats = await getCachedData('chats');
        const chat = chats.find(c => c.id === chatId);
        
        if (chat) {
            if (action === 'add') {
                chat.likes = (chat.likes || 0) + 1;
                chat.rating = (chat.rating || 0) + 1;
            } else if (action === 'remove') {
                chat.likes = Math.max(0, (chat.likes || 0) - 1);
                chat.rating = Math.max(0, (chat.rating || 0) - 1);
            }
            
            await fs.writeFile('chats.json', JSON.stringify(chats, null, 2));
            cache.chats = chats;
            res.json(chat);
        } else {
            res.status(404).json({ error: 'Chat not found' });
        }
    } catch (error) {
        console.error('Error updating rating:', error);
        res.status(500).json({ error: 'Error updating rating' });
    }
});

// Получение чата по ID
app.get('/api/chats/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const chats = JSON.parse(await fs.readFile('chats.json', 'utf8'));
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            // Получаем тему для чата
            const topics = JSON.parse(await fs.readFile('topics.json', 'utf8'));
            const topic = topics.find(t => t.id === chat.topicId);
            chat.topicName = topic ? topic.name : 'Unknown topic';
            res.json(chat);
        } else {
            res.status(404).json({ error: 'Chat not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error getting chat' });
    }
});

// Редактирование сообщения
app.put('/api/messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const messages = JSON.parse(await fs.readFile('messages.json', 'utf8'));
        const message = messages.find(m => m.id === messageId);
        if (message) {
            message.content = content;
            message.edited = true;
            message.editedAt = new Date().toISOString();
            await fs.writeFile('messages.json', JSON.stringify(messages, null, 2));
            res.json(message);
        } else {
            res.status(404).json({ error: 'Message not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error editing message' });
    }
});

// Удаление сообщения
app.delete('/api/messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const messages = JSON.parse(await fs.readFile('messages.json', 'utf8'));
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
            messages.splice(messageIndex, 1);
            await fs.writeFile('messages.json', JSON.stringify(messages, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Message not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error deleting message' });
    }
});

// Удаление чата
app.delete('/api/chats/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { username } = req.query;
        const chats = JSON.parse(await fs.readFile('chats.json', 'utf8'));
        const messages = JSON.parse(await fs.readFile('messages.json', 'utf8'));
        
        const chatIndex = chats.findIndex(c => c.id === chatId);
        if (chatIndex === -1) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (chats[chatIndex].username !== username) {
            return res.status(403).json({ error: 'You do not have permission to delete this chat' });
        }
        
        chats.splice(chatIndex, 1);
        await fs.writeFile('chats.json', JSON.stringify(chats, null, 2));
        
        const updatedMessages = messages.filter(m => m.chatId !== chatId);
        await fs.writeFile('messages.json', JSON.stringify(updatedMessages, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting chat' });
    }
});

// Обновление онлайн-статуса
app.put('/api/chats/:chatId/online', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { action } = req.body;
        // console.log('Updating online status:', { chatId, action });
        const chats = JSON.parse(await fs.readFile('chats.json', 'utf8'));
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            if (action === 'join') {
                chat.online = (chat.online || 0) + 1;
            } else if (action === 'leave') {
                chat.online = Math.max(0, (chat.online || 0) - 1);
            }
            await fs.writeFile('chats.json', JSON.stringify(chats, null, 2));
            // console.log('Online status updated:', chat);
            res.json(chat);
        } else {
            console.error('Chat not found:', chatId);
            res.status(404).json({ error: 'Chat not found' });
        }
    } catch (error) {
        console.error('Error updating online status:', error);
        res.status(500).json({ error: 'Error updating online status' });
    }
});

// Обновление реакции на сообщение
app.put('/api/messages/:messageId/reactions', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { reaction, username } = req.body;
        const messages = JSON.parse(await fs.readFile('messages.json', 'utf8'));
        const message = messages.find(m => m.id === messageId);
        if (message) {
            // Удаляем предыдущую реакцию пользователя
            Object.keys(message.reactions || {}).forEach(r => {
                if (message.reactions[r].includes(username)) {
                    message.reactions[r] = message.reactions[r].filter(u => u !== username);
                    if (message.reactions[r].length === 0) {
                        delete message.reactions[r];
                    }
                }
            });

            // Добавляем новую реакцию
            if (!message.reactions) {
                message.reactions = {};
            }
            if (!message.reactions[reaction]) {
                message.reactions[reaction] = [];
            }
            if (!message.reactions[reaction].includes(username)) {
                message.reactions[reaction].push(username);
            }
            await fs.writeFile('messages.json', JSON.stringify(messages, null, 2));
            res.json(message);
        } else {
            res.status(404).json({ error: 'Message not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error updating reaction' });
    }
});

// Сохранение последнего открытого чата
app.post('/api/users/last-chat', async (req, res) => {
    try {
        const { username, chatId } = req.body;
        const lastChats = JSON.parse(await fs.readFile('last-chats.json', 'utf8').catch(() => '{}'));
        lastChats[username] = chatId;
        await fs.writeFile('last-chats.json', JSON.stringify(lastChats, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error saving last chat' });
    }
});

// Получение последнего открытого чата
app.get('/api/users/:username/last-chat', async (req, res) => {
    try {
        const { username } = req.params;
        const lastChats = JSON.parse(await fs.readFile('last-chats.json', 'utf8').catch(() => '{}'));
        res.json({ chatId: lastChats[username] || null });
    } catch (error) {
        res.status(500).json({ error: 'Error getting last chat' });
    }
});

// Редактирование чата
app.put('/api/chats/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { name, username } = req.body;
        const chats = JSON.parse(await fs.readFile('chats.json', 'utf8'));
        const chatIndex = chats.findIndex(c => c.id === chatId);
        
        if (chatIndex === -1) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (chats[chatIndex].username !== username) {
            return res.status(403).json({ error: 'You do not have permission to edit this chat' });
        }

        chats[chatIndex].name = name;
        await fs.writeFile('chats.json', JSON.stringify(chats, null, 2));
        res.json(chats[chatIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Error updating chat' });
    }
});

// Эндпоинт для логирования с клиента
app.post('/api/log', async (req, res) => {
    try {
        const { message, type } = req.body;
        const timestamp = new Date().toISOString();
        // console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error logging message:', error);
        res.status(500).json({ error: 'Error logging message' });
    }
});

// Обработка WebSocket подключений
wss.on('connection', function connection(ws) {
    console.log('New WebSocket connection established');
    
    // Отправляем pong на каждый ping
    ws.on('message', async function incoming(message) {
        const messageStr = message.toString();
        console.log('Received WebSocket message:', messageStr);
        
        try {
            const data = JSON.parse(messageStr);
            
            // Обработка пинга
            if (data.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong' }));
                return;
            }
            
            console.log('Message type:', data.type);
            console.log('Message data:', data);
            
            switch (data.type) {
                case 'getTopics':
                    const topics = await getCachedData('topics');
                    ws.send(JSON.stringify({ type: 'topics', data: topics }));
                    break;

                case 'createTopic':
                    const { name } = data;
                    const topicsData = await getCachedData('topics');
                    const newTopic = {
                        id: Date.now().toString(),
                        name,
                        createdAt: new Date().toISOString()
                    };
                    topicsData.push(newTopic);
                    await fs.writeFile('topics.json', JSON.stringify(topicsData, null, 2));
                    cache.topics = topicsData;
                    ws.send(JSON.stringify({ type: 'topicCreated', data: newTopic }));
                    break;

                case 'getChats':
                    const chats = await getCachedData('chats');
                    const topicsList = await getCachedData('topics');
                    
                    console.log('Available topics:', topicsList);
                    console.log('Available chats:', chats);
                    
                    // Добавляем информацию о теме к каждому чату
                    const chatsWithTopics = chats.map(chat => {
                        const topic = topicsList.find(t => t.id === chat.topicId);
                        console.log('Processing chat:', chat.id);
                        console.log('Chat topicId:', chat.topicId);
                        console.log('Found topic:', topic);
                        
                        const result = {
                            ...chat,
                            topicName: topic ? topic.name : 'No topic'
                        };
                        console.log('Final chat object:', result);
                        return result;
                    });
                    
                    console.log('Sending chats with topics:', chatsWithTopics);
                    ws.send(JSON.stringify({ type: 'chats', data: chatsWithTopics }));
                    break;

                case 'createChat':
                    const { chatName, topicId, username } = data;
                    const chatsData = await getCachedData('chats');
                    const newChat = {
                        id: Date.now().toString(),
                        name: chatName,
                        topicId,
                        username,
                        rating: 0,
                        likes: 0,
                        dislikes: 0,
                        online: 0,
                        createdAt: new Date().toISOString()
                    };
                    chatsData.push(newChat);
                    await fs.writeFile('chats.json', JSON.stringify(chatsData, null, 2));
                    cache.chats = chatsData;
                    ws.send(JSON.stringify({ type: 'chatCreated', data: newChat }));
                    break;

                case 'getMessages':
                    const { chatId } = data;
                    const messages = await getCachedData('messages');
                    const chatMessages = messages.filter(msg => msg.chatId === chatId);
                    ws.send(JSON.stringify({ type: 'messages', data: chatMessages }));
                    break;

                case 'sendMessage':
                    console.log('Обработка отправки сообщения:', {
                        content: data.messageContent,
                        username: data.messageUsername,
                        chatId: data.messageChatId
                    });
                    
                    const messageChats = await getCachedData('chats');
                    const targetChat = messageChats.find(c => c.id === data.messageChatId);
                    if (!targetChat) {
                        console.error('Чат не найден:', data.messageChatId);
                        return;
                    }
                    
                    const newMessage = {
                        id: Date.now().toString(),
                        content: data.messageContent,
                        username: data.messageUsername,
                        chatId: data.messageChatId,
                        createdAt: new Date().toISOString(),
                        reactions: {}
                    };
                    
                    console.log('Создано новое сообщение:', newMessage);
                    
                    // Сохраняем сообщение в файл
                    const allMessages = await getCachedData('messages');
                    allMessages.push(newMessage);
                    await fs.writeFile('messages.json', JSON.stringify(allMessages, null, 2));
                    console.log('Сообщение сохранено в файл');
                    
                    // Обновляем онлайн статус чата
                    targetChat.online = (parseInt(targetChat.online) || 0) + 1;
                    console.log('Обновлен онлайн статус чата:', targetChat);
                    
                    // Отправляем подтверждение отправки сообщения
                    ws.send(JSON.stringify({
                        type: 'messageSent',
                        data: newMessage
                    }));
                    console.log('Отправлено подтверждение отправки сообщения');
                    
                    // Отправляем обновленный список сообщений всем клиентам
                    const filteredMessages = allMessages.filter(m => m.chatId === data.messageChatId);
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'messages',
                                data: filteredMessages
                            }));
                        }
                    });
                    console.log('Отправлен обновленный список сообщений всем клиентам');
                    break;

                case 'updateRating':
                    const { ratingChatId, ratingType, ratingAction } = data;
                    const allChats = await getCachedData('chats');
                    const chat = allChats.find(c => c.id === ratingChatId);
                    
                    if (chat) {
                        if (ratingAction === 'add') {
                            if (ratingType === 'like') {
                                chat.likes = (chat.likes || 0) + 1;
                                chat.rating = (chat.rating || 0) + 1;
                            } else if (ratingType === 'dislike') {
                                chat.dislikes = (chat.dislikes || 0) + 1;
                                chat.rating = (chat.rating || 0) - 1;
                            }
                        } else if (ratingAction === 'remove') {
                            if (ratingType === 'like') {
                                chat.likes = Math.max(0, (chat.likes || 0) - 1);
                                chat.rating = Math.max(0, (chat.rating || 0) - 1);
                            } else if (ratingType === 'dislike') {
                                chat.dislikes = Math.max(0, (chat.dislikes || 0) - 1);
                                chat.rating = Math.min(0, (chat.rating || 0) + 1);
                            }
                        }
                        
                        await fs.writeFile('chats.json', JSON.stringify(allChats, null, 2));
                        cache.chats = allChats;
                        ws.send(JSON.stringify({ type: 'ratingUpdated', data: chat }));
                    }
                    break;

                case 'updateOnline':
                    const { onlineChatId, onlineAction } = data;
                    const onlineChats = await getCachedData('chats');
                    const onlineChat = onlineChats.find(c => c.id === onlineChatId);
                    
                    if (onlineChat) {
                        if (onlineAction === 'join') {
                            onlineChat.online = (onlineChat.online || 0) + 1;
                        } else if (onlineAction === 'leave') {
                            onlineChat.online = Math.max(0, (onlineChat.online || 0) - 1);
                        }
                        await fs.writeFile('chats.json', JSON.stringify(onlineChats, null, 2));
                        cache.chats = onlineChats;
                        ws.send(JSON.stringify({ type: 'onlineUpdated', data: onlineChat }));
                    }
                    break;

                case 'addReaction':
                    const { reactionMessageId, reaction, reactionUsername } = data;
                    const reactionMessages = await getCachedData('messages');
                    const reactionMessage = reactionMessages.find(m => m.id === reactionMessageId);
                    
                    if (reactionMessage) {
                        Object.keys(reactionMessage.reactions || {}).forEach(r => {
                            if (reactionMessage.reactions[r].includes(reactionUsername)) {
                                reactionMessage.reactions[r] = reactionMessage.reactions[r].filter(u => u !== reactionUsername);
                                if (reactionMessage.reactions[r].length === 0) {
                                    delete reactionMessage.reactions[r];
                                }
                            }
                        });

                        if (!reactionMessage.reactions) {
                            reactionMessage.reactions = {};
                        }
                        if (!reactionMessage.reactions[reaction]) {
                            reactionMessage.reactions[reaction] = [];
                        }
                        if (!reactionMessage.reactions[reaction].includes(reactionUsername)) {
                            reactionMessage.reactions[reaction].push(reactionUsername);
                        }
                        
                        await fs.writeFile('messages.json', JSON.stringify(reactionMessages, null, 2));
                        cache.messages = reactionMessages;
                        ws.send(JSON.stringify({ type: 'reactionAdded', data: reactionMessage }));
                    }
                    break;

                case 'editMessage':
                    const { editMessageId, editContent } = data;
                    const editMessages = await getCachedData('messages');
                    const editMessage = editMessages.find(m => m.id === editMessageId);
                    
                    if (editMessage) {
                        editMessage.content = editContent;
                        editMessage.edited = true;
                        editMessage.editedAt = new Date().toISOString();
                        await fs.writeFile('messages.json', JSON.stringify(editMessages, null, 2));
                        cache.messages = editMessages;
                        ws.send(JSON.stringify({ type: 'messageEdited', data: editMessage }));
                    }
                    break;

                case 'deleteMessage':
                    const { deleteMessageId } = data;
                    const deleteMessages = await getCachedData('messages');
                    const messageIndex = deleteMessages.findIndex(m => m.id === deleteMessageId);
                    
                    if (messageIndex !== -1) {
                        deleteMessages.splice(messageIndex, 1);
                        await fs.writeFile('messages.json', JSON.stringify(deleteMessages, null, 2));
                        cache.messages = deleteMessages;
                        ws.send(JSON.stringify({ type: 'messageDeleted', data: { id: deleteMessageId } }));
                    }
                    break;

                case 'deleteChat':
                    const { deleteChatId, deleteUsername } = data;
                    const deleteChatsData = await getCachedData('chats');
                    const deleteMessagesData = await getCachedData('messages');
                    
                    const chatIndex = deleteChatsData.findIndex(c => c.id === deleteChatId);
                    if (chatIndex !== -1) {
                        if (deleteChatsData[chatIndex].username !== deleteUsername) {
                            ws.send(JSON.stringify({ 
                                type: 'error', 
                                message: 'You do not have permission to delete this chat' 
                            }));
                            return;
                        }
                        
                        deleteChatsData.splice(chatIndex, 1);
                        await fs.writeFile('chats.json', JSON.stringify(deleteChatsData, null, 2));
                        cache.chats = deleteChatsData;
                        
                        // Удаляем все сообщения чата
                        const filteredMessages = deleteMessagesData.filter(m => m.chatId !== deleteChatId);
                        await fs.writeFile('messages.json', JSON.stringify(filteredMessages, null, 2));
                        cache.messages = filteredMessages;
                        
                        ws.send(JSON.stringify({ type: 'chatDeleted', data: { id: deleteChatId } }));
                    }
                    break;

                case 'editChat':
                    const { editChatId, editName, editUsername } = data;
                    const editChats = await getCachedData('chats');
                    const editChatIndex = editChats.findIndex(c => c.id === editChatId);
                    
                    if (editChatIndex !== -1) {
                        if (editChats[editChatIndex].username !== editUsername) {
                            ws.send(JSON.stringify({ 
                                type: 'error', 
                                message: 'You do not have permission to edit this chat' 
                            }));
                            return;
                        }

                        editChats[editChatIndex].name = editName;
                        await fs.writeFile('chats.json', JSON.stringify(editChats, null, 2));
                        cache.chats = editChats;
                        ws.send(JSON.stringify({ type: 'chatEdited', data: editChats[editChatIndex] }));
                    }
                    break;

                case 'getLastChat':
                    const { getLastChatUsername } = data;
                    try {
                        const lastChatData = await safeReadJsonFile('lastChat.json', {});
                        const userLastChat = lastChatData[getLastChatUsername];
                        ws.send(JSON.stringify({ 
                            type: 'lastChat', 
                            data: userLastChat || { chatId: null }
                        }));
                    } catch (error) {
                        console.error('Error getting last chat:', error);
                        ws.send(JSON.stringify({ 
                            type: 'lastChat', 
                            data: { chatId: null }
                        }));
                    }
                    break;

                case 'saveLastChat':
                    const { lastChatUsername, lastChatId } = data;
                    try {
                        const lastChatData = await safeReadJsonFile('lastChat.json', {});
                        lastChatData[lastChatUsername] = { chatId: lastChatId };
                        await fs.writeFile('lastChat.json', JSON.stringify(lastChatData, null, 2));
                    } catch (error) {
                        console.error('Error saving last chat:', error);
                    }
                    break;

                case 'loadData':
                    // Инициализация всех необходимых файлов
                    try {
                        await Promise.all([
                            safeReadJsonFile('topics.json', []),
                            safeReadJsonFile('chats.json', []),
                            safeReadJsonFile('messages.json', []),
                            safeReadJsonFile('lastChat.json', {})
                        ]);
                        ws.send(JSON.stringify({ type: 'dataLoaded', success: true }));
                    } catch (error) {
                        console.error('Error loading data:', error);
                        ws.send(JSON.stringify({ 
                            type: 'error', 
                            message: 'Error loading data' 
                        }));
                    }
                    break;

                case 'generateSummary':
                    const { prompt } = data;
                    try {
                        // Отправляем запрос на Python-сервер
                        const response = await fetch('http://164.92.226.225:5432/gen', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ prompt })
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        // Читаем ответ как текст
                        const text = await response.text();
                        
                        // Парсим SSE данные
                        const lines = text.split('\n');
                        let summary = '';
                        
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const jsonData = JSON.parse(line.slice(6));
                                    if (jsonData.output) {
                                        summary += jsonData.output;
                                    }
                                } catch (e) {
                                    console.error('Error parsing SSE data:', e);
                                }
                            }
                        }
                        
                        ws.send(JSON.stringify({
                            type: 'summaryGenerated',
                            data: summary
                        }));
                    } catch (error) {
                        console.error('Error generating summary:', error);
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Error generating summary: ' + error.message
                        }));
                    }
                    break;

                default:
                    console.log('Unknown message type:', data.type);
                    break;
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
            ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Error processing request' 
            }));
        }
    });

    ws.on('close', function() {
        console.log('WebSocket client disconnected');
    });
});

// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
//     console.log(`WebSocket server running at ws://localhost:8080`);
// });
app.listen(port, () => {
    console.log(`Server running at ../chat/`);
    console.log(`WebSocket server running at wss://neuroflow.world/chat/ws`);
});