const API_URL = '/api/generate';
const systemPrompt = `You are Vika, a manager at NeuroFlow, a company that develops artificial intelligence solutions for businesses and private clients. You are polite, professional, and always try to be as helpful as possible. Answer briefly, to the point, and with a friendly tone. If a user asks a question that requires up-to-date information (such as weather, news, or the current date), use the search results provided. If there are no search results, answer based on your knowledge, but make it clear that the information may not be up-to-date. Always follow the language guidelines. Add the 💕 emoji at the end of your answers, if appropriate.`;

// Глобальные переменные для элементов DOM
let chatWindow, chatButton, messageInput, chatMessages;

function initializeElements() {
    chatWindow = document.getElementById('chatWindow');
    chatButton = document.querySelector('.chat-button');
    messageInput = document.getElementById('messageInputUN');
    chatMessages = document.getElementById('chatMessages');

    if (!chatWindow || !chatButton || !messageInput || !chatMessages) {
        console.error('Не удалось найти необходимые элементы DOM: ', {
            chatWindow: !!chatWindow,
            chatButton: !!chatButton,
            messageInput: !!messageInput,
            chatMessages: !!chatMessages
        });
        return false;
    }
    console.log('Все элементы DOM успешно найдены');
    return true;
}

function toggleChat() {
    if (!chatWindow || !chatButton) return;
    
    if (chatWindow.style.display === 'none' || !chatWindow.style.display) {
        chatWindow.style.display = 'flex';
        chatButton.style.display = 'none';
    } else {
        chatWindow.style.display = 'none';
        chatButton.style.display = 'flex';
    }
}

function addMessage(text, sender) {
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'sent' : 'received'}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function detectLanguage(message) {
    const latinPattern = /^[a-zA-Z\s?!.,]*$/;
    const ukrainianPattern = /[іїєґ]/i;
    const ukrainianKeywords = /\b(що|як|коли|де|чому)\b/i;

    if (latinPattern.test(message)) {
        return 'en';
    }
    return 'uk';
}

async function sendMessage_nopobleminfuture() {
    if (!messageInput) {
        console.error('Элемент messageInput не найден');
        return;
    }

    const message = messageInput.value.trim();
    if (!message) return;

    // Показываем сообщение пользователя
    addMessage(message, 'user');
    messageInput.value = '';

    // Показываем индикатор загрузки
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message received';
    loadingDiv.textContent = 'Vika writes...';
    chatMessages.appendChild(loadingDiv);

    let attempts = 0;
    const maxAttempts = 10;
    const timeout = 3000;

    while (attempts < maxAttempts) {
        attempts++;
        if (attempts > 1) {
            loadingDiv.textContent = `Let's try again (${attempts}/${maxAttempts})...`;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const detectedLanguage = detectLanguage(message);
            console.log(`Спроба ${attempts}: Визначена мова: ${detectedLanguage}`);

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `${systemPrompt}\n\nКористувач (${detectedLanguage}): ${message}\n\nВіка:`,
                    language: detectedLanguage,
                    message: message
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            let botMessage = '';
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message received';
            chatMessages.appendChild(messageDiv);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = new TextDecoder().decode(value);
                const lines = text.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.output) {
                                botMessage += parsed.output;
                                messageDiv.textContent = botMessage;
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            } else if (parsed.error) {
                                throw new Error(parsed.error);
                            }
                        } catch (e) {
                            console.error('Помилка парсингу даних:', e);
                        }
                    }
                }
            }

            loadingDiv.remove();
            break;

        } catch (error) {
            console.error(`Спроба ${attempts}: Помилка:`, error);
            if (error.name === 'AbortError') {
                console.log(`Спроба ${attempts} з ${maxAttempts} не вдалася через таймаут`);
                if (attempts === maxAttempts) {
                    loadingDiv.remove();
                    addMessage('Sorry, the server is not responding. Please try again later 😔', 'bot');
                    break;
                }
                continue;
            }
            loadingDiv.remove();
            addMessage('Sorry, an error occurred while processing your request 😔', 'bot');
            break;
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (initializeElements()) {
        // Добавляем обработчик Enter для отправки сообщений
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage_nopobleminfuture();
            }
        });
    }
});
