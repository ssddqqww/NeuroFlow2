// Глобальные переменные
let currentUser = {
    id: generateUserId(),
    name: 'Гость'
};

let currentChat = null;
let lastVisitedChat = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация пользователя
    currentUser = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: 'Пользователь'
    };

    // Загрузка последнего посещенного чата
    loadLastVisitedChat();

    // Обработчики переключения вкладок
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
});

// Генерация уникального ID пользователя
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Инициализация вкладок
function initializeTabs() {
    const tabLinks = document.querySelectorAll('.nav-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

// Переключение вкладок
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.getElementById(`${tabId}-tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

// Загрузка последнего посещенного чата
async function loadLastVisitedChat() {
    const userData = await loadFromJson(`users/${currentUser.id}.json`);
    if (userData && userData.lastVisitedChat) {
        lastVisitedChat = userData.lastVisitedChat;
        switchTab('chat');
        loadChat(lastVisitedChat);
    }
}

// Сохранение последнего посещенного чата
async function saveLastVisitedChat(chatId) {
    lastVisitedChat = chatId;
    await saveToJson({ lastVisitedChat: chatId }, `users/${currentUser.id}.json`);
}

// Фильтрация матерных слов
function filterBadWords(text) {
    const badWords = ['мат1', 'мат2', 'мат3']; // Добавьте список матерных слов
    let filteredText = text;
    badWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    return filteredText;
}

// Сохранение данных в JSON
async function saveToJson(data, filename) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/save/${filename}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error);
    }
}

// Загрузка данных из JSON
async function loadFromJson(filename) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/load/${filename}`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        return null;
    }
} 