let activeUser = null;
let topicToDelete = null;
let messageToDelete = null;
let allTopics = [];
let messages = [];
let expandedReplies = new Set();
let currentTopicId = null;
const API_BASE_URL = '';

function aosInit() {
  AOS.init({
    duration: 600,
    easing: 'ease-in-out',
    once: false,
    mirror: false
  });
}

function showSection(sectionId) {
  console.log('showSection: Showing section', sectionId);
  const sections = [
    'features',
    'features-cards',
    'services',
    'clients',
    'faq',
    'stats',
    'about',
    'features_one',
    'features_cards_two',
    'call-to-action',
    'topics-container',
    'forum-container',
    'top-messages-container',
    'news'
  ];

  const navLinks = [
    'home_func',
    'about_func',
    'features_func',
    'top_func',
    'topics_container_func',
    'news_func',
    'download_func'
  ];

  const homeSections = ['features', 'features-cards', 'services', 'clients', 'faq', 'stats'];

  // Hide all sections
  sections.forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      section.classList.add('hidden_all_h');
    }
  });

  // Remove active class from all nav links
  navLinks.forEach(id => {
    const link = document.getElementById(id);
    if (link) {
      link.classList.remove('active');
    }
  });

  // Show selected section(s)
  if (sectionId === 'home_func') {
    homeSections.forEach(id => {
      const section = document.getElementById(id);
      if (section) {
        section.classList.remove('hidden_all_h');
      }
    });
    document.getElementById('home_func')?.classList.add('active');
  } else if (sectionId === 'features_func') {
    ['features_one', 'features_cards_two'].forEach(id => {
      const section = document.getElementById(id);
      if (section) {
        section.classList.remove('hidden_all_h');
      }
    });
    document.getElementById('features_func')?.classList.add('active');
  } else {
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.remove('hidden_all_h');
      document.getElementById(sectionId)?.classList.add('active');
    }
  }

  // Clear message list if returning to topics
  if (sectionId === 'topics_container_func') {
    const messageList = document.getElementById('messageList');
    if (messageList) {
      messageList.innerHTML = '';
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => AOS.refresh(), 50);
}

function showForumSection(topicId) {
  console.log('showForumSection: Showing forum for topic', topicId);
  currentTopicId = topicId;
  showSection('forum-container');
  loadMessages();
}

function toggleForumBlocks(sectionId) {
  console.log('toggleForumBlocks: Switching to', sectionId);
  showSection(sectionId);
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
    activeUser = {
      email: decodeURIComponent(userEmail).replace(/%40/g, '@'),
      name: decodeURIComponent(userName)
    };
    document.getElementById('createTopicSection')?.classList.remove('hidden');
    document.getElementById('authMessage')?.classList.add('hidden');
    document.getElementById('messageInput')?.classList.remove('d-none');
    document.getElementById('forumAuthMessage')?.classList.add('d-none');
  } else {
    activeUser = null;
  }
}

async function loadTopics() {
  console.log('loadTopics: Starting to load topics');
  try {
    const url = `${API_BASE_URL}/api/topics`;
    console.log('loadTopics: Fetching', url);
    const response = await fetch(url, { credentials: 'include' });
    console.log('loadTopics: Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.log('loadTopics: Response body:', text);
      throw new Error(`Помилка завантаження тем: ${response.status}`);
    }
    allTopics = await response.json() || [];
    console.log('loadTopics: Topics loaded:', allTopics);
    const messageList = document.getElementById('messageList');
    if (messageList) {
      messageList.innerHTML = '';
      console.log('loadTopics: Cleared messageList');
    }
    filterTopics();
  } catch (error) {
    console.error('loadTopics: Помилка при завантаженні тем:', error);
    showAuthMessage('Не вдалося завантажити теми. Спробуйте ще раз.');
  }
}

function filterTopics() {
  console.log('filterTopics: Starting to filter topics');
  const searchText = document.getElementById('searchInput')?.value.toLowerCase() || '';
  console.log('filterTopics: Search text:', searchText);
  const filteredTopics = allTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchText)
  );
  console.log('filterTopics: Filtered topics:', filteredTopics);

  const topicList = document.getElementById('topicList');
  if (!topicList) {
    console.log('filterTopics: topicList element not found');
    return;
  }

  topicList.innerHTML = '';
  console.log('filterTopics: Cleared topicList');

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
        ${topic.authorEmail === activeUser?.email ? `
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
  console.log('filterTopics: Topics rendered');

  const messageList = document.getElementById('messageList');
  if (messageList) {
    messageList.innerHTML = '';
    console.log('filterTopics: Cleared messageList');
  }
}

function showCreateTopicForm() {
  console.log('showCreateTopicForm: Starting');
  if (!activeUser) {
    console.log('showCreateTopicForm: User not authenticated');
    showAuthMessage('Будь ласка, увійдіть в систему');
    return;
  }
  const topicForm = document.getElementById('topicForm');
  if (topicForm) {
    topicForm.classList.remove('hidden');
    console.log('showCreateTopicForm: Topic form shown');
  } else {
    console.log('showCreateTopicForm: topicForm element not found');
  }
}

async function createTopic() {
  console.log('createTopic: Starting to create topic');
  if (!activeUser) {
    console.log('createTopic: User not authenticated');
    showAuthMessage('Будь ласка, увійдіть в систему');
    return;
  }

  const titleInput = document.getElementById('topicTitle');
  const title = titleInput?.value.trim();
  if (!title) {
    console.log('createTopic: Title is empty');
    showAuthMessage('Введіть назву теми');
    return;
  }
  console.log('createTopic: Title:', title);

  const censoredTitle = censorText(title);
  console.log('createTopic: Censored title:', censoredTitle);
  try {
    const url = `${API_BASE_URL}/api/topics`;
    console.log('createTopic: Fetching', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: censoredTitle,
        author: activeUser.name,
        authorEmail: activeUser.email
      })
    });
    console.log('createTopic: Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.log('createTopic: Response body:', text);
      throw new Error(`Помилка створення теми: ${response.status}`);
    }
    const newTopic = await response.json();
    console.log('createTopic: New topic created:', newTopic);
    allTopics.push(newTopic);
    titleInput.value = '';
    document.getElementById('topicForm')?.classList.add('hidden');
    console.log('createTopic: Topic form hidden');
    filterTopics();
  } catch (error) {
    console.error('createTopic: Помилка при створенні теми:', error);
    showAuthMessage('Не вдалося створити тему. Спробуйте ще раз.');
  }
}

function showEditTopicForm(topicId) {
  console.log('showEditTopicForm: Starting, topicId:', topicId);
  if (!activeUser) {
    console.log('showEditTopicForm: User not authenticated');
    showAuthMessage('Будь ласка, увійдіть в систему');
    return;
  }
  const contentElement = document.getElementById(`topicContent${topicId}`);
  const editForm = document.getElementById(`editForm${topicId}`);

  if (contentElement && editForm) {
    contentElement.style.display = 'none';
    editForm.classList.add('show');
    console.log('showEditTopicForm: Edit form shown for topic', topicId);
  } else {
    console.log('showEditTopicForm: Elements not found for topic', topicId);
  }
}

function cancelEditTopic(topicId) {
  console.log('cancelEditTopic: Starting, topicId:', topicId);
  const contentElement = document.getElementById(`topicContent${topicId}`);
  const editForm = document.getElementById(`editForm${topicId}`);

  if (contentElement && editForm) {
    contentElement.style.display = 'block';
    editForm.classList.remove('show');
    console.log('cancelEditTopic: Edit form hidden for topic', topicId);
  } else {
    console.log('cancelEditTopic: Elements not found for topic', topicId);
  }
}

async function saveEditTopic(topicId) {
  console.log('saveEditTopic: Starting, topicId:', topicId);
  if (!activeUser) {
    console.log('saveEditTopic: User not authenticated');
    showAuthMessage('Будь ласка, увійдіть в систему');
    return;
  }

  const editForm = document.getElementById(`editForm${topicId}`);
  const input = editForm?.querySelector('input');
  const newTitle = input?.value.trim();
  const contentElement = document.getElementById(`topicContent${topicId}`);

  if (!newTitle || newTitle === contentElement?.querySelector('.topic-title').textContent) {
    console.log('saveEditTopic: No changes or empty title');
    cancelEditTopic(topicId);
    return;
  }
  console.log('saveEditTopic: New title:', newTitle);

  const censoredTitle = censorText(newTitle);
  console.log('saveEditTopic: Censored title:', censoredTitle);
  try {
    const url = `${API_BASE_URL}/api/topics/${topicId}`;
    console.log('saveEditTopic: Fetching', url);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: censoredTitle,
        userEmail: activeUser.email
      })
    });
    console.log('saveEditTopic: Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.log('saveEditTopic: Response body:', text);
      throw new Error(`Помилка редагування теми: ${response.status}`);
    }
    const updatedTopic = await response.json();
    console.log('saveEditTopic: Updated topic:', updatedTopic);
    const topicIndex = allTopics.findIndex(t => t.id === topicId);
    if (topicIndex !== -1) {
      allTopics[topicIndex] = updatedTopic;
      filterTopics();
      console.log('saveEditTopic: Topic updated and filtered');
    }
  } catch (error) {
    console.error('saveEditTopic: Помилка при редагуванні теми:', error);
    showAuthMessage('Не вдалося відредагувати тему. Спробуйте ще раз.');
  }
}

function showDeleteTopicModal(topicId) {
  console.log('showDeleteTopicModal: Starting, topicId:', topicId);
  if (!activeUser) {
    console.log('showDeleteTopicModal: User not authenticated');
    showAuthMessage('Будь ласка, увійдіть в систему');
    return;
  }
  topicToDelete = topicId;
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  deleteModal.show();
  console.log('showDeleteTopicModal: Delete modal shown for topic', topicId);
}

async function deleteTopic() {
  console.log('deleteTopic: Starting, topicId:', topicToDelete);
  if (!topicToDelete || !activeUser) {
    console.log('deleteTopic: Invalid topic or user not authenticated');
    showAuthMessage('Будь ласка, увійдіть в систему');
    return;
  }

  try {
    const url = `${API_BASE_URL}/api/topics/${topicToDelete}?userEmail=${encodeURIComponent(activeUser.email)}`;
    console.log('deleteTopic: Fetching', url);
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include'
    });
    console.log('deleteTopic: Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.log('deleteTopic: Response body:', text);
      throw new Error(`Помилка видалення теми: ${response.status}`);
    }
    allTopics = allTopics.filter(t => t.id !== topicToDelete);
    console.log('deleteTopic: Topic removed from allTopics');
    filterTopics();
    topicToDelete = null;
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    deleteModal.hide();
    console.log('deleteTopic: Delete modal hidden');
  } catch (error) {
    console.error('deleteTopic: Помилка при видаленні теми:', error);
    showAuthMessage('Не вдалося видалити тему. Спробуйте ще раз.');
  }
}

async function loadMessages() {
  console.log('loadMessages: Starting, topicId:', currentTopicId);
  try {
    const url = `${API_BASE_URL}/api/topics/${currentTopicId}/messages`;
    console.log('loadMessages: Fetching', url);
    const response = await fetch(url, { credentials: 'include' });
    console.log('loadMessages: Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.log('loadMessages: Response body:', text);
      throw new Error(`Помилка завантаження повідомлень: ${response.status}`);
    }
    messages = await response.json() || [];
    console.log('loadMessages: Messages loaded:', messages);
    const topic = allTopics.find(t => t.id === currentTopicId);
    document.getElementById('topicTitle').textContent = topic ? topic.title : 'Тема форуму';
    console.log('loadMessages: Topic title set:', topic?.title);
    displayMessages();
  } catch (error) {
    console.error('loadMessages: Помилка при завантаженні повідомлень:', error);
    showAuthMessage('Не вдалося завантажити повідомлення. Спробуйте ще раз.');
  }
}

async function addMessage() {
  console.log('addMessage: Starting, topicId:', currentTopicId);
  if (!activeUser || !currentTopicId) {
    console.log('addMessage: User not authenticated or no topicId');
    showAuthMessage('Будь ласка, увійдіть в систему');
    return;
  }

  const messageText = document.getElementById('messageText')?.value.trim();
  if (!messageText) {
    console.log('addMessage: Message text is empty');
    showAuthMessage('Введіть текст повідомлення');
    return;
  }
  console.log('addMessage: Message text:', messageText);

  const censoredText = censorText(messageText);
  console.log('addMessage: Censored text:', censoredText);
  try {
    const url = `${API_BASE_URL}/api/topics/${currentTopicId}/messages`;
    console.log('addMessage: Fetching', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        text: censoredText,
        author: activeUser.name,
        authorEmail: activeUser.email,
        authorPicture: activeUser.picture || 'assets/img/default-avatar.png',
        parentId: null
      })
    });
    console.log('addMessage: Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.log('addMessage: Response body:', text);
      throw new Error(`Помилка додавання повідомлення: ${response.status}`);
    }
    const newMessage = await response.json();
    console.log('addMessage: New message added:', newMessage);
    messages.push(newMessage);
    document.getElementById('messageText').value = '';
    console.log('addMessage: Message input cleared');
    displayMessages();
  } catch (error) {
    console.error('addMessage: Помилка при додаванні повідомлення:', error);
    showAuthMessage('Не вдалося додати повідомлення. Спробуйте ще раз.');
  }
}

async function handleReaction(messageId, reactionType) {
  console.log('handleReaction: Starting, messageId:', messageId, 'reactionType:', reactionType);
  if (!activeUser) {
    console.log('handleReaction: User not authenticated');
    showAuthMessage('Будь ласка, увійдіть в систему, щоб додавати реакції');
    return;
  }

  try {
    const url = `${API_BASE_URL}/api/messages/${messageId}/reaction`;
    console.log('handleReaction: Fetching', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        type: reactionType,
        userEmail: activeUser.email
      })
    });
    console.log('handleReaction: Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.log('handleReaction: Response body:', text);
      throw new Error(`Помилка обробки реакції: ${response.status}`);
    }
    console.log('handleReaction: Reaction processed');
    await loadMessages();
  } catch (error) {
    console.error('handleReaction: Помилка при обробці реакції:', error);
    showAuthMessage('Не вдалося додати реакцію. Спробуйте ще раз.');
  }
}

function showReplyForm(messageId) {
  console.log('showReplyForm: Starting, messageId:', messageId);
  if (!activeUser) {
    console.log('showReplyForm: User not authenticated');
    showAuthMessage('Будь ласка, увійдіть щоб відповісти');
    return;
  }

  const replyForm = document.getElementById(`replyForm${messageId}`);
  if (replyForm) {
    replyForm.classList.toggle('show');
    console.log('showReplyForm: Reply form toggled for message', messageId);
  } else {
    console.log('showReplyForm: replyForm element not found for message', messageId);
  }
}

function toggleReplies(messageId) {
  console.log('toggleReplies: Starting, messageId:', messageId);
  const repliesContainer = document.getElementById(`replies${messageId}`);
  const toggleButton = document.querySelector(`[data-toggle-replies="${messageId}"]`);

  if (repliesContainer && toggleButton) {
    repliesContainer.classList.toggle('expanded');
    toggleButton.classList.toggle('expanded');

    if (repliesContainer.classList.contains('expanded')) {
      expandedReplies.add(messageId);
      console.log('toggleReplies: Replies expanded for message', messageId);
    } else {
      expandedReplies.delete(messageId);
      console.log('toggleReplies: Replies collapsed for message', messageId);
    }
  } else {
    console.log('toggleReplies: Elements not found for message', messageId);
  }
}

async function submitReply(parentId) {
  console.log('submitReply: Starting, parentId:', parentId);
  if (!activeUser || !currentTopicId) {
    console.log('submitReply: User not authenticated or no topicId');
    showAuthMessage('Будь ласка, увійдіть в систему');
    return;
  }

  const replyForm = document.getElementById(`replyForm${parentId}`);
  const textarea = replyForm?.querySelector('textarea');
  const messageText = textarea?.value.trim();

  if (!messageText) {
    console.log('submitReply: Reply text is empty');
    showAuthMessage('Введіть текст відповіді');
    return;
  }
  console.log('submitReply: Reply text:', messageText);

  const censoredText = censorText(messageText);
  console.log('submitReply: Censored text:', censoredText);
  try {
    const url = `${API_BASE_URL}/api/topics/${currentTopicId}/messages`;
    console.log('submitReply: Fetching', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        text: censoredText,
        author: activeUser.name,
        authorEmail: activeUser.email,
        authorPicture: activeUser.picture || 'assets/img/default-avatar.png',
        parentId: parentId
      })
    });
    console.log('submitReply: Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.log('submitReply: Response body:', text);
      throw new Error(`Помилка додавання відповіді: ${response.status}`);
    }
    const newReply = await response.json();
    console.log('submitReply: New reply added:', newReply);
    messages.push(newReply);
    textarea.value = '';
    replyForm.classList.remove('show');
    console.log('submitReply: Reply form cleared and hidden');
    displayMessages();
  } catch (error) {
    console.error('submitReply: Помилка при додаванні відповіді:', error);
    showAuthMessage('Не вдалося додати відповідь. Спробуйте ще раз.');
  }
}

function displayMessages() {
  console.log('displayMessages: Starting');
  const messageList = document.getElementById('messageList');
  if (!messageList) {
    console.error('displayMessages: messageList element not found in forum-container');
    return;
  }

  messageList.innerHTML = '';
  console.log('displayMessages: Cleared messageList');

  const repliesByParentId = {};
  messages.forEach(message => {
    if (message.parentId) {
      if (!repliesByParentId[message.parentId]) repliesByParentId[message.parentId] = [];
      repliesByParentId[message.parentId].push(message);
    }
  });
  console.log('displayMessages: Replies grouped by parentId:', repliesByParentId);

  function displayMessage(message, level = 0) {
    console.log('displayMessage: Rendering message, id:', message.id, 'level:', level);
    const messageElement = document.createElement('div');
    messageElement.className = 'message-item';
    messageElement.dataset.messageId = message.id;
    messageElement.style.marginLeft = `${level * 40}px`;

    const likes = message.likes?.length || 0;
    const dislikes = message.dislikes?.length || 0;
    const loves = message.love?.length || 0;
    const laughs = message.laugh?.length || 0;
    const wows = message.wow?.length || 0;

    const userHasLiked = message.likes?.includes(activeUser?.email);
    const userHasDisliked = message.dislikes?.includes(activeUser?.email);
    const userHasLoved = message.love?.includes(activeUser?.email);
    const userHasLaughed = message.laugh?.includes(activeUser?.email);
    const userHasWowed = message.wow?.includes(activeUser?.email);

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
          ${message.authorEmail === activeUser?.email ? `
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
  console.log('displayMessages: Messages rendered');
}

function showAuthMessage(message) {
  console.log('showAuthMessage: Showing message:', message);
  const authMessage = document.getElementById('forumAuthMessage');
  if (authMessage) {
    authMessage.textContent = message;
    authMessage.classList.remove('d-none');
    setTimeout(() => {
      authMessage.classList.add('d-none');
      console.log('showAuthMessage: Message hidden');
    }, 3000);
  } else {
    console.log('showAuthMessage: forumAuthMessage element not found');
  }
}

function showEditMessageForm(messageId) {
  console.log('showEditMessageForm: Starting, messageId:', messageId);
  if (!activeUser) {
    console.log('showEditMessageForm: User not authenticated');
    showAuthMessage('Будь ласка, увійдіть в систему');
    return;
  }
  const contentElement = document.getElementById(`messageContent${messageId}`);
  const editForm = document.getElementById(`editMessageForm${messageId}`);

  if (contentElement && editForm) {
    contentElement.style.display = 'none';
    editForm.classList.add('show');
    console.log('showEditMessageForm: Edit form shown for message', messageId);
  } else {
    console.log('showEditMessageForm: Elements not found for message', messageId);
  }
}

function cancelEditMessage(messageId) {
  console.log('cancelEditMessage: Starting, messageId:', messageId);
  const contentElement = document.getElementById(`messageContent${messageId}`);
  const editForm = document.getElementById(`editMessageForm${messageId}`);

  if (contentElement && editForm) {
    contentElement.style.display = 'block';
    editForm.classList.remove('show');
    console.log('cancelEditMessage: Edit form hidden for message', messageId);
  } else {
    console.log('cancelEditMessage: Elements not found for message', messageId);
  }
}

async function saveEditMessage(messageId) {
  console.log('saveEditMessage: Starting, messageId:', messageId);
  if (!activeUser) {
    console.log('saveEditMessage: User not authenticated');
    showAuthMessage('Будь ласка, увійдіть в систему');
    return;
  }

  const editForm = document.getElementById(`editMessageForm${messageId}`);
  const textarea = editForm?.querySelector('textarea');
  const newText = textarea?.value.trim();
  const contentElement = document.getElementById(`messageContent${messageId}`);

  if (!newText || newText === contentElement?.textContent) {
    console.log('saveEditMessage: No changes or empty text');
    cancelEditMessage(messageId);
    return;
  }
  console.log('saveEditMessage: New text:', newText);

  const censoredText = censorText(newText);
  console.log('saveEditMessage: Censored text:', censoredText);
  try {
    const url = `${API_BASE_URL}/api/messages/${messageId}`;
    console.log('saveEditMessage: Fetching', url);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        text: censoredText,
        userEmail: activeUser.email
      })
    });
    console.log('saveEditMessage: Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.log('saveEditMessage: Response body:', text);
      throw new Error(`Помилка редагування повідомлення: ${response.status}`);
    }
    const updatedMessage = await response.json();
    console.log('saveEditMessage: Updated message:', updatedMessage);
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex] = updatedMessage;
      displayMessages();
      console.log('saveEditMessage: Message updated and displayed');
    }
  } catch (error) {
    console.error('saveEditMessage: Помилка при редагуванні повідомлення:', error);
    showAuthMessage('Не вдалося відредагувати повідомлення. Спробуйте ще раз.');
  }
}

function showDeleteMessageModal(messageId) {
  console.log('showDeleteMessageModal: Starting, messageId:', messageId);
  if (!activeUser) {
    console.log('showDeleteMessageModal: User not authenticated');
    showAuthMessage('Будь ласка, увійдіть в систему');
    return;
  }
  messageToDelete = messageId;
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteMessageModal'));
  deleteModal.show();
  console.log('showDeleteMessageModal: Delete modal shown for message', messageId);
}

async function deleteMessage() {
  console.log('deleteMessage: Starting, messageId:', messageToDelete);
  if (!messageToDelete || !activeUser) {
    console.log('deleteMessage: Invalid message or user not authenticated');
    showAuthMessage('Будь ласка, увійдіть в систему');
    return;
  }

  try {
    const url = `${API_BASE_URL}/api/messages/${messageToDelete}?userEmail=${encodeURIComponent(activeUser.email)}`;
    console.log('deleteMessage: Fetching', url);
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include'
    });
    console.log('deleteMessage: Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.log('deleteMessage: Response body:', text);
      throw new Error(`Помилка видалення повідомлення: ${response.status}`);
    }
    messages = messages.filter(m => m.id !== messageToDelete);
    console.log('deleteMessage: Message removed from messages');
    displayMessages();
    messageToDelete = null;
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteMessageModal'));
    deleteModal.hide();
    console.log('deleteMessage: Delete modal hidden');
  } catch (error) {
    console.error('deleteMessage: Помилка при видаленні повідомлення:', error);
    showAuthMessage('Не вдалося видалити повідомлення. Спробуйте ще раз.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded: forum.js loaded');
  checkAuth();
  loadTopics();
  showSection('home_func');

  const confirmDeleteTopicBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteTopicBtn) {
    confirmDeleteTopicBtn.addEventListener('click', deleteTopic);
    console.log('DOMContentLoaded: confirmDeleteTopicBtn listener added');
  }

  const confirmDeleteMessageBtn = document.getElementById('confirmDeleteMessageBtn');
  if (confirmDeleteMessageBtn) {
    confirmDeleteMessageBtn.addEventListener('click', deleteMessage);
    console.log('DOMContentLoaded: confirmDeleteMessageBtn listener added');
  }

  const messageText = document.getElementById('messageText');
  if (messageText) {
    messageText.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addMessage();
      }
    });
    console.log('DOMContentLoaded: messageText keypress listener added');
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
});
