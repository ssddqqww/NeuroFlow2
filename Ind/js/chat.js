// Глобальные переменные
let currentChatId = null;
let onlineUsers = new Set();
let userReactions = new Map();

// Доступные реакции
const REACTIONS = {
    '👍': 'like',
    '👎': 'dislike',
    '❤️': 'heart',
    '😂': 'laugh',
    '😮': 'wow',
    '😢': 'sad',
    '😡': 'angry',
    '👏': 'clap',
    '🙏': 'pray',
    '🎉': 'party'
};

// Загрузка чата
async function loadChat(chatId) {
    currentChatId = chatId;
    
    // Получаем информацию о чате
    const response = await fetch(`${API_BASE_URL}/api/chats`);
    const chats = await response.json();
    const chat = chats.chats.find(c => c.id === chatId);
    document.getElementById('currentChatName').textContent = chat.name;
    
    // Обновляем счетчик онлайн
    onlineUsers.add(currentUser.id);
    await updateOnlineCount();
    
    // Загружаем сообщения
    const messagesResponse = await fetch(`${API_BASE_URL}/api/messages/${chatId}`);
    const messagesData = await messagesResponse.json();
    displayMessages(messagesData.messages);
}

// Загрузка сообщений
async function loadMessages(chatId) {
    const data = await loadFromJson('chats/messages.json');
    return data.messages.filter(m => m.chatId === chatId);
}

// Сохранение сообщений
async function saveMessages(messages) {
    const data = await loadFromJson('chats/messages.json');
    data.messages = messages;
    await saveToJson(data, 'chats/messages.json');
}

// Отображение сообщений
function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        container.appendChild(messageElement);
    });
    
    // Прокрутка к последнему сообщению
    container.scrollTop = container.scrollHeight;
}

// Создание элемента сообщения
function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message ${message.userId === currentUser.id ? 'message-own' : ''}`;
    div.dataset.messageId = message.id;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const text = document.createElement('div');
    text.className = 'message-text';
    text.textContent = message.text;
    
    const info = document.createElement('div');
    info.className = 'message-info';
    
    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = new Date(message.timestamp).toLocaleTimeString();
    
    const edited = document.createElement('span');
    edited.className = 'message-edited';
    edited.textContent = message.edited ? '(ред.)' : '';
    
    info.appendChild(time);
    info.appendChild(edited);
    
    content.appendChild(text);
    content.appendChild(info);
    
    // Добавляем кнопки действий только для своих сообщений
    if (message.userId === currentUser.id) {
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-icon edit-btn';
        editBtn.innerHTML = '✏️';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editMessage(message.id, text);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteMessage(message.id);
        };
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        content.appendChild(actions);
    }
    
    // Добавляем кнопки реакций
    const reactions = document.createElement('div');
    reactions.className = 'message-reactions';
    
    const reactionButtons = [
        { emoji: '👍', type: 'like' },
        { emoji: '👎', type: 'dislike' },
        { emoji: '❤️', type: 'heart' },
        { emoji: '😂', type: 'laugh' },
        { emoji: '😮', type: 'wow' },
        { emoji: '😢', type: 'sad' },
        { emoji: '😡', type: 'angry' },
        { emoji: '👏', type: 'clap' },
        { emoji: '🙏', type: 'pray' },
        { emoji: '🎉', type: 'party' }
    ];
    
    reactionButtons.forEach(({ emoji, type }) => {
        const btn = document.createElement('button');
        btn.className = 'btn-icon reaction-btn';
        btn.innerHTML = emoji;
        btn.onclick = (e) => {
            e.stopPropagation();
            addReaction(message.id, type);
        };
        reactions.appendChild(btn);
    });
    
    content.appendChild(reactions);
    div.appendChild(content);
    
    return div;
}

// Редактирование сообщения
async function editMessage(messageId, textElement) {
    const input = document.createElement('textarea');
    input.className = 'form-control message-edit-input';
    input.value = textElement.textContent;
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary btn-sm';
    saveBtn.textContent = 'Сохранить';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary btn-sm';
    cancelBtn.textContent = 'Отмена';
    
    const editContainer = document.createElement('div');
    editContainer.className = 'message-edit-container';
    editContainer.appendChild(input);
    editContainer.appendChild(saveBtn);
    editContainer.appendChild(cancelBtn);
    
    textElement.parentNode.replaceChild(editContainer, textElement);
    input.focus();
    
    const saveEdit = async () => {
        const newText = input.value.trim();
        if (newText) {
            const response = await fetch(`/api/messages/${messageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: newText,
                    edited: true
                })
            });
            
            if (response.ok) {
                const messagesResponse = await fetch(`/api/messages/${currentChatId}`);
                const messagesData = await messagesResponse.json();
                displayMessages(messagesData.messages);
            }
        }
    };
    
    saveBtn.onclick = saveEdit;
    cancelBtn.onclick = () => {
        editContainer.parentNode.replaceChild(textElement, editContainer);
    };
    
    input.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelBtn.click();
        }
    };
}

// Удаление сообщения
async function deleteMessage(messageId) {
    if (confirm('Вы уверены, что хотите удалить это сообщение?')) {
        const response = await fetch(`/api/messages/${messageId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const messagesResponse = await fetch(`/api/messages/${currentChatId}`);
            const messagesData = await messagesResponse.json();
            displayMessages(messagesData.messages);
        }
    }
}

// Добавление реакции
async function addReaction(messageId, reactionType) {
    const response = await fetch(`/api/reactions/${currentChatId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messageId,
            userId: currentUser.id,
            reactionType
        })
    });
    
    if (response.ok) {
        const reactionsResponse = await fetch(`/api/reactions/${currentChatId}`);
        const reactions = await reactionsResponse.json();
        updateReactionsDisplay(messageId, reactions);
    }
}

// Обновление счетчика онлайн
async function updateOnlineCount() {
    const count = onlineUsers.size;
    document.getElementById('onlineCount').textContent = `Онлайн: ${count}`;
    
    const response = await fetch(`/api/chats/${currentChatId}/stats`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ online: count })
    });
}

// Отправка сообщения
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (text) {
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chatId: currentChatId,
                userId: currentUser.id,
                text: filterBadWords(text)
            })
        });
        
        if (response.ok) {
            const messagesResponse = await fetch(`${API_BASE_URL}/api/messages/${currentChatId}`);
            const messagesData = await messagesResponse.json();
            displayMessages(messagesData.messages);
            input.value = '';
        }
    }
}

// Инициализация обработчиков событий
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendMessage');
    
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Очистка при выходе из чата
    window.addEventListener('beforeunload', () => {
        if (currentChatId) {
            onlineUsers.delete(currentUser.id);
            updateOnlineCount();
        }
    });
}); 