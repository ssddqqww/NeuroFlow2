
let currentUser = null;
let topicToDelete = null;
let messageToDelete = null;
let allTopics = [];
let messages = [];
let expandedReplies = new Set();
let currentTopicId = null;

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

function checkAuth() {
  const userEmail = getCookie('userEmail');
  const userName = decodeURIComponent(getCookie('userName') || '');

  if (userEmail && userName) {
    currentUser = {
      email: decodeURIComponent(userEmail).replace(/%40/g, '@'),
      name: decodeURIComponent(userName)
    };
  } else {
    currentUser = {
      email: 'test@example.com',
      name: 'Test User'
    };
    document.cookie = 'userEmail=test@example.com; path=/';
    document.cookie = 'userName=Test%20User; path=/';
  }

  document.getElementById('createTopicSection')?.classList.remove('hidden');
  document.getElementById('authMessage')?.classList.add('hidden');
  document.getElementById('messageInput')?.classList.remove('d-none');
  document.getElementById('forumAuthMessage')?.classList.add('d-none');
}

function saveTopics() {
  localStorage.setItem('topics', JSON.stringify({ topics: allTopics }));
}

function saveMessages() {
  localStorage.setItem('messages', JSON.stringify({ messages }));
}

async function loadTopics() {
  try {
    const storedTopics = localStorage.getItem('topics');
    if (storedTopics) {
      allTopics = JSON.parse(storedTopics).topics || [];
    } else {
      const response = await fetch('base_date/topics.json');
      allTopics = (await response.json()).topics || [];
      saveTopics();
    }
    const messageList = document.getElementById('messageList');
    if (messageList) {
      messageList.innerHTML = '';
    }
    filterTopics();
  } catch (error) {
    console.error('Помилка при завантаженні тем:', error);
  }
}

function filterTopics() {
  const searchText = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const filteredTopics = allTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchText)
  );

  const topicList = document.getElementById('topicList');
  if (!topicList) return;

  topicList.innerHTML = '';

  filteredTopics.forEach(topic => {
    const topicElement = document.createElement('div');
    topicElement.className = 'topic-item';
    topicElement.innerHTML = `
      <div class="topic-content" id="topicContent${topic.id}" onclick="showForumSection(${topic.id})">
        <div class="topic-title">${topic.title}</div>
      </div>
      <div class="edit-form" id="editForm${topic.id}">
        <input type="text" class="form-control mb-2" value="${topic.title}">
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm block_up_little_lit" onclick="saveEditTopic(${topic.id})">Зберегти</button>
          <button class="btn btn-secondary btn-sm block_up_little_lit" onclick="cancelEditTopic(${topic.id})">Скасувати</button>
        </div>
      </div>
      <div class="topic-meta">
        <span><i class="bi bi-person"></i> ${topic.author}</span>
        <span><i class="bi bi-clock"></i> ${new Date(topic.createdAt).toLocaleString()}</span>
        ${topic.edited ? `<span class="text-muted">(відредаговано ${new Date(topic.editedAt).toLocaleString()})</span>` : ''}
        ${topic.authorEmail === currentUser?.email ? `
          <div class="topic-actions-edit">
            <button class="btn btn-sm btn-outline-primary block_up_little_lit" onclick="event.stopPropagation(); showEditTopicForm(${topic.id})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger block_up_little_lit" onclick="event.stopPropagation(); showDeleteTopicModal(${topic.id})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
    topicList.appendChild(topicElement);
  });

  const messageList = document.getElementById('messageList');
  if (messageList) {
    messageList.innerHTML = '';
  }
}

function showCreateTopicForm() {
  const topicForm = document.getElementById('topicForm');
  if (topicForm) topicForm.classList.remove('hidden');
}

async function createTopic() {
  if (!currentUser) return;

  const titleInput = document.getElementById('topicTitle');
  const title = titleInput?.value.trim();
  if (!title) return;

  const censoredTitle = censorText(title);
  const newTopic = {
    id: Date.now(),
    title: censoredTitle,
    author: currentUser.name,
    authorEmail: currentUser.email,
    createdAt: new Date().toISOString(),
    edited: false
  };

  allTopics.push(newTopic);
  saveTopics();
  titleInput.value = '';
  document.getElementById('topicForm')?.classList.add('hidden');
  filterTopics();
}

function showEditTopicForm(topicId) {
  const contentElement = document.getElementById(`topicContent${topicId}`);
  const editForm = document.getElementById(`editForm${topicId}`);

  if (contentElement && editForm) {
    contentElement.style.display = 'none';
    editForm.classList.add('show');
  }
}

function cancelEditTopic(topicId) {
  const contentElement = document.getElementById(`topicContent${topicId}`);
  const editForm = document.getElementById(`editForm${topicId}`);

  if (contentElement && editForm) {
    contentElement.style.display = 'block';
    editForm.classList.remove('show');
  }
}

async function saveEditTopic(topicId) {
  const editForm = document.getElementById(`editForm${topicId}`);
  const input = editForm?.querySelector('input');
  const newTitle = input?.value.trim();
  const contentElement = document.getElementById(`topicContent${topicId}`);

  if (!newTitle || newTitle === contentElement?.querySelector('.topic-title').textContent) {
    cancelEditTopic(topicId);
    return;
  }

  const censoredTitle = censorText(newTitle);
  const topicIndex = allTopics.findIndex(t => t.id === topicId);
  if (topicIndex !== -1) {
    allTopics[topicIndex] = {
      ...allTopics[topicIndex],
      title: censoredTitle,
      edited: true,
      editedAt: new Date().toISOString()
    };
    saveTopics();
    filterTopics();
  }
}

function showDeleteTopicModal(topicId) {
  topicToDelete = topicId;
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  deleteModal.show();
}

async function deleteTopic() {
  if (topicToDelete) {
    allTopics = allTopics.filter(t => t.id !== topicToDelete);
    saveTopics();
    filterTopics();
    topicToDelete = null;
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    deleteModal.hide();
  }
}

function showForumSection(topicId) {
  console.log('showForumSection called with topicId:', topicId);

  // Ховаємо всі секції з класом block_all_h
  document.querySelectorAll('.block_all_h').forEach(section => {
    section.classList.add('hidden_all_h');
    section.style.display = 'none';
  });

  // Вмикаємо forum-container
  const forumContainer = document.getElementById('forum-container');
  if (forumContainer) {
    forumContainer.classList.remove('hidden_all_h');
    forumContainer.style.display = 'block';
  } else {
    console.error('forum-container not found');
  }

  // Зберігаємо поточну тему і завантажуємо повідомлення
  currentTopicId = topicId;
  loadMessages();

  // Прокручуємо сторінку наверх
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Оновлюємо AOS анімації
  setTimeout(() => AOS.refresh(), 50);
}
async function loadMessages() {
  try {
    console.log('loadMessages called for topicId:', currentTopicId);
    const storedMessages = localStorage.getItem('messages');
    if (storedMessages) {
      messages = JSON.parse(storedMessages).messages || [];
    } else {
      const response = await fetch('base_date/messages.json');
      messages = (await response.json()).messages || [];
      saveMessages();
    }
    messages = messages.filter(msg => msg.topicId === currentTopicId);
    console.log('Filtered messages:', messages);
    const topic = allTopics.find(t => t.id === currentTopicId);
    document.getElementById('topicTitle').textContent = topic ? topic.title : 'Тема форуму';
    displayMessages();
    checkAuth();
  } catch (error) {
    console.error('Помилка при завантаженні повідомлень:', error);
  }
}
async function addMessage() {
  console.log('addMessage called');
  console.log('currentUser:', currentUser);
  console.log('currentTopicId:', currentTopicId);
  console.log('messageInput:', document.getElementById('messageInput'));

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
  saveMessages();
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

  saveMessages();
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
/*
function toggleBlocks(section) {
  document.querySelectorAll('.block_all_h').forEach(block => {
    block.classList.add('hidden_all_h');
  });
  document.getElementById(section).classList.remove('hidden_all_h');
  
  if (section === 'topics_container_func') {
    const messageList = document.getElementById('messageList');
    if (messageList) {
      messageList.innerHTML = '';
    }
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
*/
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
  saveMessages();
  textarea.value = '';
  replyForm.classList.remove('show');
  displayMessages();
}

function displayMessages() {
  console.log('displayMessages called, currentTopicId:', currentTopicId);
  const messageList = document.getElementById('messageList');
  if (!messageList) {
    console.error('messageList element not found in forum-container');
    return;
  }

  console.log('messageList found, clearing content');
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
              <button class="btn btn-sm btn-outline-primary block_up_little_lit" onclick="showEditMessageForm(${message.id})">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger block_up_little_lit" onclick="showDeleteMessageModal(${message.id})">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="message-content" id="messageContent${message.id}">${message.text}</div>
      <div class="edit-form" id="editMessageForm${message.id}">
        <textarea class="form-control mb-2" rows="3">${message.text}</textarea>
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm block_up_little_lit" onclick="saveEditMessage(${message.id})">Зберегти</button>
          <button class="btn btn-secondary btn-sm block_up_little_lit" onclick="cancelEditMessage(${message.id})">Скасувати</button>
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
  const authMessage = document.getElementById('forumAuthMessage');
  if (authMessage) {
    authMessage.textContent = message;
    authMessage.classList.remove('d-none');
    setTimeout(() => authMessage.classList.add('d-none'), 3000);
  }
}

function showEditMessageForm(messageId) {
  const contentElement = document.getElementById(`messageContent${messageId}`);
  const editForm = document.getElementById(`editMessageForm${messageId}`);

  if (contentElement && editForm) {
    contentElement.style.display = 'none';
    editForm.classList.add('show');
  }
}

function cancelEditMessage(messageId) {
  const contentElement = document.getElementById(`messageContent${messageId}`);
  const editForm = document.getElementById(`editMessageForm${messageId}`);

  if (contentElement && editForm) {
    contentElement.style.display = 'block';
    editForm.classList.remove('show');
  }
}

async function saveEditMessage(messageId) {
  const editForm = document.getElementById(`editMessageForm${messageId}`);
  const textarea = editForm?.querySelector('textarea');
  const newText = textarea?.value.trim();
  const contentElement = document.getElementById(`messageContent${messageId}`);

  if (!newText || newText === contentElement?.textContent) {
    cancelEditMessage(messageId);
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
    saveMessages();
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
    saveMessages();
    displayMessages();
    messageToDelete = null;
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteMessageModal'));
    deleteModal.hide();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('topics.js loaded');
  checkAuth();
  loadTopics();

  const confirmDeleteTopicBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteTopicBtn) {
    confirmDeleteTopicBtn.addEventListener('click', deleteTopic);
  }

  const confirmDeleteMessageBtn = document.getElementById('confirmDeleteMessageBtn');
  if (confirmDeleteMessageBtn) {
    confirmDeleteMessageBtn.addEventListener('click', deleteMessage);
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

