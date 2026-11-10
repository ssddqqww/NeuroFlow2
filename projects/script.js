function runCode() {
    const html = document.getElementById('htmlCode').value;
    const css = document.getElementById('cssCode').value;
    const js = document.getElementById('jsCode').value;

    const output = document.getElementById('output');
    const code = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${css}</style>
        </head>
        <body>
            ${html}
            <script>${js}<\/script>
        </body>
        </html>
    `;

    output.contentDocument.open();
    output.contentDocument.write(code);
    output.contentDocument.close();
}

function showPublishForm() {
    document.getElementById('publish-modal').style.display = 'flex';
    document.getElementById('publishBtn').style.display = 'none';
}

function cancelPublish() {
    document.getElementById('publish-modal').style.display = 'none';
    document.getElementById('publishBtn').style.display = 'block';
    document.getElementById('projectName').value = '';
    document.getElementById('projectCategory').value = '';
}

function showMainView() {
    document.getElementById('mainContainer').classList.remove('hidden');
    document.getElementById('resultView').style.display = 'none';
}

function saveUserActions(userActions) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/aplication/user-actions', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        resolve(true);
                    } else {
                        reject(new Error(response.error || 'Ошибка сохранения действий пользователя'));
                    }
                } catch (error) {
                    reject(new Error('Ошибка при обработке ответа'));
                }
            } else {
                reject(new Error('Ошибка сохранения действий пользователя'));
            }
        };

        xhr.onerror = function() {
            reject(new Error('Ошибка сети'));
        };

        try {
            xhr.send(JSON.stringify(userActions));
        } catch (error) {
            reject(error);
        }
    });
}





// Manager JS
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





//my.js 


function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: false,
      mirror: false
    });
  }
  
  function toggleBlocks(buttonId) {
    // Если нажата кнопка Features, оставляем текущее поведение
    if (buttonId === 'features_func') {
        const sections_block = [
            document.getElementById('features'),
            document.getElementById('features-cards'),
            document.getElementById('services'),
            document.getElementById('clients'),
            document.getElementById('faq'),
            document.getElementById('stats'),
            document.getElementById('about'),
            document.getElementById('features_one'),
            document.getElementById('features_cards_two'),
            document.getElementById('call-to-action'),
            document.getElementById('topics-container'),
            document.getElementById('forum-container'),
            document.getElementById('top-messages-container'),
            document.getElementById('news')
        ];

        const sections_link = [
            document.getElementById('home_func'),
            document.getElementById('about_func'),
            document.getElementById('features_func'),
            document.getElementById('top_func'),
            document.getElementById('topics_container_func'),
            document.getElementById('news_func'),
            document.getElementById('download_func')
        ];

        sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));
        document.getElementById('features_one').classList.remove('hidden_all_h');
        document.getElementById('features_cards_two').classList.remove('hidden_all_h');
        sections_link.forEach(sections_link => sections_link.classList.remove('active'));
        sections_link[2].classList.add('active');

        setTimeout(() => {
            AOS.refresh();
        }, 50);
    } else {
        // Для остальных кнопок делаем перенаправление
        const sectionParams = {
            'home_func': 'home',
            'about_func': 'about',
            'top_func': 'top',
            'topics_container_func': 'chat',
            'news_func': 'news',
            'download_func': 'download'
        };

        const urlParam = sectionParams[buttonId];
        if (urlParam) {
            window.location.href = `../index.html?section=${urlParam}`;
        }
    }

    console.log('Нажата кнопка с id: ' + buttonId);
  }
  
  function convertTextToSpans(element) {
    const text = element.textContent;
    element.innerHTML = '';
    element.classList.remove('text_hov');
    element.classList.add('wave-text');
  
    text.split('').forEach(char => {
      const span = document.createElement('span');
      span.textContent = char;
      element.appendChild(span);
    });
  }
  
  const textHovElements = document.querySelectorAll('.text_hov');
  textHovElements.forEach(element => {
    convertTextToSpans(element);
    let timeoutId;
    element.addEventListener('mouseenter', function() {
      clearTimeout(timeoutId);
      this.classList.add('active');
    });
    element.addEventListener('mouseleave', function() {
      timeoutId = setTimeout(() => {
        this.classList.remove('active');
      }, 100);
    });
  });
  
  window.addEventListener('load', aosInit);
  
