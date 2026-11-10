        // Global variables
        let currentUser = null;
        let currentChat = null;
        let userRatings = {};
        let ws = null;

        const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🎉', '🔥', '👎', '🤔', '🙏', '💪'];

        const API_BASE_URL = '../chat';

        // Function to get cookie
        function getCookie(name) {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(';').shift();
        }

        async function checkUserInLastChat(email) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/users/${email}/last-chat`);
            if (!response.ok) {
              console.log('Server returned error:', response.status);
              return false;
            }
            const data = await response.json();
            console.log('Received data from lastChat.json:', data);
            return data.chatId !== null;
          } catch (error) {
            console.error('Error checking user:', error);
            return false;
          }
        }

        async function registerUserInLastChat(email) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/users/last-chat`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username: email,
                chatId: null
              })
            });

            if (!response.ok) {
              console.error('Error registering user:', response.status);
              return false;
            }

            const result = await response.json();
            console.log('Registration result:', result);
            return true;
          } catch (error) {
            console.error('Error registering user:', error);
            return false;
          }
        }

        // Function to initialize user
        async function initializeUser() {
          const userEmail = getCookie('userEmail');

          console.log('Checking authorization:');
          console.log('userEmail from cookie:', userEmail);

          if (userEmail) {
            const decodedEmail = decodeURIComponent(userEmail).replace(/%40/g, '@');
            console.log('Decoded email:', decodedEmail);
            
            try {
              // Check if user exists in lastChat.json
              const isUserRegistered = await checkUserInLastChat(decodedEmail);
              console.log('User found in lastChat.json:', isUserRegistered);
              
              if (!isUserRegistered) {
                console.log('Registering new user in lastChat.json');
                const registrationSuccess = await registerUserInLastChat(decodedEmail);
                
                if (registrationSuccess) {
                  console.log('User successfully registered');
                } else {
                  console.error('Failed to register user');
                }
              }

              // Initialize currentUser only with email
              currentUser = decodedEmail;
              console.log('currentUser initialized:', currentUser);

              // Show main content and hide login block
              document.querySelector('.container.marg-up').classList.remove('hidden_all_h');
              document.querySelector('.login-container').classList.add('hidden_all_h');
              console.log('Main content shown, login block hidden');
            } catch (error) {
              console.error('Error processing authorization:', error);
            }
          } else {
            console.log('User not authorized (cookies missing)');
            // If user is not authorized, show login block and hide main content
            document.querySelector('.container.marg-up').classList.add('hidden_all_h');
            document.querySelector('.login-container').classList.remove('hidden_all_h');
            console.log('Login block shown, main content hidden');
          }
        }

        // Initialize user when page loads
        document.addEventListener('DOMContentLoaded', function() {
          if (!initializeUser()) {
            // If user is not authorized, redirect to login page
            window.location.href = '../login/login.html';
            return;
          }
          // If user is authorized, initialize WebSocket
          connectWebSocket();
        });

        // Prevent default form behavior and links
        document.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        document.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });

        // Prevent default behavior for all forms
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        });

        // Prevent default behavior for all links
        document.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        });

        // Function to log to console
        async function logToConsole(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const styles = {
                info: 'color: #007bff;',
                error: 'color: #dc3545;',
                success: 'color: #28a745;',
                warning: 'color: #ffc107;'
            };
            
            console.log(`%c[${timestamp}] ${message}`, styles[type] || styles.info);
            
            // ../chat/api/log
            try {
                await fetch('../chat/api/gen', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, type })
                });
            } catch (error) {
                // Ignore logging errors
            }
        }

        // Function to set up WebSocket connection
        function connectWebSocket() {
            console.log('Attempting to establish WebSocket connection...');
            
            // Close existing connection if it exists
            if (ws) {
                try {
                    ws.close();
                } catch (e) {
                    console.log('Error closing existing connection:', e);
                }
            }

            try {
                // ws = new WebSocket('ws://localhost:8080');
                ws = new WebSocket('wss://neuroflow.world/chat/ws');

                ws.onopen = function() {
                    console.log('WebSocket connection established');
                    // Send message about data loading
                    sendWebSocketMessage('loadData', {});
                    loadChats();
                    loadLastChat();
                };

                ws.onmessage = function(event) {
                    try {
                        console.log('Received message from server:', event.data);
                        const message = JSON.parse(event.data);
                        console.log('Message type:', message.type);
                        console.log('Message data:', message.data);
                        
                        if (message.type === 'topics') {
                            console.log('Received topics:', message.data);
                            updateTopicsList(message.data);
                        } else if (message.type === 'chats') {
                            console.log('Received chats:', message.data);
                            updateChatsList(message.data);
                        } else if (message.type === 'messages') {
                            console.log('Received messages:', message.data);
                            updateMessagesList(message.data);
                        } else if (message.type === 'messageSent') {
                            console.log('Message sending confirmation:', message.data);
                            if (currentChat) {
                                loadMessages(currentChat);
                            }
                        } else if (message.type === 'ratingUpdated') {
                            updateRatingUI(message.data.id, message.data);
                        } else if (message.type === 'onlineUpdated') {
                            console.log('Received online status update:', message.data);
                            updateOnlineStatus(message.data);
                        } else if (message.type === 'reactionAdded') {
                            updateMessageReactions(message.data);
                        } else if (message.type === 'messageEdited') {
                            updateMessageContent(message.data);
                        } else if (message.type === 'messageDeleted') {
                            if (currentChat) {
                                loadMessages(currentChat);
                            }
                        } else if (message.type === 'chatDeleted') {
                            if (currentChat === message.data.id) {
                                currentChat = null;
                                document.getElementById('top-content').style.display = 'block';
                                document.getElementById('chat-content').style.display = 'none';
                                document.getElementById('backButton').style.display = 'none';
                            }
                            loadChats();
                        } else if (message.type === 'chatEdited') {
                            updateChatTitle(message.data);
                        } else if (message.type === 'lastChat') {
                            if (message.data.chatId) {
                                openChat(message.data.chatId);
                            }
                        } else if (message.type === 'error') {
                            console.error('Server error:', message.message);
                            // alert(message.message);
                        } else {
                            console.warn('Unknown message type:', message.type);
                        }
                    } catch (error) {
                        console.error('Error processing message:', error);
                        console.error('Original data:', event.data);
                    }
                };

                ws.onerror = function(error) {
                    console.error('WebSocket error:', error);
                    console.error('Connection state:', ws.readyState);
                    
                    // Check connection state
                    if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
                        console.log('Connection closed or closing, planning reconnection...');
                        setTimeout(connectWebSocket, 5000);
                    }
                };

                ws.onclose = function(event) {
                    console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
                    
                    // Check close code
                    if (event.code === 1006) {
                        console.log('Detected abnormal connection closure (code 1006)');
                    }
                    
                    // Check if it was intentional closure
                    if (event.wasClean) {
                        console.log('Connection closed correctly');
                    } else {
                        console.log('Connection closed incorrectly, planning reconnection...');
                        setTimeout(connectWebSocket, 5000);
                    }
                };

                // Add timeout for connection check
                setTimeout(() => {
                    if (ws.readyState !== WebSocket.OPEN) {
                        console.log('Connection not established within timeout, reconnecting...');
                        ws.close();
                        setTimeout(connectWebSocket, 5000);
                    }
                }, 10000);

            } catch (error) {
                console.error('Error creating WebSocket connection:', error);
                setTimeout(connectWebSocket, 5000);
            }
        }

        // Function to send messages through WebSocket
        function sendWebSocketMessage(type, data) {
            console.log('Attempting to send WebSocket message:', { type, data });
            console.log('WebSocket state:', ws ? ws.readyState : 'WebSocket not initialized');
            
            if (!ws) {
                console.error('WebSocket not initialized');
                return;
            }

            if (ws.readyState !== WebSocket.OPEN) {
                console.error('WebSocket not connected. Current state:', ws.readyState);
                console.log('Attempting reconnection...');
                connectWebSocket();
                return;
            }

            try {
                const message = {
                    type: type,
                    ...data
                };
                const jsonMessage = JSON.stringify(message);
                console.log('Sending message:', jsonMessage);
                ws.send(jsonMessage);
                console.log('Message sent successfully');
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }

        // Event handlers for buttons
        function addClickHandler(elementId, handler) {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    handler(e);
                });
                element.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handler(e);
                    }
                });
            }
        }

        // Add event handlers for all buttons
        addClickHandler('createTopicBtn', () => openTopicModal());
        addClickHandler('createChatBtn', () => openChatModal());
        addClickHandler('saveTopicBtn', () => {
            const name = document.getElementById('topicName').value.trim();
            if (name) {
                createTopic(name);
                closeModals();
                document.getElementById('topicName').value = '';
            }
        });
        addClickHandler('saveChatBtn', () => {
            const name = document.getElementById('chatName').value.trim();
            const topicId = document.getElementById('topicSelect').value;
            
            if (!name) {
                alert('Please enter the name of the chat room');
                return;
            }
            if (!topicId) {
                alert('Please choose a topic');
                return;
            }

            createChat(name, topicId);
            closeModals();
            document.getElementById('chatName').value = '';
            document.getElementById('topicSelect').value = '';
        });
        addClickHandler('cancelTopicBtn', () => closeModals());
        addClickHandler('cancelChatBtn', () => closeModals());
        addClickHandler('backButton', () => goBack());

        // Functions for working with modal windows
        function openTopicModal() {
            document.getElementById('topicModal').style.display = 'block';
        }

        function openChatModal() {
            document.getElementById('chatModal').style.display = 'block';
            loadTopics();
        }

        function closeModals() {
            document.getElementById('topicModal').style.display = 'none';
            document.getElementById('chatModal').style.display = 'none';
            document.getElementById('topicName').value = '';
            document.getElementById('chatName').value = '';
            document.getElementById('topicSelect').value = '';
        }

        // Close modal windows when clicking outside them
        window.addEventListener('click', function(event) {
            const topicModal = document.getElementById('topicModal');
            const chatModal = document.getElementById('chatModal');
            if (event.target === topicModal) {
                closeModals();
            }
            if (event.target === chatModal) {
                closeModals();
            }
        });

        // Handle closing tab/window
        window.addEventListener('beforeunload', () => {
            if (currentChat) {
                sendWebSocketMessage('updateOnline', {
                    onlineChatId: currentChat,
                    onlineAction: 'leave'
                });
            }
        });

        // Update functions for working with WebSocket
        async function loadTopics() {
            sendWebSocketMessage('getTopics');
        }

        async function createTopic(name) {
            sendWebSocketMessage('createTopic', { name });
        }

        async function loadChats() {
            sendWebSocketMessage('getChats');
        }

        async function createChat(name, topicId) {
            console.log('Creating new chat:', { name, topicId });
            sendWebSocketMessage('createChat', { chatName: name, topicId, username: currentUser });
            
            // Add handler for getting confirmation of chat creation
            const handleChatCreated = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'chatCreated') {
                        console.log('Chat successfully created:', message.data);
                        // Update chats list
                        loadChats();
                        // Remove handler after use
                        ws.removeEventListener('message', handleChatCreated);
                    }
                } catch (error) {
                    console.error('Error processing chat creation:', error);
                }
            };
            
            ws.addEventListener('message', handleChatCreated);
        }

        async function loadMessages(chatId) {
            sendWebSocketMessage('getMessages', { chatId });
        }

        async function sendMessage(chatId) {
            console.log('Starting execution of sendMessage function');
            console.log('sendMessage function called with chatId:', chatId);
            
            if (!chatId) {
                console.error('chatId not defined');
                return;
            }
            
            const input = document.getElementById('messageInput');
            if (!input) {
                console.error('messageInput element not found');
                return;
            }
            
            const content = input.value.trim();
            console.log('Current input value:', content);
            
            if (!content) {
                console.log('Message empty, sending canceled');
                return;
            }

            console.log('Preparing to send message:', {
                content,
                chatId,
                username: currentUser
            });

            // Save current online status before sending message
            const currentOnline = document.getElementById('onlineCount')?.textContent || '0';

            sendWebSocketMessage('sendMessage', {
                messageContent: content,
                messageUsername: currentUser,
                messageChatId: chatId
            });

            console.log('Message sent through WebSocket');
            input.value = '';

            // Update online count after sending message
            const onlineCount = document.getElementById('onlineCount');
            if (onlineCount) {
                onlineCount.textContent = currentOnline;
            }
        }

        async function updateRating(chatId, type, event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            const ratingKey = `rating_${chatId}`;
            if (window[ratingKey]) {
                console.log('Rating update already in progress');
                return;
            }
            window[ratingKey] = true;

            try {
                // If rating already exists
                if (userRatings[chatId]) {
                    // If clicked on the same rating type - remove it
                    if (userRatings[chatId] === type) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        sendWebSocketMessage('updateRating', {
                            ratingChatId: chatId,
                            ratingType: type,
                            ratingAction: 'remove'
                        });
                        delete userRatings[chatId];
                    } 
                    // If clicked on different type - change rating
                    else {
                        // First remove old rating
                        await new Promise(resolve => setTimeout(resolve, 100));
                        sendWebSocketMessage('updateRating', {
                            ratingChatId: chatId,
                            ratingType: userRatings[chatId],
                            ratingAction: 'remove'
                        });
                        
                        // Then add new
                        await new Promise(resolve => setTimeout(resolve, 200));
                        sendWebSocketMessage('updateRating', {
                            ratingChatId: chatId,
                            ratingType: type,
                            ratingAction: 'add'
                        });
                        userRatings[chatId] = type;
                    }
                } 
                // If rating doesn't exist - add new
                else {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    sendWebSocketMessage('updateRating', {
                        ratingChatId: chatId,
                        ratingType: type,
                        ratingAction: 'add'
                    });
                    userRatings[chatId] = type;
                }
            } finally {
                await new Promise(resolve => setTimeout(resolve, 200));
                window[ratingKey] = false;
            }
        }

        async function openChat(chatId) {
            if (currentChat && currentChat !== chatId) {
                // Сначала отправляем сообщение о выходе из текущего чата
                sendWebSocketMessage('updateOnline', {
                    onlineChatId: currentChat,
                    onlineAction: 'leave'
                });
                
                // Ждем небольшую паузу, чтобы сервер успел обработать выход
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            currentChat = chatId;
            sendWebSocketMessage('saveLastChat', {
                lastChatUsername: currentUser,
                lastChatId: chatId
            });

            // Отправляем сообщение о входе в новый чат
            sendWebSocketMessage('updateOnline', {
                onlineChatId: chatId,
                onlineAction: 'join'
            });

            document.getElementById('top-content').style.display = 'none';
            document.getElementById('chat-content').style.display = 'block';
            document.getElementById('backButton').style.display = 'block';

            // Загружаем сообщения
            await loadMessages(chatId);
            
            // Обновляем список чатов только один раз после всех операций
            await loadChats();
        }

        async function addReaction(messageId, reaction) {
            sendWebSocketMessage('addReaction', {
                reactionMessageId: messageId,
                reaction,
                reactionUsername: currentUser
            });
        }

        async function saveEditMessage(messageId, newContent) {
            if (!newContent) {
                alert('Message cannot be empty');
                return;
            }

            sendWebSocketMessage('editMessage', {
                editMessageId: messageId,
                editContent: newContent
            });

            const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
            const contentDiv = messageDiv.querySelector('.message-content');
            contentDiv.textContent = newContent;
            contentDiv.style.display = 'block';
            
            // Remove input field and buttons
            const input = messageDiv.querySelector('.edit-message-input');
            const actions = messageDiv.querySelector('.edit-actions');
            if (input) input.remove();
            if (actions) actions.remove();
        }

        async function deleteMessage(messageId) {
            showConfirmModal('Are you sure you want to delete this message?', () => {
                sendWebSocketMessage('deleteMessage', {
                    deleteMessageId: messageId
                });
            });
        }

        async function deleteChat(chatId) {
            showConfirmModal('Are you sure you want to delete this chat?', () => {
                // First send message about chat deletion
                sendWebSocketMessage('deleteChat', {
                    deleteChatId: chatId,
                    deleteUsername: currentUser
                });

                // If we are in the deleting chat, return to main page
                if (currentChat === chatId) {
                    currentChat = null;
                    document.getElementById('top-content').style.display = 'block';
                    document.getElementById('chat-content').style.display = 'none';
                    document.getElementById('backButton').style.display = 'none';
                }
            });
        }

        async function saveEditChat(chatId, event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            const chatBlock = document.querySelector(`[data-chat-id="${chatId}"]`);
            const input = chatBlock.querySelector('.chat-title-edit');
            const newTitle = input.value.trim();
            
            if (!newTitle) {
                alert('The name of the chat room cannot be empty');
                return;
            }

            sendWebSocketMessage('editChat', {
                editChatId: chatId,
                editName: newTitle,
                editUsername: currentUser
            });

            const titleDiv = chatBlock.querySelector('.chat-title');
            titleDiv.textContent = newTitle;
            titleDiv.style.display = 'inline-block';
            
            // Remove input field and buttons
            input.remove();
            chatBlock.querySelector('.edit-actions').remove();
        }

        async function loadLastChat() {
            sendWebSocketMessage('getLastChat', {
                getLastChatUsername: currentUser
            });
        }

        // Helper functions for updating UI
        function updateTopicsList(topics) {
            const select = document.getElementById('topicSelect');
            select.innerHTML = '<option value="">Select topic</option>';
            topics.forEach(topic => {
                select.innerHTML += `<option value="${topic.id}">${topic.name}</option>`;
            });
        }

        function calculatePopularity(chat, allChats) {
            // Calculate total likes and online users
            const totalLikes = allChats.reduce((sum, c) => sum + (parseInt(c.likes) || 0), 0);
            const totalOnline = allChats.reduce((sum, c) => sum + (parseInt(c.online) || 0), 0);
            
            // If there are no likes and online users, return 0
            if (totalLikes === 0 && totalOnline === 0) return 0;
            
            // Calculate popularity by likes (50% weight)
            const likesPopularity = totalLikes > 0 ? (parseInt(chat.likes) || 0) / totalLikes : 0;
            
            // Calculate popularity by online (50% weight)
            const onlinePopularity = totalOnline > 0 ? (parseInt(chat.online) || 0) / totalOnline : 0;
            
            // Overall popularity (average arithmetic)
            return (likesPopularity + onlinePopularity) / 2;
        }

        function updateChatsList(chats) {
            console.log('Updating chats list with:', chats);
            const chatsList = document.getElementById('chats-container');
            chatsList.innerHTML = '';
            
            // Calculate popularity for each chat
            const chatsWithPopularity = chats.map(chat => ({
                ...chat,
                popularity: calculatePopularity(chat, chats)
            }));
            
            chatsWithPopularity.forEach(chat => {
                console.log('Processing chat in updateChatsList:', chat);
                const chatBlock = document.createElement('div');
                chatBlock.className = 'chat-block';
                chatBlock.setAttribute('data-chat-id', chat.id);
                
                const topicName = chat.topicName || 'Without theme';
                console.log('Chat ID:', chat.id, 'Topic Name:', topicName);
                
                chatBlock.innerHTML = `
                    <div class="chat-info">
                        <div class="chat-title">${chat.name}</div>
                        <div class="chat-topic">Theme: ${topicName}</div>
                        <div class="chat-popularity">
                            Popularity: ${(chat.popularity * 100).toFixed(1)}%
                        </div>
                    </div>
                    <div class="chat-stats">
                        <div class="rating">
                            <button type="button" class="rating-btn ${userRatings[chat.id] === 'like' ? 'active' : ''}" 
                                    data-type="like"
                                    data-chat-id="${chat.id}">
                                👍 ${chat.likes || 0}
                            </button>
                            <button type="button" class="rating-btn ${userRatings[chat.id] === 'dislike' ? 'active' : ''}" 
                                    data-type="dislike"
                                    data-chat-id="${chat.id}">
                                👎 ${chat.dislikes || 0}
                            </button>
                        </div>
                        <div class="online">
                            <span class="online-indicator"></span>
                            ${chat.online || 0}
                        </div>
                        ${chat.username === currentUser ? `
                            <div class="chat-actions">
                                <button type="button" class="edit-chat-btn" data-chat-id="${chat.id}">
                                    ✏️
                                </button>
                                <button type="button" class="delete-chat-btn" data-chat-id="${chat.id}">
                                    Delete
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                // Add event handlers
                const likeBtn = chatBlock.querySelector('.rating-btn[data-type="like"]');
                const dislikeBtn = chatBlock.querySelector('.rating-btn[data-type="dislike"]');
                const editBtn = chatBlock.querySelector('.edit-chat-btn');
                const deleteBtn = chatBlock.querySelector('.delete-chat-btn');
                const chatInfo = chatBlock.querySelector('.chat-info');
                
                if (likeBtn) {
                    likeBtn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateRating(chat.id, 'like', e);
                    };
                }
                if (dislikeBtn) {
                    dislikeBtn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateRating(chat.id, 'dislike', e);
                    };
                }
                if (editBtn) {
                    editBtn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEditChat(chat.id, e);
                    };
                }
                if (deleteBtn) {
                    deleteBtn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteChat(chat.id);
                    };
                }

                // Chat info click handler only on chat info block
                if (chatInfo) {
                    chatInfo.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Check if click was on element with chat-title-edit class
                        if (e.target.classList.contains('chat-title-edit')) {
                            return; // If yes, don't open chat
                        }
                        
                        openChat(chat.id);
                    };
                }

                chatsList.appendChild(chatBlock);
            });
        }

        function updateMessagesList(messages) {
            const container = document.getElementById('current-chat');
            const headerDiv = document.createElement('div');
            headerDiv.className = 'chat-header';
            
            const currentOnline = document.getElementById('onlineCount')?.textContent || '0';
            
            headerDiv.innerHTML = `
                <div class="online-count">
                    <span class="online-indicator"></span>
                    Online: <span id="onlineCount">${currentOnline}</span>
                </div>
            `;
            
            const messagesDiv = document.createElement('div');
            messagesDiv.className = 'chat-messages';
            
            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message';
                messageDiv.setAttribute('data-message-id', message.id);
                messageDiv.innerHTML = `
                    <img src="cart.jpg" alt="User avatar" class="message-avatar">
                    <div class="message-content-wrapper">
                        <div class="message-header">
                            <span class="message-username">${message.username}</span>
                            <span class="message-time">${new Date(message.createdAt).toLocaleString()}</span>
                        </div>
                        <div class="message-content" id="content-${message.id}">${message.content}</div>
                        <div class="message-actions">
                            <button type="button" class="reaction-btn" data-message-id="${message.id}">
                                😀
                            </button>
                            <div class="reactions-picker" id="picker-${message.id}">
                                ${REACTIONS.map(reaction => `
                                    <div class="reaction-option" data-reaction="${reaction}" data-message-id="${message.id}">
                                        ${reaction}
                                    </div>
                                `).join('')}
                            </div>
                            <div class="reactions-list">
                                ${message.reactions ? Object.entries(message.reactions).map(([reaction, users]) => 
                                    `<button type="button" class="reaction-btn" data-reaction="${reaction}" data-message-id="${message.id}">
                                        ${reaction} ${users.length}
                                    </button>`
                                ).join('') : ''}
                            </div>
                            ${message.username === currentUser ? `
                                <button type="button" class="edit-btn" data-message-id="${message.id}">✏️</button>
                                <button type="button" class="delete-btn" data-message-id="${message.id}">🗑️</button>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                // Add event handlers
                const reactionBtn = messageDiv.querySelector('.reaction-btn');
                const editBtn = messageDiv.querySelector('.edit-btn');
                const deleteBtn = messageDiv.querySelector('.delete-btn');
                const reactionOptions = messageDiv.querySelectorAll('.reaction-option');
                
                if (reactionBtn) {
                    reactionBtn.onclick = (e) => showReactionsPicker(e, message.id);
                }
                if (editBtn) {
                    editBtn.onclick = () => startEditMessage(message.id);
                }
                if (deleteBtn) {
                    deleteBtn.onclick = () => deleteMessage(message.id);
                }
                
                reactionOptions.forEach(option => {
                    option.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const reaction = option.dataset.reaction;
                        addReaction(message.id, reaction);
                    };
                });
                
                messagesDiv.appendChild(messageDiv);
            });
            
            const inputDiv = document.createElement('div');
            inputDiv.style.display = 'flex';
            inputDiv.style.gap = '10px';
            inputDiv.innerHTML = `
                <input type="text" id="messageInput" placeholder="Enter a message...">
                <button type="button" class="send-message-btn" data-chat-id="${currentChat}">Send</button>
                <button type="button" class="ai-button" id="aiSummaryBtn">
                    <i>🤖</i> AI
                </button>
            `;
            
            container.innerHTML = '';
            container.appendChild(headerDiv);
            container.appendChild(messagesDiv);
            container.appendChild(inputDiv);

            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            const messageInput = document.getElementById('messageInput');
            const sendButton = inputDiv.querySelector('.send-message-btn');
            
            messageInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage(currentChat);
                }
            };
            
            if (sendButton) {
                console.log('Adding send button handler');
                sendButton.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Send button clicked');
                    const chatId = sendButton.getAttribute('data-chat-id');
                    console.log('Chat ID from button:', chatId);
                    console.log('Attempting to call sendMessage function');
                    try {
                        sendMessage(chatId);
                        console.log('sendMessage function called successfully');
                    } catch (error) {
                        console.error('Error calling sendMessage:', error);
                    }
                };
            }

            // Add AI modal window
            const modalDiv = document.createElement('div');
            modalDiv.className = 'ai-summary-modal';
            modalDiv.innerHTML = `
                <div class="ai-summary-content">
                    <div class="ai-summary-title">Choose a date and time for the retelling</div>
                    <div class="ai-summary-date">
                        <div class="ai-summary-date-header">
                            <div class="ai-summary-date-title">Select a date</div>
                        </div>
                        <div class="ai-summary-date-grid" id="dateGrid"></div>
                        <div class="ai-summary-time">
                            <label>Select a time:</label>
                            <select id="timeSelect">
                                <option value="00:00">00:00</option>
                                <option value="01:00">01:00</option>
                                <option value="02:00">02:00</option>
                                <option value="03:00">03:00</option>
                                <option value="04:00">04:00</option>
                                <option value="05:00">05:00</option>
                                <option value="06:00">06:00</option>
                                <option value="07:00">07:00</option>
                                <option value="08:00">08:00</option>
                                <option value="09:00">09:00</option>
                                <option value="10:00">10:00</option>
                                <option value="11:00">11:00</option>
                                <option value="12:00">12:00</option>
                                <option value="13:00">13:00</option>
                                <option value="14:00">14:00</option>
                                <option value="15:00">15:00</option>
                                <option value="16:00">16:00</option>
                                <option value="17:00">17:00</option>
                                <option value="18:00">18:00</option>
                                <option value="19:00">19:00</option>
                                <option value="20:00">20:00</option>
                                <option value="21:00">21:00</option>
                                <option value="22:00">22:00</option>
                                <option value="23:00">23:00</option>
                            </select>
                        </div>
                        <button class="ai-summary-button" id="generateSummaryBtn">Retell</button>
                    </div>
                    <div class="ai-summary-result"></div>
                </div>
            `;
            document.body.appendChild(modalDiv);

            // Add event handlers
            const aiButton = document.getElementById('aiSummaryBtn');
            const modal = document.querySelector('.ai-summary-modal');
            const resultDiv = modal.querySelector('.ai-summary-result');
            const timeSelect = document.getElementById('timeSelect');
            const generateSummaryBtn = document.getElementById('generateSummaryBtn');

            // Set current time in select
            const now = new Date();
            const currentHour = now.getHours().toString().padStart(2, '0') + ':00';
            timeSelect.value = currentHour;

            aiButton.onclick = () => {
                modal.classList.add('show');
                generateDateGrid();
            };

            // Remove automatic generation on time change
            timeSelect.onchange = () => {
                // Simply update time, without generation
            };

            // Add handler for "Retell" button
            generateSummaryBtn.onclick = generateSummaryForSelectedDate;

            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    resultDiv.classList.remove('show');
                    resultDiv.innerHTML = '';
                }
            };
        }

        // Update function updateOnlineStatus for updating online count
        function updateOnlineStatus(chat) {
            // Проверяем, что значение online не отрицательное
            const onlineCount = Math.max(0, parseInt(chat.online) || 0);
            
            const chatBlock = document.querySelector(`[data-chat-id="${chat.id}"]`);
            if (chatBlock) {
                const onlineElement = chatBlock.querySelector('.online');
                if (onlineElement) {
                    onlineElement.innerHTML = `
                        <span class="online-indicator"></span>
                        ${onlineCount}
                    `;
                }
            }
            
            // Обновляем счетчик онлайн в чате, если мы находимся в нем
            if (currentChat === chat.id) {
                const onlineCountElement = document.getElementById('onlineCount');
                if (onlineCountElement) {
                    onlineCountElement.textContent = onlineCount;
                }
            }
        }

        function updateRatingUI(chatId, chat) {
            const chatBlock = document.querySelector(`[data-chat-id="${chatId}"]`);
            if (!chatBlock) return;

            const likeBtn = chatBlock.querySelector('.rating-btn[data-type="like"]');
            const dislikeBtn = chatBlock.querySelector('.rating-btn[data-type="dislike"]');

            if (likeBtn) {
                likeBtn.innerHTML = `👍 ${chat.likes || 0}`;
                likeBtn.classList.toggle('active', userRatings[chatId] === 'like');
            }
            if (dislikeBtn) {
                dislikeBtn.innerHTML = `👎 ${chat.dislikes || 0}`;
                dislikeBtn.classList.toggle('active', userRatings[chatId] === 'dislike');
            }
        }

        function updateMessageReactions(message) {
            const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
                if (messageElement) {
                    const reactionsList = messageElement.querySelector('.reactions-list');
                    if (reactionsList) {
                    reactionsList.innerHTML = message.reactions ? 
                        Object.entries(message.reactions).map(([reaction, users]) => 
                            `<button type="button" class="reaction-btn" data-reaction="${reaction}" data-message-id="${message.id}">
                                    ${reaction} ${users.length}
                                </button>`
                            ).join('') : '';
                }
            }
        }

        function updateMessageContent(message) {
            const contentDiv = document.getElementById(`content-${message.id}`);
            if (contentDiv) {
                contentDiv.textContent = message.content;
                contentDiv.classList.add('editing');
                setTimeout(() => contentDiv.classList.remove('editing'), 300);
            }
        }

        function startEditMessage(messageId) {
            const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
            const contentDiv = messageDiv.querySelector('.message-content');
            const currentContent = contentDiv.textContent;
            
            // Create input field
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'edit-message-input';
            input.value = currentContent;
            
            // Create action buttons
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'edit-actions';
            actionsDiv.innerHTML = `
                <button class="save-edit-btn">Save</button>
                <button class="cancel-edit-btn">Cancel</button>
            `;
            
            // Replace content with input field
            contentDiv.style.display = 'none';
            contentDiv.parentNode.insertBefore(input, contentDiv);
            contentDiv.parentNode.insertBefore(actionsDiv, input.nextSibling);
            
            input.focus();
            input.select();

            // Add event handlers
            const saveBtn = actionsDiv.querySelector('.save-edit-btn');
            const cancelBtn = actionsDiv.querySelector('.cancel-edit-btn');

            saveBtn.onclick = () => {
                const newContent = input.value.trim();
                if (newContent) {
                    saveEditMessage(messageId, newContent);
                }
            };

            cancelBtn.onclick = () => {
                contentDiv.style.display = 'block';
                input.remove();
                actionsDiv.remove();
            };

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const newContent = input.value.trim();
                    if (newContent) {
                        saveEditMessage(messageId, newContent);
                    }
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    contentDiv.style.display = 'block';
                    input.remove();
                    actionsDiv.remove();
                }
            });
        }

        function showReactionsPicker(event, messageId) {
            event.preventDefault();
            event.stopPropagation();
            
            const picker = document.getElementById(`picker-${messageId}`);
            if (!picker) return;
            
            // Close all open pickers
            document.querySelectorAll('.reactions-picker.show').forEach(p => {
                if (p !== picker) {
                    p.classList.remove('show');
                }
            });
            
            picker.classList.toggle('show');
            
            // Close picker when clicking outside it
            const closePicker = (e) => {
                if (!picker.contains(e.target) && e.target !== event.target) {
                    picker.classList.remove('show');
                    document.removeEventListener('click', closePicker);
                }
            };
            
            // Add handler with slight delay to not trigger immediately
            setTimeout(() => {
                document.addEventListener('click', closePicker);
            }, 100);
        }

        function updateChatTitle(chat) {
            const chatBlock = document.querySelector(`[data-chat-id="${chat.id}"]`);
            if (chatBlock) {
                const titleDiv = chatBlock.querySelector('.chat-title');
                if (titleDiv) {
                    titleDiv.textContent = chat.name;
                }
            }
        }

        // Update return function
        async function goBack(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            if (currentChat) {
                // Отправляем сообщение о выходе из чата
                sendWebSocketMessage('updateOnline', {
                    onlineChatId: currentChat,
                    onlineAction: 'leave'
                });
                
                // Ждем небольшую паузу, чтобы сервер успел обработать выход
                await new Promise(resolve => setTimeout(resolve, 100));
                
                currentChat = null;
                document.getElementById('top-content').style.display = 'block';
                document.getElementById('chat-content').style.display = 'none';
                document.getElementById('backButton').style.display = 'none';
                
                // Обновляем список чатов только один раз после выхода
                await loadChats();
            }
        }

        // Update return button handler
        document.getElementById('backButton').onclick = goBack;

        // Update chat editing function
        async function startEditChat(chatId, event) {
            event.preventDefault();
            event.stopPropagation();
            
            // Check if chat editing window is already open
            const existingEdit = document.querySelector('.chat-title-edit');
            if (existingEdit) {
                return; // If chat editing window is already open, don't open new one
            }
            
            const chatBlock = document.querySelector(`[data-chat-id="${chatId}"]`);
            const titleDiv = chatBlock.querySelector('.chat-title');
            const currentTitle = titleDiv.textContent;
            
            // Create input field
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'chat-title-edit';
            input.value = currentTitle;
            
            // Create action buttons
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'edit-actions';
            actionsDiv.innerHTML = `
                <button class="save-edit-btn">Save</button>
                <button class="cancel-edit-btn">Cancel</button>
            `;
            
            // Replace title with input field
            titleDiv.style.display = 'none';
            titleDiv.parentNode.insertBefore(input, titleDiv);
            titleDiv.parentNode.insertBefore(actionsDiv, input.nextSibling);
            
            input.focus();
            input.select();

            // Add event handlers
            const saveBtn = actionsDiv.querySelector('.save-edit-btn');
            const cancelBtn = actionsDiv.querySelector('.cancel-edit-btn');

            saveBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                saveEditChat(chatId, e);
            };

            cancelBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                cancelEditChat(chatId, currentTitle, e);
            };

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveEditChat(chatId, e);
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEditChat(chatId, currentTitle, e);
                }
            });
        }

        function cancelEditChat(chatId, originalTitle, event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            const chatBlock = document.querySelector(`[data-chat-id="${chatId}"]`);
            const titleDiv = chatBlock.querySelector('.chat-title');
            titleDiv.textContent = originalTitle;
            titleDiv.style.display = 'inline-block';
            
            // Remove input field and buttons
            const input = chatBlock.querySelector('.chat-title-edit');
            const actions = chatBlock.querySelector('.edit-actions');
            if (input) input.remove();
            if (actions) actions.remove();
        }

        // Add functions for working with confirmation modal
        function showConfirmModal(text, onConfirm) {
            const modal = document.getElementById('confirmModal');
            const modalText = document.getElementById('confirmModalText');
            const confirmBtn = document.getElementById('confirmModalConfirm');
            const cancelBtn = document.getElementById('confirmModalCancel');
            
            modalText.textContent = text;
            modal.classList.add('show');
            
            const handleConfirm = () => {
                modal.classList.remove('show');
                onConfirm();
                cleanup();
            };
            
            const handleCancel = () => {
                modal.classList.remove('show');
                cleanup();
            };
            
            const handleClickOutside = (e) => {
                if (e.target === modal) {
                    handleCancel();
                }
            };
            
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                }
            };
            
            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                modal.removeEventListener('click', handleClickOutside);
                document.removeEventListener('keydown', handleEscape);
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            modal.addEventListener('click', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        // Add functions for working with AI
        async function getMessagesForPeriod(hours) {
            try {
                // const response = await fetch('http://localhost:5421/api/chats/' + currentChat + '/messages');
                const response = await fetch('../chat/api/chats/' + currentChat + '/messages');
                const messages = await response.json();
                const now = new Date();
                const timeAgo = new Date(now - hours * 60 * 60 * 1000);
                
                return messages.filter(msg => 
                    msg.chatId === currentChat && 
                    new Date(msg.createdAt) >= timeAgo
                );
            } catch (error) {
                console.error('Error getting messages:', error);
                return [];
            }
        }

        async function generateAISummary(messages, retryCount = 0) {
            console.log('Starting summary generation for messages:', messages);
            
            if (!messages || messages.length === 0) {
                return 'No messages to summarize';
            }

            const prompt = `Make a brief summary of the following chat messages, preserving the main points and important details. Respond in English:\n\n${messages.map(msg => {
                const date = new Date(msg.createdAt);
                return `${msg.username} (${date.toLocaleDateString()}, ${date.toLocaleTimeString()}): ${msg.content}`;
            }).join('\n')}`;

            console.log('Sending prompt:', prompt);

            return new Promise((resolve, reject) => {
                let summary = '';
                let isComplete = false;

                const messageHandler = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('Received WebSocket data:', data);

                        if (data.type === 'summaryGenerated') {
                            summary += data.data;
                            if (data.data.includes('.')) {
                                isComplete = true;
                                ws.removeEventListener('message', messageHandler);
                                clearTimeout(timeoutId);
                                resolve(summary);
                            }
                        } else if (data.type === 'error') {
                            ws.removeEventListener('message', messageHandler);
                            clearTimeout(timeoutId);
                            if (retryCount < 1) {
                                console.log('Received error, trying again');
                                generateAISummary(messages, retryCount + 1)
                                    .then(resolve)
                                    .catch(reject);
                            } else {
                                reject(new Error(data.message));
                            }
                        }
                    } catch (error) {
                        console.error('Error processing message:', error);
                        ws.removeEventListener('message', messageHandler);
                        clearTimeout(timeoutId);
                        reject(error);
                    }
                };

                const timeoutId = setTimeout(() => {
                    ws.removeEventListener('message', messageHandler);
                    if (retryCount < 1 && !isComplete) {
                        console.log('Timeout during generation, trying again');
                        generateAISummary(messages, retryCount + 1)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject(new Error('Response timeout exceeded'));
                    }
                }, 10000);

                ws.addEventListener('message', messageHandler);
                sendWebSocketMessage('generateSummary', { prompt });
            });
        }

        // Add functions for working with calendar
        function generateDateGrid() {
            const dateGrid = document.getElementById('dateGrid');
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            
            // Clear grid
            dateGrid.innerHTML = '';
            
            // Generate days
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                
                const dayDiv = document.createElement('div');
                dayDiv.className = 'ai-summary-date-day';
                if (i === 0) {
                    dayDiv.classList.add('active');
                }
                dayDiv.textContent = date.getDate();
                dayDiv.dataset.date = date.toISOString().split('T')[0];
                
                dayDiv.onclick = () => {
                    // Remove active class from all days
                    document.querySelectorAll('.ai-summary-date-day').forEach(d => {
                        d.classList.remove('active');
                    });
                    // Add active class to selected day
                    dayDiv.classList.add('active');
                };
                
                dateGrid.appendChild(dayDiv);
            }
        }

        // http://localhost:5421/api/chats/
        async function getMessagesByDate(dateTime) {
            console.log('Getting messages for date:', dateTime);
            
            return new Promise((resolve, reject) => {
                const messageHandler = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('Received data through WebSocket:', data);
                        
                        if (data.type === 'messages') {
                            ws.removeEventListener('message', messageHandler);
                            clearTimeout(timeoutId);
                            
                            const messages = data.data;
                            console.log('All chat messages:', messages);
                            
                            // Filter messages by date
                            const targetDate = new Date(dateTime);
                            const filteredMessages = messages.filter(msg => {
                                const msgDate = new Date(msg.createdAt);
                                return msgDate >= targetDate;
                            });
                            
                            // Sort messages by time
                            filteredMessages.sort((a, b) => 
                                new Date(a.createdAt) - new Date(b.createdAt)
                            );
                            
                            console.log('Filtered messages:', filteredMessages);
                            resolve(filteredMessages);
                        }
                    } catch (error) {
                        console.error('Error processing message:', error);
                        ws.removeEventListener('message', messageHandler);
                        clearTimeout(timeoutId);
                        reject(error);
                    }
                };

                const timeoutId = setTimeout(() => {
                    ws.removeEventListener('message', messageHandler);
                    reject(new Error('Messages timeout'));
                }, 5000);

                ws.addEventListener('message', messageHandler);
                sendWebSocketMessage('getMessages', { chatId: currentChat });
            });
        }

        async function generateSummaryForSelectedDate() {
            const resultDiv = document.querySelector('.ai-summary-result');
            resultDiv.innerHTML = '<div class="loading">Generating retelling...</div>';
            resultDiv.classList.add('show');

            try {
                const activeDay = document.querySelector('.ai-summary-date-day.active');
                if (!activeDay) {
                    resultDiv.innerHTML = 'Please select a date';
                    return;
                }

                const date = new Date(activeDay.dataset.date);
                const messages = await getMessagesByDate(date);
                
                if (!messages || messages.length === 0) {
                    resultDiv.innerHTML = 'No messages for selected date';
                    return;
                }

                const summary = await generateAISummary(messages);
                resultDiv.innerHTML = summary;
            } catch (error) {
                console.error('Error generating retelling:', error);
                resultDiv.innerHTML = 'An error occurred generating retelling. Please try again.';
            }
        }
   
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
    if (buttonId === 'topics_container_func') {
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
    } if (buttonId === 'news_func') {
        window.location.href = '../news/';
    }else {
        // Для остальных кнопок делаем перенаправление
        const sectionParams = {
            'home_func': 'home',
            'about_func': 'about',
            'top_func': 'top',
            'features_func': 'features',
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


// фв
