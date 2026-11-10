let currentUser = null;
let currentTopicId = null;
let messages = [];
let expandedReplies = new Set();
let messageToDelete = null;

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function censorText(text) {
  const words = text.split(/\s+/);
  return words
    .map(word => {
      if (word.length < 3) return word;

      const cleanWord = word.replace(/[^a-zA-Zа-яА-ЯїЇіІєЄґҐ]/g, '').toLowerCase();

      const badWords = [
        'хуй', 'пиз', 'пізд', 'бля', 'сук', 'їба', 'нах', 'еба', 'під', 'муд', 'дроч', 'сра', 'гов', 'піс', 'зал', 'шлюха', 'єбать',
        'fuck', 'suck', 'dick', 'cock', 'shit', 'ass', 'bitch', 'cunt', 'pussy', 'bastard', 'damn', 'fucker', 'motherfucker',
        'asshole', 'prick', 'twat', 'wank', 'whore', 'slut'
      ];

      const isSuspicious =
        badWords.some(bad => cleanWord.includes(bad)) ||
        /(.)\1{2,}/.test(cleanWord) ||
        /[бпвфхжгк][лтдкщшч][аяеиіоуї]/.test(cleanWord) ||
        /[сзц][кпб][аяеиоуї]/.test(cleanWord) ||
        /[йєґхжшчщ][бпвф][яюєї]/.test(cleanWord) ||
        (word === word.toUpperCase() && word.length > 3) ||
        /[\w][@#$%^&*0-9]+[\w]/.test(word) ||
        /([бпвфгкдт])[бпвфгкдт][аяеиоуї]/.test(cleanWord) ||
        /^(ху|пі|су|бл|еб|йоб|їб)/i.test(cleanWord);

      if (isSuspicious) {
        return '*'.repeat(word.length);
      }
      return word;
    })
    .join(' ');
}

async function loadMessages(topicId) {
  try {
    currentTopicId = topicId;
    const response = await fetch('../base_date/messages.json');
    messages = (await response.json()).messages.filter(msg => msg.topicId === topicId) || [];

    const topicResponse = await fetch('../base_date/topics.json');
    const topics = (await topicResponse.json()).topics || [];
    const topic = topics.find(t => t.id === topicId);
    document.getElementById('topicTitle').textContent = topic ? topic.title : 'Тема форуму';

    displayMessages();
    checkAuth();
  } catch (error) {
    console.error('Помилка при завантаженні повідомлень:', error);
  }
}

function checkAuth() {
  const userEmail = getCookie('userEmail');
  const userName = decodeURIComponent(getCookie('userName') || '');

  if (userEmail && userName) {
    currentUser = {
      email: decodeURIComponent(userEmail).replace(/%40/g, '@'),
      name: decodeURIComponent(userName)
    };
    document.getElementById('messageInput')?.classList.remove('d-none');
    document.getElementById('authMessage')?.classList.add('d-none');
  } else {
    currentUser = null;
    document.getElementById('messageInput')?.classList.add('d-none');
    document.getElementById('authMessage')?.classList.remove('d-none');
  }
}

async function addMessage() {
  if (!currentUser || !currentTopicId) return;

  const messageText = document.getElementById('messageText')?.value.trim();
  if (!messageText) return;

  const censoredText = censorText(messageText);
  const newMessage = {
    id: Date.now(),
    topicId: currentTopicId,
    text: censoredText,
    author: currentUser.name,
    authorEmail: currentUser.email,
    authorPicture: 'assets/img/default-avatar.png',
    timestamp: new Date().toISOString(),
    edited: false,
    likes: [],
    dislikes: [],
    love: [],
    laugh: [],
    wow: []
  };

  messages.push(newMessage);
  document.getElementById('messageText').value = '';
  displayMessages();
}

async function handleReaction(messageId, reactionType) {
  if (!currentUser) {
    showAuthMessage('Будь ласка, увійдіть в систему, щоб додавати реакції');
    return;
  }

  const message = messages.find(m => m.id === messageId);
  if (!message) return;

  const reactionArray = message[reactionType] || [];
  const userEmail = currentUser.email;

  if (reactionArray.includes(userEmail)) {
    message[reactionType] = reactionArray.filter(email => email !== userEmail);
  } else {
    message[reactionType].push(userEmail);
  }

  displayMessages();
}

function showReplyForm(messageId) {
  if (!currentUser) {
    showAuthMessage('Будь ласка, увійдіть щоб відповісти');
    return;
  }

  const replyForm = document.getElementById(`replyForm${messageId}`);
  if (replyForm) replyForm.classList.toggle('show');
}

function toggleReplies(messageId) {
  const repliesContainer = document.getElementById(`replies${messageId}`);
  const toggleButton = document.querySelector(`[data-toggle-replies="${messageId}"]`);

  if (repliesContainer && toggleButton) {
    repliesContainer.classList.toggle('expanded');
    toggleButton.classList.toggle('expanded');

    if (repliesContainer.classList.contains('expanded')) {
      expandedReplies.add(messageId);
    } else {
      expandedReplies.delete(messageId);
    }
  }
}

async function submitReply(parentId) {
  if (!currentUser || !currentTopicId) return;

  const replyForm = document.getElementById(`replyForm${parentId}`);
  const textarea = replyForm?.querySelector('textarea');
  const messageText = textarea?.value.trim();

  if (!messageText) return;

  const censoredText = censorText(messageText);
  const newReply = {
    id: Date.now(),
    topicId: currentTopicId,
    text: censoredText,
    author: currentUser.name,
    authorEmail: currentUser.email,
    authorPicture: 'assets/img/default-avatar.png',
    timestamp: new Date().toISOString(),
    parentId: parentId,
    edited: false,
    likes: [],
    dislikes: [],
    love: [],
    laugh: [],
    wow: []
  };

  messages.push(newReply);
  textarea.value = '';
  replyForm.classList.remove('show');
  displayMessages();
}

function displayMessages() {
  const messageList = document.querySelector('.message-list');
  if (!messageList) return;

  messageList.innerHTML = '';

  const repliesByParentId = {};
  messages.forEach(message => {
    if (message.parentId) {
      if (!repliesByParentId[message.parentId]) repliesByParentId[message.parentId] = [];
      repliesByParentId[message.parentId].push(message);
    }
  });

  function displayMessage(message, level = 0) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message-item';
    messageElement.dataset.messageId = message.id;
    messageElement.style.marginLeft = `${level * 40}px`;

    const likes = message.likes?.length || 0;
    const dislikes = message.dislikes?.length || 0;
    const loves = message.love?.length || 0;
    const laughs = message.laugh?.length || 0;
    const wows = message.wow?.length || 0;

    const userHasLiked = message.likes?.includes(currentUser?.email);
    const userHasDisliked = message.dislikes?.includes(currentUser?.email);
    const userHasLoved = message.love?.includes(currentUser?.email);
    const userHasLaughed = message.laugh?.includes(currentUser?.email);
    const userHasWowed = message.wow?.includes(currentUser?.email);

    const replies = repliesByParentId[message.id] || [];
    const isExpanded = expandedReplies.has(message.id);

    messageElement.innerHTML = `
      <div class="message-header">
        <div class="message-author">
          <img src="${message.authorPicture || 'assets/img/default-avatar.png'}" alt="${message.author}">
          <span>${message.author}</span>
        </div>
        <div class="message-meta">
          <div class="message-time">${new Date(message.timestamp).toLocaleString()}</div>
          ${message.edited ? `<div class="message-edited">(відредаговано ${new Date(message.editedAt).toLocaleString()})</div>` : ''}
          ${message.authorEmail === currentUser?.email ? `
            <div class="message-actions-edit">
              <button class="btn btn-sm btn-outline-primary block_up_little_lit" onclick="showEditForm(${message.id})">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger block_up_little_lit" onclick="deleteMessage(${message.id})">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="message-content" id="messageContent${message.id}">${message.text}</div>
      <div class="edit-form" id="editForm${message.id}">
        <textarea class="form-control mb-2" rows="3">${message.text}</textarea>
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm block_up_little_lit" onclick="saveEdit(${message.id})">Зберегти</button>
          <button class="btn btn-secondary btn-sm block_up_little_lit" onclick="cancelEdit(${message.id})">Скасувати</button>
        </div>
      </div>
      <div class="message-actions">
        <div class="reactions-container">
          <button class="reaction-button block_up_little_lit ${userHasLiked ? 'active' : ''}" onclick="handleReaction(${message.id}, 'likes')">
            👍 <span class="reaction-count">${likes}</span>
          </button>
          <button class="reaction-button block_up_little_lit ${userHasDisliked ? 'active' : ''}" onclick="handleReaction(${message.id}, 'dislikes')">
            👎 <span class="reaction-count">${dislikes}</span>
          </button>
          <button class="reaction-button block_up_little_lit ${userHasLoved ? 'active' : ''}" onclick="handleReaction(${message.id}, 'love')">
            ❤️ <span class="reaction-count">${loves}</span>
          </button>
          <button class="reaction-button block_up_little_lit ${userHasLaughed ? 'active' : ''}" onclick="handleReaction(${message.id}, 'laugh')">
            😂 <span class="reaction-count">${laughs}</span>
          </button>
          <button class="reaction-button block_up_little_lit ${userHasWowed ? 'active' : ''}" onclick="handleReaction(${message.id}, 'wow')">
            😮 <span class="reaction-count">${wows}</span>
          </button>
        </div>
        <button class="reply-button block_up_little_lit" onclick="showReplyForm(${message.id})">
          Відповісти
        </button>
      </div>
      <div id="replyForm${message.id}" class="reply-form">
        <textarea class="form-control mb-2" rows="2" placeholder="Напишіть вашу відповідь..."></textarea>
        <button class="btn btn-primary btn-sm block_up_little_lit" onclick="submitReply(${message.id})">Відправити</button>
      </div>
      ${replies.length > 0 ? `
        <div class="replies-toggle ${isExpanded ? 'expanded' : ''}" data-toggle-replies="${message.id}" onclick="toggleReplies(${message.id})">
          <i class="bi bi-chevron-down"></i>
          <span>Відповіді</span>
          <span class="replies-count">${replies.length}</span>
        </div>
        <div id="replies${message.id}" class="replies ${isExpanded ? 'expanded' : ''}">
          ${replies.map(reply => displayMessage(reply, level + 1)).join('')}
        </div>
      ` : ''}
    `;
    return messageElement.outerHTML;
  }

  messages
    .filter(message => !message.parentId)
    .forEach(message => {
      messageList.innerHTML += displayMessage(message);
    });
}

function showAuthMessage(message) {
  const authMessage = document.getElementById('authMessage');
  if (authMessage) {
    authMessage.textContent = message;
    authMessage.classList.remove('d-none');
    setTimeout(() => authMessage.classList.add('d-none'), 3000);
  }
}

function showEditForm(messageId) {
  const contentElement = document.getElementById(`messageContent${messageId}`);
  const editForm = document.getElementById(`editForm${messageId}`);

  if (contentElement && editForm) {
    contentElement.style.display = 'none';
    editForm.classList.add('show');
  }
}

function cancelEdit(messageId) {
  const contentElement = document.getElementById(`messageContent${messageId}`);
  const editForm = document.getElementById(`editForm${messageId}`);

  if (contentElement && editForm) {
    contentElement.style.display = 'block';
    editForm.classList.remove('show');
  }
}

async function saveEdit(messageId) {
  const editForm = document.getElementById(`editForm${messageId}`);
  const textarea = editForm?.querySelector('textarea');
  const newText = textarea?.value.trim();
  const contentElement = document.getElementById(`messageContent${messageId}`);

  if (!newText || newText === contentElement?.textContent) {
    cancelEdit(messageId);
    return;
  }

  const censoredText = censorText(newText);
  const messageIndex = messages.findIndex(m => m.id === messageId);
  if (messageIndex !== -1) {
    messages[messageIndex] = {
      ...messages[messageIndex],
      text: censoredText,
      edited: true,
      editedAt: new Date().toISOString()
    };
    displayMessages();
  }
}

function showDeleteMessageModal(messageId) {
  messageToDelete = messageId;
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteMessageModal'));
  deleteModal.show();
}

async function deleteMessage() {
  if (messageToDelete) {
    messages = messages.filter(m => m.id !== messageToDelete);
    displayMessages();
    messageToDelete = null;
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteMessageModal'));
    deleteModal.hide();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const confirmDeleteBtn = document.getElementById('confirmDeleteMessageBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', deleteMessage);
  }

  const messageText = document.getElementById('messageText');
  if (messageText) {
    messageText.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addMessage();
      }
    });
  }
});
