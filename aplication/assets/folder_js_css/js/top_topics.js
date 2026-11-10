let currentUser = null;
let topicMessages = [];
let topics = [];

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(';').shift() : null;
}

function censorText(text) {
  if (!text) return '';

  const badWords = [
    'хуй', 'пиз', 'пізд', 'бля', 'сук', 'їба', 'нах', 'еба', 'під', 'муд', 'дроч', 'сра', 'гов', 'піс', 'зал', 'шлюха', 'єбать',
    'fuck', 'suck', 'dick', 'cock', 'shit', 'ass', 'bitch', 'cunt', 'pussy', 'bastard', 'damn', 'fucker', 'motherfucker',
    'asshole', 'prick', 'twat', 'wank', 'whore', 'slut'
  ];

  const words = text.split(/\s+/);
  return words
    .map(word => {
      if (word.length < 3) return word;

      const cleanWord = word.replace(/[^a-zA-Zа-яА-ЯїЇіІєЄґҐ]/g, '').toLowerCase();
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

      return isSuspicious ? '*'.repeat(word.length) : word;
    })
    .join(' ');
}

function checkAuth() {
  console.log('Перевірка авторизації...');
  console.log('Всі куки:', document.cookie);

  const userEmail = getCookie('userEmail');
  const userName = getCookie('userName');

  console.log('userEmail:', userEmail);
  console.log('userName:', userName);

  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  try {
    if (userEmail && userName) {
      console.log('Користувач авторизований');
      currentUser = {
        email: decodeURIComponent(userEmail).replace(/%40/g, '@'),
        name: decodeURIComponent(userName)
      };
      if (loginBtn) loginBtn.classList.add('hidden_all_h');
      if (logoutBtn) logoutBtn.classList.remove('hidden_all_h');
    } else {
      console.log('Користувач не авторизований');
      currentUser = null;
      if (loginBtn) loginBtn.classList.remove('hidden_all_h');
      if (logoutBtn) logoutBtn.classList.add('hidden_all_h');
    }
  } catch (error) {
    console.error('Помилка при обробці кукісів:', error);
    currentUser = null;
    if (loginBtn) loginBtn.classList.remove('hidden_all_h');
    if (logoutBtn) logoutBtn.classList.add('hidden_all_h');
  }
}

async function loadData() {
  const messageList = document.getElementById('messageList');
  if (!messageList) {
    console.error('Елемент з id "messageList" не знайдено');
    return;
  }

  messageList.innerHTML = '<p>Завантаження даних...</p>';

  try {
    const [topicsResponse, messagesResponse] = await Promise.all([
      fetch('/api/topics', { credentials: 'include', headers: { Accept: 'application/json' } }),
      fetch('/api/messages', { credentials: 'include', headers: { Accept: 'application/json' } })
    ]);

    console.log('Topics Response Status:', topicsResponse.status);
    console.log('Messages Response Status:', messagesResponse.status);

    if (!topicsResponse.ok) {
      const errorText = await topicsResponse.text();
      throw new Error(`Помилка завантаження тем: ${topicsResponse.status} - ${errorText}`);
    }
    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      throw new Error(`Помилка завантаження повідомлень: ${messagesResponse.status} - ${errorText}`);
    }

    topics = (await topicsResponse.json()) || [];
    topicMessages = (await messagesResponse.json()) || [];

    console.log('Завантажені дані:', { topicMessages, topics });
    displayTopicsSortedByMessages();
  } catch (error) {
    console.error('Помилка при завантаженні даних:', error);
    messageList.innerHTML = '<p>Помилка при завантаженні даних. Спробуйте оновити сторінку.</p>';
  }
}

function displayTopicsSortedByMessages() {
  const messageList = document.getElementById('messageList');
  const topMessagesContainer = document.getElementById('top-messages-container');

  if (!messageList) {
    console.error('Елемент з id "messageList" не знайдено');
    return;
  }

  if (topMessagesContainer) {
    topMessagesContainer.classList.remove('hidden_all_h');
    topMessagesContainer.style.display = 'block';
  }

  messageList.innerHTML = '';

  if (topics.length === 0) {
    messageList.innerHTML = '<p>Теми не знайдено. Створіть першу тему!</p>';
    return;
  }

  const topicsWithStats = topics.map(topic => {
    const topicMessagesFiltered = topicMessages.filter(msg => msg.topicId === topic.id);
    const lastMessage = topicMessagesFiltered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    return {
      ...topic,
      messageCount: topicMessagesFiltered.length,
      lastMessageTime: lastMessage ? new Date(lastMessage.timestamp) : null,
      lastMessageAuthor: lastMessage ? lastMessage.author : null
    };
  });

  topicsWithStats.sort((a, b) => b.messageCount - a.messageCount);

  if (topicsWithStats.length === 0 || topicsWithStats.every(topic => topic.messageCount === 0)) {
    messageList.innerHTML = '<p>Ще немає повідомлень у популярних темах.</p>';
    return;
  }

  topicsWithStats.forEach(topic => {
    if (topic.messageCount === 0) return; // Пропускаємо теми без повідомлень
    const topicElement = document.createElement('div');
    topicElement.className = 'topic-item';
    topicElement.onclick = () => (window.location.href = `forum.html?topicId=${topic.id}`);

    const censoredTitle = censorText(topic.title || '');
    topicElement.innerHTML = `
      <div class="topic-content">
        <div class="topic-title">${censoredTitle}</div>
      </div>
      <div class="topic-meta">
        <span><i class="bi bi-person"></i> ${topic.author || 'Невідомий'}</span>
        <span><i class="bi bi-clock"></i> ${new Date(topic.createdAt).toLocaleString()}</span>
        <span class="badge bg-primary">${topic.messageCount} повідомлень</span>
        ${
          topic.lastMessageTime
            ? `<span>Останнє повідомлення: <strong>${topic.lastMessageAuthor || 'Невідомий'}</strong> (${topic.lastMessageTime.toLocaleString()})</span>`
            : '<span>Ще немає повідомлень</span>'
        }
      </div>
    `;

    messageList.appendChild(topicElement);
  });

  if (typeof AOS !== 'undefined') {
    AOS.refresh();
  } else {
    console.warn('Бібліотека AOS не завантажена');
  }
}

window.addEventListener('load', () => {
  if (typeof aosInit === 'function') {
    aosInit();
  } else {
    console.warn('Функція aosInit не визначена');
  }
  checkAuth();
  loadData();
});
