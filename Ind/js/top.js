// Функции для работы с топ-чатами
let chats = [];
let categories = [];

// Загрузка списка чатов и категорий
async function loadData() {
    // Загрузка категорий
    const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);
    const categoriesData = await categoriesResponse.json();
    categories = categoriesData.categories || [];
    updateCategorySelect();
    
    // Загрузка чатов
    const chatsResponse = await fetch(`${API_BASE_URL}/api/chats`);
    const chatsData = await chatsResponse.json();
    chats = chatsData.chats || [];
    displayChats();
}

// Обновление списка категорий в селекте
function updateCategorySelect() {
    const select = document.getElementById('chatCategory');
    select.innerHTML = '';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

// Отображение списка чатов
function displayChats() {
    const container = document.getElementById('chatsList');
    container.innerHTML = '';
    
    // Сортировка чатов по рейтингу
    const sortedChats = [...chats].sort((a, b) => {
        const ratingA = calculateRating(a);
        const ratingB = calculateRating(b);
        return ratingB - ratingA;
    });
    
    sortedChats.forEach(chat => {
        const chatElement = createChatElement(chat);
        container.appendChild(chatElement);
    });
}

// Расчет рейтинга чата
function calculateRating(chat) {
    const onlineWeight = 2;
    const reactionWeight = 1;
    return (chat.online || 0) * onlineWeight + (chat.reactions || 0) * reactionWeight;
}

// Создание элемента чата
function createChatElement(chat) {
    const div = document.createElement('div');
    div.className = 'col-12 mb-3';
    
    const card = document.createElement('div');
    card.className = 'chat-card';
    card.onclick = () => {
        switchTab('chat');
        loadChat(chat.id);
    };
    
    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center';
    
    const title = document.createElement('h4');
    title.textContent = chat.name;
    
    const category = document.createElement('span');
    category.className = 'badge bg-secondary';
    const categoryData = categories.find(c => c.id === chat.category);
    category.textContent = categoryData ? categoryData.name : chat.category;
    
    header.appendChild(title);
    header.appendChild(category);
    
    const rating = document.createElement('div');
    rating.className = 'rating';
    
    const ratingValue = calculateRating(chat);
    const maxRating = Math.max(...chats.map(calculateRating));
    const ratingPercentage = (ratingValue / maxRating) * 100;
    
    const ratingBar = document.createElement('div');
    ratingBar.className = 'rating-bar';
    
    const ratingBarFill = document.createElement('div');
    ratingBarFill.className = 'rating-bar-fill';
    ratingBarFill.style.width = `${ratingPercentage}%`;
    
    ratingBar.appendChild(ratingBarFill);
    
    const stats = document.createElement('div');
    stats.className = 'd-flex justify-content-between mt-2';
    
    const online = document.createElement('div');
    online.className = 'online-count';
    online.textContent = `Онлайн: ${chat.online || 0}`;
    
    const reactions = document.createElement('div');
    reactions.className = 'reactions-count';
    reactions.textContent = `Реакций: ${chat.reactions || 0}`;
    
    stats.appendChild(online);
    stats.appendChild(reactions);
    
    card.appendChild(header);
    card.appendChild(ratingBar);
    card.appendChild(stats);
    div.appendChild(card);
    
    return div;
}

// Создание нового чата
async function createChat(name, category) {
    const response = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, category })
    });
    
    if (response.ok) {
        const newChat = await response.json();
        chats.push(newChat);
        displayChats();
        return newChat;
    }
}

// Создание новой темы
async function createCategory(name, description) {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description })
    });
    
    if (response.ok) {
        const newCategory = await response.json();
        categories.push(newCategory);
        updateCategorySelect();
        return newCategory;
    }
}

// Обновление статистики чата
async function updateChatStats(chatId, stats) {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
        Object.assign(chat, stats);
        await saveToJson({ chats }, 'chats/list.json');
        displayChats();
    }
}

// Инициализация обработчиков событий
document.addEventListener('DOMContentLoaded', () => {
    const createChatBtn = document.getElementById('createChatBtn');
    const createCategoryBtn = document.getElementById('createCategoryBtn');
    const createChatModal = new bootstrap.Modal(document.getElementById('createChatModal'));
    const createCategoryModal = new bootstrap.Modal(document.getElementById('createCategoryModal'));
    const submitCreateChat = document.getElementById('submitCreateChat');
    const submitCreateCategory = document.getElementById('submitCreateCategory');
    
    // Загрузка данных при загрузке страницы
    loadData();
    
    createChatBtn.addEventListener('click', () => {
        createChatModal.show();
    });
    
    createCategoryBtn.addEventListener('click', () => {
        createCategoryModal.show();
    });
    
    submitCreateChat.addEventListener('click', async () => {
        const name = document.getElementById('chatName').value;
        const category = document.getElementById('chatCategory').value;
        
        if (name && category) {
            const newChat = await createChat(name, category);
            if (newChat) {
                createChatModal.hide();
                
                // Очистка формы
                document.getElementById('chatName').value = '';
                document.getElementById('chatCategory').value = categories[0]?.id || '';
                
                // Переход в новый чат
                switchTab('chat');
                loadChat(newChat.id);
            }
        }
    });
    
    submitCreateCategory.addEventListener('click', async () => {
        const name = document.getElementById('categoryName').value;
        const description = document.getElementById('categoryDescription').value;
        
        if (name && description) {
            const newCategory = await createCategory(name, description);
            if (newCategory) {
                createCategoryModal.hide();
                
                // Очистка формы
                document.getElementById('categoryName').value = '';
                document.getElementById('categoryDescription').value = '';
            }
        }
    });
    
    // Загрузка списка чатов при открытии вкладки
    document.querySelector('[data-tab="top"]').addEventListener('click', loadData);
}); 