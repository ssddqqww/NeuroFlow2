 let currentUser = null;
    let currentTopicId = null;
    let messages = [];
    let expandedReplies = new Set();
    let messageToDelete = null; // Змінна для зберігання ID повідомлення, яке потрібно видалити

  function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split('=').map(c => c.trim());
      if (cookieName === name) {
        return cookieValue;
      }
    }
    return null;
  }

  function getTopicIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('topicId');
  }

  async function loadTopicDetails() {
    try {
      const topicId = getTopicIdFromUrl();
      if (!topicId) {
        window.location.href = 'topics.html';
        return;
      }
      currentTopicId = topicId;

      const response = await fetch('../base_date/topics.json');
      const data = await response.json();

      const topic = data.topics.find(t => t.id === parseInt(topicId) || t.id === Number(topicId));

      if (!topic) {
        console.error('Тему не знайдено');
        window.location.href = 'topics.html';
        return;
      }

      document.getElementById('topicTitle').textContent = topic.title;
      document.title = `${topic.title} - Форум`;
    } catch (error) {
      console.error('Помилка при завантаженні деталей теми:', error);
    }
  }

  async function loadMessages() {
    try {
      const topicId = getTopicIdFromUrl();
      if (!topicId) return;

      const response = await fetch(`http://localhost:3000/api/topics/${topicId}/messages`);
      const data = await response.json();
      messages = data;
      displayMessages();
    } catch (error) {
      console.error('Помилка при завантаженні повідомлень:', error);
    }
  }

  function checkAuth() {
    console.log('Перевірка авторизації...');
    console.log('Всі куки:', document.cookie);

    const userEmail = getCookie('userEmail');
    const userName = getCookie('userName');

    console.log('userEmail:', userEmail);
    console.log('userName:', userName);

    const messageInput = document.getElementById('messageInput');
    const authMessage = document.getElementById('authMessage');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (userEmail && userName) {
      console.log('Користувач авторизований');
      currentUser = {
        email: decodeURIComponent(userEmail).replace(/%40/g, '@'),
        name: decodeURIComponent(userName)
      };

      if (messageInput) messageInput.classList.remove('d-none');
      if (authMessage) authMessage.classList.add('d-none');
      if (loginBtn) loginBtn.classList.add('d-none');
      if (logoutBtn) logoutBtn.classList.remove('d-none');
    } else {
      console.log('Користувач не авторизований');
      currentUser = null;

      if (messageInput) messageInput.classList.add('d-none');
      if (authMessage) authMessage.classList.remove('d-none');
      if (loginBtn) loginBtn.classList.remove('d-none');
      if (logoutBtn) logoutBtn.classList.add('d-none');
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM завантажено');
    checkAuth();
  });

  window.onload = async function() {
    console.log('Вікно завантажено');
    checkAuth();
    await loadTopicDetails();
    await loadMessages();
  };

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

  async function addMessage() {
    if (!currentUser || !currentTopicId) return;

    const messageText = document.getElementById('messageText').value;
    if (!messageText.trim()) return;

    // Застосовуємо цензуру до тексту повідомлення
    const censoredText = censorText(messageText);

    try {
      const response = await fetch(`http://localhost:3000/api/topics/${currentTopicId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: censoredText,
          author: currentUser.name,
          authorEmail: currentUser.email
        })
      });

      if (response.ok) {
        document.getElementById('messageText').value = '';
        await loadMessages();
      } else {
        console.error('Помилка при додаванні повідомлення');
      }
    } catch (error) {
      console.error('Помилка при відправці повідомлення:', error);
    }
  }

  async function handleReaction(messageId, reactionType) {
    if (!currentUser) {
      showAuthMessage('Будь ласка, увійдіть в систему, щоб додавати реакції');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/messages/${messageId}/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: reactionType,
          userEmail: currentUser.email
        })
      });

      if (response.ok) {
        await loadMessages();
      } else {
        console.error('Помилка при додаванні реакції');
      }
    } catch (error) {
      console.error('Помилка при обробці реакції:', error);
    }
  }

  function showReplyForm(messageId) {
    if (!currentUser) {
      showAuthMessage('Будь ласка, увійдіть щоб відповісти');
      return;
    }

    const replyForm = document.getElementById(`replyForm${messageId}`);
    if (replyForm) {
      replyForm.classList.toggle('show');
    }
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
    const textarea = replyForm.querySelector('textarea');
    const messageText = textarea.value.trim();

    if (!messageText) return;

    // Застосовуємо цензуру до тексту відповіді
    const censoredText = censorText(messageText);

    try {
      const response = await fetch(`http://localhost:3000/api/topics/${currentTopicId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: censoredText,
          author: currentUser.name,
          authorEmail: currentUser.email,
          parentId: parentId,
          topicId: currentTopicId
        })
      });

      if (response.ok) {
        textarea.value = '';
        replyForm.classList.remove('show');
        await loadMessages();

        // Відновлюємо стан розгорнутості після оновлення повідомлень
        expandedReplies.forEach(messageId => {
          const repliesContainer = document.getElementById(`replies${messageId}`);
          const toggleButton = document.querySelector(`[data-toggle-replies="${messageId}"]`);
          if (repliesContainer && toggleButton) {
            repliesContainer.classList.add('expanded');
            toggleButton.classList.add('expanded');
          }
        });
      } else {
        console.error('Помилка при додаванні відповіді');
      }
    } catch (error) {
      console.error('Помилка при відправці відповіді:', error);
    }
  }

  document.getElementById('messageText').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addMessage();
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    currentUser = null;
    checkAuth();
    window.location.href = '../Login/login.html';
  });

  function displayMessages() {
    const messageList = document.querySelector('.message-list');
    messageList.innerHTML = '';

    // Створюємо об'єкт для зберігання відповідей
    const repliesByParentId = {};

    // Групуємо відповіді за parentId
    messages.forEach(message => {
      if (message.parentId) {
        if (!repliesByParentId[message.parentId]) {
          repliesByParentId[message.parentId] = [];
        }
        repliesByParentId[message.parentId].push(message);
      }
    });

    // Функція для відображення повідомлення та його відповідей
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

      // Застосовуємо цензуру до тексту повідомлення
      const censoredText = censorText(message.text);

      messageElement.innerHTML = `
        <div class="message-header">
          <div class="message-author">
            <img src="${message.authorPicture || '../assets/img/default-avatar.png'}" alt="${message.author}">
            <span>${message.author}</span>
          </div>
          <div class="message-meta">
            <div class="message-time">${new Date(message.timestamp).toLocaleString()}</div>
            ${message.edited ? `<div class="message-edited">(відредаговано ${new Date(message.editedAt).toLocaleString()})</div>` : ''}
            ${message.authorEmail === currentUser?.email ? `
              <div class="message-actions-edit">
                <button class="btn btn-sm btn-outline-primary" onclick="showEditForm(${message.id})">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteMessage(${message.id})">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="message-content" id="messageContent${message.id}">${censoredText}</div>
        <div class="edit-form" id="editForm${message.id}">
          <textarea class="form-control mb-2" rows="3">${censoredText}</textarea>
          <div class="d-flex gap-2">
            <button class="btn btn-primary btn-sm" onclick="saveEdit(${message.id})">Зберегти</button>
            <button class="btn btn-secondary btn-sm" onclick="cancelEdit(${message.id})">Скасувати</button>
          </div>
        </div>
        <div class="message-actions">
          <div class="reactions-container">
            <button class="reaction-button ${userHasLiked ? 'active' : ''}" onclick="handleReaction(${message.id}, 'like')">
              👍 <span class="reaction-count">${likes}</span>
            </button>
            <button class="reaction-button ${userHasDisliked ? 'active' : ''}" onclick="handleReaction(${message.id}, 'dislike')">
              👎 <span class="reaction-count">${dislikes}</span>
            </button>
            <button class="reaction-button ${userHasLoved ? 'active' : ''}" onclick="handleReaction(${message.id}, 'love')">
              ❤️ <span class="reaction-count">${loves}</span>
            </button>
            <button class="reaction-button ${userHasLaughed ? 'active' : ''}" onclick="handleReaction(${message.id}, 'laugh')">
              😂 <span class="reaction-count">${laughs}</span>
            </button>
            <button class="reaction-button ${userHasWowed ? 'active' : ''}" onclick="handleReaction(${message.id}, 'wow')">
              😮 <span class="reaction-count">${wows}</span>
            </button>
          </div>
          <button class="reply-button" onclick="showReplyForm(${message.id})">
            Відповісти
          </button>
        </div>
        <div id="replyForm${message.id}" class="reply-form">
          <textarea class="form-control mb-2" rows="2" placeholder="Напишіть вашу відповідь..."></textarea>
          <button class="btn btn-primary btn-sm" onclick="submitReply(${message.id})">Відправити</button>
        </div>
        ${replies.length > 0 ? `
          <div class="replies-toggle ${isExpanded ? 'expanded' : ''}" data-toggle-replies="${message.id}" onclick="toggleReplies(${message.id})">
            <i class="bi bi-chevron-down"></i>
            <span>Відповіді</span>
            <span class="replies-count">${replies.length}</span>
          </div>
          <div id="replies${message.id}" class="replies ${isExpanded ? 'expanded' : ''}">
            ${replies.map(reply => {
              const replyElement = document.createElement('div');
              replyElement.innerHTML = displayMessage(reply, level + 1);
              return replyElement.innerHTML;
            }).join('')}
          </div>
        ` : ''}
      `;

      return messageElement.outerHTML;
    }

    // Відображаємо тільки батьківські повідомлення
    messages
      .filter(message => !message.parentId)
      .forEach(message => {
        messageList.innerHTML += displayMessage(message);
      });
  }

  function showAuthMessage(message) {
    const authMessage = document.getElementById('authMessage');
    authMessage.textContent = message;
    authMessage.classList.remove('d-none');
    setTimeout(() => {
      authMessage.classList.add('d-none');
    }, 3000);
  }

  async function showEditForm(messageId) {
    const contentElement = document.getElementById(`messageContent${messageId}`);
    const editForm = document.getElementById(`editForm${messageId}`);

    if (contentElement && editForm) {
      contentElement.style.display = 'none';
      editForm.classList.add('show');
    }
  }

  async function cancelEdit(messageId) {
    const contentElement = document.getElementById(`messageContent${messageId}`);
    const editForm = document.getElementById(`editForm${messageId}`);

    if (contentElement && editForm) {
      contentElement.style.display = 'block';
      editForm.classList.remove('show');
    }
  }

  async function saveEdit(messageId) {
    const editForm = document.getElementById(`editForm${messageId}`);
    const textarea = editForm.querySelector('textarea');
    const newText = textarea.value.trim();
    const contentElement = document.getElementById(`messageContent${messageId}`);

    if (!newText || newText === contentElement.textContent) {
      cancelEdit(messageId);
      return;
    }

    // Застосовуємо цензуру до тексту повідомлення
    const censoredText = censorText(newText);

    try {
      const response = await fetch(`http://localhost:3000/api/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: censoredText,
          userEmail: currentUser.email
        })
      });

      if (response.ok) {
        await loadMessages();
      } else {
        const error = await response.json();
        alert(error.error || 'Помилка при редагуванні повідомлення');
      }
    } catch (error) {
      console.error('Помилка при редагуванні повідомлення:', error);
      alert('Помилка при редагуванні повідомлення');
    }
  }

   function showDeleteMessageModal(messageId) {
      messageToDelete = messageId;
      const deleteModal = new bootstrap.Modal(document.getElementById('deleteMessageModal'));
      deleteModal.show();
    }

    document.getElementById('confirmDeleteMessageBtn').addEventListener('click', async function() {
      if (messageToDelete) {
        try {
          const response = await fetch(`http://localhost:3000/api/messages/${messageToDelete}?userEmail=${encodeURIComponent(currentUser.email)}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            await loadMessages();
          } else {
            const error = await response.json();
            console.error('Помилка при видаленні повідомлення:', error.error);
          }
        } catch (error) {
          console.error('Помилка при видаленні повідомлення:', error);
        } finally {
          messageToDelete = null;
          const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteMessageModal'));
          deleteModal.hide();
        }
      }
    });

    async function deleteMessage(messageId) {
      showDeleteMessageModal(messageId);
    }