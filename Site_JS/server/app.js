const express = require('express');
const axios = require('axios');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://neuroflow.world' : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

const messagesFilePath = path.join(__dirname, '../base_date/messages.json');
const topicsFilePath = path.join(__dirname, '../base_date/topics.json');
const usersFilePath = path.join(__dirname, '../base_date/users.json');
const projectsFilePath = path.join(__dirname, '../base_date/projects.json');
const p2pMessagesFilePath = path.join(__dirname, '../base_date/p2p_messages.json');
const ratingsFilePath = path.join(__dirname, '../base_date/ratings.json');

app.use(session({
  secret: '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',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth 2.0 Strategy
passport.use(new GoogleStrategy({
  clientID: "449301712934-otg87n2g8ue800t9lmt2f095d3okfqlr.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "https://neuroflow.world/auth/google/callback",
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    let usersData;
    try {
      usersData = JSON.parse(await fs.readFile(usersFilePath));
    } catch (error) {
      usersData = { Users: {} };
    }

    const userEmail = req.query.email || profile.emails[0].value;
    if (!usersData.Users[userEmail]) {
      const userData = {
        email: userEmail,
        name: profile.displayName,
        picture: profile.photos[0].value,
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      usersData.Users[userEmail] = userData;
      await fs.writeFile(usersFilePath, JSON.stringify(usersData, null, 2));
      return done(null, { ...userData, isNewUser: true });
    } else {
      usersData.Users[userEmail].lastLogin = new Date().toISOString();
      await fs.writeFile(usersFilePath, JSON.stringify(usersData, null, 2));
      return done(null, { ...usersData.Users[userEmail], isNewUser: false });
    }
  } catch (error) {
    console.error('Error in Google OAuth strategy:', error.message, error.stack);
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Content Security Policy (CSP)
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' http://localhost:3000 https://neuroflow.world; " +
    "connect-src 'self' http://localhost:3000 https://neuroflow.world https://accounts.google.com https://oauth2.googleapis.com;"
  );
  next();
});

// Authentication check endpoint
app.get('/api/check-auth', (req, res) => {
  console.log('Server: /api/check-auth called, session:', req.session);
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Google OAuth routes
app.get('/auth/google', (req, res, next) => {
  const state = req.query.state ? JSON.parse(req.query.state) : null;
  const email = state?.email;
  const options = {
    scope: ['profile', 'email'],
    state: email ? JSON.stringify({ email }) : undefined
  };
  passport.authenticate('google', options)(req, res, next);
});

app.get('/auth/google/callback', (req, res, next) => {
  console.log('Callback route hit with query:', req.query);
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err);
      return next(err);
    }
    if (!user) {
      console.log('No user found, redirecting to /login. Info:', info);
      return res.redirect('/login');
    }

    console.log('User authenticated:', user);
    req.logIn(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }

      console.log('Setting cookies for user:', user.email);
      res.cookie('userEmail', user.email, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: false,
        domain: process.env.NODE_ENV === 'production' ? 'neuroflow.world' : undefined,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      });
      res.cookie('userName', user.name, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: false,
        domain: process.env.NODE_ENV === 'production' ? 'neuroflow.world' : undefined,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      });

      console.log('Redirecting to https://neuroflow.world/?_ijt=...');
      res.redirect('https://neuroflow.world/?_ijt=6maboi3b9j1nq6mrvjhrmft1eu&_ij_reload=RELOAD_ON_SAVE');
    });
  })(req, res, next);
});

// API for messages
app.get('/api/messages', async (req, res) => {
  try {
    const messagesData = JSON.parse(await fs.readFile(messagesFilePath));
    res.json(messagesData.messages);
  } catch (error) {
    console.error('Error fetching messages:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при читанні повідомлень', details: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { text, author, authorEmail } = req.body;
    if (!text || !author || !authorEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let messagesData;
    try {
      messagesData = JSON.parse(await fs.readFile(messagesFilePath));
    } catch (error) {
      messagesData = { messages: [] };
    }

    const newMessage = {
      id: Date.now(),
      text,
      author,
      authorEmail,
      timestamp: new Date().toISOString(),
      likes: [],
      dislikes: []
    };

    messagesData.messages.unshift(newMessage);
    await fs.writeFile(messagesFilePath, JSON.stringify(messagesData, null, 2));
    res.json(newMessage);
  } catch (error) {
    console.error('Error adding message:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при додаванні повідомлення', details: error.message });
  }
});

app.post('/api/messages/:messageId/reaction', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { type, userEmail } = req.body;
    if (!type || !userEmail) {
      return res.status(400).json({ error: 'Missing type or userEmail' });
    }

    let messagesData;
    try {
      messagesData = JSON.parse(await fs.readFile(messagesFilePath));
    } catch (error) {
      messagesData = { messages: [] };
    }

    const message = messagesData.messages.find(m => m.id === parseInt(messageId));
    if (!message) {
      return res.status(404).json({ error: 'Повідомлення не знайдено' });
    }

    message.likes = message.likes || [];
    message.dislikes = message.dislikes || [];
    message.love = message.love || [];
    message.laugh = message.laugh || [];
    message.wow = message.wow || [];

    if (type === 'like') {
      const hasLike = message.likes.includes(userEmail);
      message.dislikes = message.dislikes.filter(email => email !== userEmail);
      message.likes = hasLike
        ? message.likes.filter(email => email !== userEmail)
        : [...message.likes, userEmail];
    } else if (type === 'dislike') {
      const hasDislike = message.dislikes.includes(userEmail);
      message.likes = message.likes.filter(email => email !== userEmail);
      message.dislikes = hasDislike
        ? message.dislikes.filter(email => email !== userEmail)
        : [...message.dislikes, userEmail];
    } else {
      message.love = message.love.filter(email => email !== userEmail);
      message.laugh = message.laugh.filter(email => email !== userEmail);
      message.wow = message.wow.filter(email => email !== userEmail);
      switch (type) {
        case 'love': message.love.push(userEmail); break;
        case 'laugh': message.laugh.push(userEmail); break;
        case 'wow': message.wow.push(userEmail); break;
        default: return res.status(400).json({ error: 'Invalid reaction type' });
      }
    }

    await fs.writeFile(messagesFilePath, JSON.stringify(messagesData, null, 2));
    res.json({
      likes: message.likes.length,
      dislikes: message.dislikes.length,
      love: message.love.length,
      laugh: message.laugh.length,
      wow: message.wow.length,
      userReactions: {
        like: message.likes.includes(userEmail),
        dislike: message.dislikes.includes(userEmail),
        love: message.love.includes(userEmail),
        laugh: message.laugh.includes(userEmail),
        wow: message.wow.includes(userEmail)
      }
    });
  } catch (error) {
    console.error('Error handling reaction:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при обробці реакції', details: error.message });
  }
});

// API for topics
app.get('/api/topics', async (req, res) => {
  try {
    const topicsData = JSON.parse(await fs.readFile(topicsFilePath));
    res.json(topicsData.topics);
  } catch (error) {
    console.error('Error fetching topics:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при читанні тем', details: error.message });
  }
});

app.post('/api/topics', async (req, res) => {
  try {
    const { title, author, authorEmail } = req.body;
    if (!title || !author || !authorEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let topicsData;
    try {
      topicsData = JSON.parse(await fs.readFile(topicsFilePath));
    } catch (error) {
      topicsData = { topics: [] };
    }

    const newTopic = {
      id: Date.now(),
      title,
      author,
      authorEmail,
      createdAt: new Date().toISOString(),
      messageIds: []
    };

    topicsData.topics.unshift(newTopic);
    await fs.writeFile(topicsFilePath, JSON.stringify(topicsData, null, 2));
    res.json(newTopic);
  } catch (error) {
    console.error('Error creating topic:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при створенні теми', details: error.message });
  }
});

app.get('/api/topics/:topicId/messages', async (req, res) => {
  try {
    const { topicId } = req.params;
    let messagesData, topicsData;
    try {
      messagesData = JSON.parse(await fs.readFile(messagesFilePath));
      topicsData = JSON.parse(await fs.readFile(topicsFilePath));
    } catch (error) {
      messagesData = { messages: [] };
      topicsData = { topics: [] };
    }

    const topic = topicsData.topics.find(t => t.id === parseInt(topicId));
    if (!topic) {
      return res.status(404).json({ error: 'Тему не знайдено' });
    }

    const topicMessages = messagesData.messages.filter(m => topic.messageIds.includes(m.id));
    res.json(topicMessages);
  } catch (error) {
    console.error('Error fetching messages for topic:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при читанні повідомлень теми', details: error.message });
  }
});

app.post('/api/topics/:topicId/messages', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { text, author, authorEmail, parentId, authorPicture } = req.body;
    if (!text || !author || !authorEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let messagesData, topicsData;
    try {
      messagesData = JSON.parse(await fs.readFile(messagesFilePath));
      topicsData = JSON.parse(await fs.readFile(topicsFilePath));
    } catch (error) {
      messagesData = { messages: [] };
      topicsData = { topics: [] };
    }

    const topic = topicsData.topics.find(t => t.id === parseInt(topicId));
    if (!topic) {
      return res.status(404).json({ error: 'Тему не знайдено' });
    }

    const newMessage = {
      id: Date.now(),
      text,
      author,
      authorEmail,
      authorPicture: authorPicture || 'assets/img/default-avatar.png',
      timestamp: new Date().toISOString(),
      likes: [],
      dislikes: [],
      love: [],
      laugh: [],
      wow: [],
      topicId: parseInt(topicId),
      parentId: parentId ? parseInt(parentId) : null
    };

    messagesData.messages.push(newMessage);
    if (!topic.messageIds.includes(newMessage.id)) {
      topic.messageIds.push(newMessage.id);
    }

    await fs.writeFile(messagesFilePath, JSON.stringify(messagesData, null, 2));
    await fs.writeFile(topicsFilePath, JSON.stringify(topicsData, null, 2));
    res.json(newMessage);
  } catch (error) {
    console.error('Error adding message to topic:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при додаванні повідомлення', details: error.message });
  }
});

app.delete('/api/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userEmail } = req.query;
    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required' });
    }

    let p2pMessagesData;
    try {
      p2pMessagesData = JSON.parse(await fs.readFile(p2pMessagesFilePath));
    } catch (error) {
      p2pMessagesData = { p2pMessages: [] };
    }

    const p2pMessageIndex = p2pMessagesData.p2pMessages.findIndex(m => m.id === parseInt(messageId));
    if (p2pMessageIndex !== -1) {
      if (p2pMessagesData.p2pMessages[p2pMessageIndex].senderEmail !== userEmail) {
        return res.status(403).json({ error: 'Немає прав для видалення цього повідомлення' });
      }
      p2pMessagesData.p2pMessages.splice(p2pMessageIndex, 1);
      await fs.writeFile(p2pMessagesFilePath, JSON.stringify(p2pMessagesData, null, 2));
      return res.json({ success: true });
    }

    let messagesData, topicsData;
    try {
      messagesData = JSON.parse(await fs.readFile(messagesFilePath));
      topicsData = JSON.parse(await fs.readFile(topicsFilePath));
    } catch (error) {
      messagesData = { messages: [] };
      topicsData = { topics: [] };
    }

    const message = messagesData.messages.find(m => m.id === parseInt(messageId));
    if (!message) {
      return res.status(404).json({ error: 'Повідомлення не знайдено' });
    }

    if (message.authorEmail !== userEmail) {
      return res.status(403).json({ error: 'Немає прав для видалення цього повідомлення' });
    }

    messagesData.messages = messagesData.messages.filter(
      m => m.id !== parseInt(messageId) && m.parentId !== parseInt(messageId)
    );

    const topic = topicsData.topics.find(t => t.messageIds.includes(parseInt(messageId)));
    if (topic) {
      topic.messageIds = topic.messageIds.filter(id => id !== parseInt(messageId));
    }

    await fs.writeFile(messagesFilePath, JSON.stringify(messagesData, null, 2));
    await fs.writeFile(topicsFilePath, JSON.stringify(topicsData, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при видаленні повідомлення', details: error.message });
  }
});

app.put('/api/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text, userEmail } = req.body;
    if (!text || !userEmail) {
      return res.status(400).json({ error: 'Missing text or userEmail' });
    }

    let messagesData;
    try {
      messagesData = JSON.parse(await fs.readFile(messagesFilePath));
    } catch (error) {
      messagesData = { messages: [] };
    }

    const message = messagesData.messages.find(m => m.id === parseInt(messageId));
    if (!message) {
      return res.status(404).json({ error: 'Повідомлення не знайдено' });
    }

    if (message.authorEmail !== userEmail) {
      return res.status(403).json({ error: 'Немає прав для редагування цього повідомлення' });
    }

    message.text = text;
    message.edited = true;
    message.editedAt = new Date().toISOString();

    await fs.writeFile(messagesFilePath, JSON.stringify(messagesData, null, 2));
    res.json(message);
  } catch (error) {
    console.error('Error editing message:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при редагуванні повідомлення', details: error.message });
  }
});

app.delete('/api/topics/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { userEmail } = req.query;
    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required' });
    }

    let topicsData, messagesData;
    try {
      topicsData = JSON.parse(await fs.readFile(topicsFilePath));
      messagesData = JSON.parse(await fs.readFile(messagesFilePath));
    } catch (error) {
      topicsData = { topics: [] };
      messagesData = { messages: [] };
    }

    const topic = topicsData.topics.find(t => t.id === parseInt(topicId));
    if (!topic) {
      return res.status(404).json({ error: 'Тему не знайдено' });
    }

    if (topic.authorEmail !== userEmail) {
      return res.status(403).json({ error: 'Немає прав для видалення цієї теми' });
    }

    topicsData.topics = topicsData.topics.filter(t => t.id !== parseInt(topicId));
    messagesData.messages = messagesData.messages.filter(m => m.topicId !== parseInt(topicId));

    await fs.writeFile(topicsFilePath, JSON.stringify(topicsData, null, 2));
    await fs.writeFile(messagesFilePath, JSON.stringify(messagesData, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting topic:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при видаленні теми', details: error.message });
  }
});

app.put('/api/topics/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { title, userEmail } = req.body;
    if (!title || !userEmail) {
      return res.status(400).json({ error: 'Missing title or userEmail' });
    }

    let topicsData;
    try {
      topicsData = JSON.parse(await fs.readFile(topicsFilePath));
    } catch (error) {
      topicsData = { topics: [] };
    }

    const topic = topicsData.topics.find(t => t.id === parseInt(topicId));
    if (!topic) {
      return res.status(404).json({ error: 'Тему не знайдено' });
    }

    if (topic.authorEmail !== userEmail) {
      return res.status(403).json({ error: 'Немає прав для редагування цієї теми' });
    }

    topic.title = title;
    topic.edited = true;
    topic.editedAt = new Date().toISOString();

    await fs.writeFile(topicsFilePath, JSON.stringify(topicsData, null, 2));
    res.json(topic);
  } catch (error) {
    console.error('Error editing topic:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при редагуванні теми', details: error.message });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    let projectsData;
    try {
      projectsData = JSON.parse(await fs.readFile(projectsFilePath));
    } catch (error) {
      projectsData = [];
    }
    res.json(projectsData);
  } catch (error) {
    console.error('Error fetching projects:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при читанні проєктів', details: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    console.log('POST /api/projects called with:', { body: req.body, user: req.user });
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const { title, description, theme, eventType, status, functionName, country, location, contact, image, author, authorEmail, coordinates } = req.body;
    if (!title || !description || !theme || !eventType || !status || !contact || !author || !authorEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['ONLINE', 'OFFLINE', 'BOTH'].includes(eventType)) {
      return res.status(400).json({ error: 'Invalid eventType: must be ONLINE, OFFLINE, or BOTH' });
    }

    if (!['Active', 'Planned', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status: must be Active, Planned, or Completed' });
    }

    if (eventType !== 'ONLINE' && (!country || !location || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2 || !coordinates.every(c => typeof c === 'number'))) {
      return res.status(400).json({ error: 'Country, location, and valid coordinates are required for OFFLINE or BOTH events' });
    }

    if (typeof authorEmail !== 'string' || !authorEmail.includes('@')) {
      return res.status(400).json({ error: 'Invalid authorEmail format' });
    }

    let projectsData;
    try {
      projectsData = JSON.parse(await fs.readFile(projectsFilePath));
    } catch (error) {
      console.warn('projects.json not found or invalid, initializing');
      projectsData = [];
    }

    const newProject = {
      id: Date.now(),
      title,
      description,
      theme,
      eventType,
      status,
      functionName: functionName || '',
      country: eventType === 'ONLINE' ? '' : country,
      location: eventType === 'ONLINE' ? '' : location,
      contact,
      image: image || 'https://via.placeholder.com/150',
      author,
      authorEmail,
      coordinates: eventType === 'ONLINE' ? [0, 0] : coordinates,
      createdAt: new Date().toISOString(),
      ratings: []
    };

    projectsData.unshift(newProject);
    await fs.writeFile(projectsFilePath, JSON.stringify(projectsData, null, 2));

    let ratingsData;
    try {
      ratingsData = JSON.parse(await fs.readFile(ratingsFilePath));
    } catch (error) {
      console.warn('ratings.json not found or invalid, initializing');
      ratingsData = {};
    }

    ratingsData[newProject.id] = {
      ratings: [],
      average: 0,
      count: 0
    };
    await fs.writeFile(ratingsFilePath, JSON.stringify(ratingsData, null, 2));

    res.json(newProject);
  } catch (error) {
    console.error('Error creating project:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

app.put('/api/projects/:projectId', async (req, res) => {
  try {
    console.log('PUT /api/projects/:projectId called with:', { params: req.params, body: req.body, user: req.user });
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const { projectId } = req.params;
    const { title, description, theme, eventType, status, functionName, country, location, contact, image, userEmail, coordinates, ratings } = req.body;
    if (!title || !description || !theme || !eventType || !status || !contact || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['ONLINE', 'OFFLINE', 'BOTH'].includes(eventType)) {
      return res.status(400).json({ error: 'Invalid eventType: must be ONLINE, OFFLINE, or BOTH' });
    }

    if (!['Active', 'Planned', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status: must be Active, Planned, or Completed' });
    }

    if (eventType !== 'ONLINE' && (!country || !location || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2 || !coordinates.every(c => typeof c === 'number'))) {
      return res.status(400).json({ error: 'Country, location, and valid coordinates are required for OFFLINE or BOTH events' });
    }

    let projectsData;
    try {
      projectsData = JSON.parse(await fs.readFile(projectsFilePath));
    } catch (error) {
      projectsData = [];
    }

    const project = projectsData.find(p => p.id === parseInt(projectId));
    if (!project) {
      return res.status(404).json({ error: 'Проєкт не знайдено' });
    }

    if (project.authorEmail !== userEmail) {
      return res.status(403).json({ error: 'Немає прав для редагування цього проєкту' });
    }

    project.title = title;
    project.description = description;
    project.theme = theme;
    project.eventType = eventType;
    project.status = status;
    project.functionName = functionName || '';
    project.country = eventType === 'ONLINE' ? '' : country;
    project.location = eventType === 'ONLINE' ? '' : location;
    project.contact = contact;
    project.image = image || project.image;
    project.coordinates = eventType === 'ONLINE' ? [0, 0] : coordinates;
    project.ratings = ratings || project.ratings;
    project.edited = true;
    project.editedAt = new Date().toISOString();

    await fs.writeFile(projectsFilePath, JSON.stringify(projectsData, null, 2));
    res.json(project);
  } catch (error) {
    console.error('Error editing project:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при редагуванні проєкту', details: error.message });
  }
});

app.delete('/api/projects/:projectId', async (req, res) => {
  try {
    console.log('DELETE /api/projects/:projectId called with:', { params: req.params, query: req.query, user: req.user });
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const { projectId } = req.params;
    const { userEmail } = req.query;
    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required' });
    }

    let projectsData;
    try {
      projectsData = JSON.parse(await fs.readFile(projectsFilePath));
    } catch (error) {
      projectsData = [];
    }

    const projectIndex = projectsData.findIndex(p => p.id === parseInt(projectId));
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Проєкт не знайдено' });
    }

    if (projectsData[projectIndex].authorEmail !== userEmail) {
      return res.status(403).json({ error: 'Немає прав для видалення цього проєкту' });
    }

    projectsData.splice(projectIndex, 1);
    await fs.writeFile(projectsFilePath, JSON.stringify(projectsData, null, 2));

    let ratingsData;
    try {
      ratingsData = JSON.parse(await fs.readFile(ratingsFilePath));
    } catch (error) {
      ratingsData = {};
    }

    if (ratingsData[projectId]) {
      delete ratingsData[projectId];
      await fs.writeFile(ratingsFilePath, JSON.stringify(ratingsData, null, 2));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при видаленні проєкту', details: error.message });
  }
});
app.get('/api/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: 'AIzaSyCoCnpkLP7MsSU1YnLjQs8tG_kTgaK3ks8'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error in geocoding:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при геокодуванні', details: error.message });
  }
});

// Rating Projects
app.get('/api/projects/:id/ratings', async (req, res) => {
  try {
    console.log('GET /api/projects/:id/ratings called with:', { params: req.params, user: req.user });
    const { id } = req.params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    let projectsData;
    try {
      projectsData = JSON.parse(await fs.readFile(projectsFilePath));
    } catch (error) {
      projectsData = [];
    }

    const project = projectsData.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let ratingsData;
    try {
      ratingsData = JSON.parse(await fs.readFile(ratingsFilePath));
    } catch (error) {
      ratingsData = {};
    }

    if (!ratingsData[projectId]) {
      ratingsData[projectId] = { ratings: [], average: 0, count: 0 };
      await fs.writeFile(ratingsFilePath, JSON.stringify(ratingsData, null, 2));
    }

    const projectRating = ratingsData[projectId];
    let userRating = null;
    if (req.isAuthenticated()) {
      const userRatingEntry = projectRating.ratings.find(r => r.userEmail === req.user.email);
      userRating = userRatingEntry ? userRatingEntry.rating : null;
    }

    res.json({
      ratings: project.ratings,
      average: projectRating.average,
      count: projectRating.count,
      userRating
    });
  } catch (error) {
    console.error('Error fetching ratings:', error.message, error.stack);
    res.status(500).json({ error: 'Error fetching ratings', details: error.message });
  }
});

app.post('/api/projects/:id/rate', async (req, res) => {
  try {
    console.log('POST /api/projects/:id/rate called:', {
      params: req.params,
      body: req.body,
      cookies: req.cookies,
      sessionID: req.sessionID,
      session: req.session,
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      userEmailComparison: {
        requestUserEmail: req.body.userEmail,
        authenticatedUserEmail: req.user ? req.user.email : null
      }
    });
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated. Please log in.' });
    }

    const { id } = req.params;
    const { rating, userEmail } = req.body;
    const projectId = parseInt(id, 10);
    const ratingNum = parseInt(rating, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    if (!rating || !userEmail) {
      console.error('Missing fields:', { rating, userEmail });
      return res.status(400).json({ error: 'Missing rating or userEmail' });
    }

    if (isNaN(ratingNum) || !Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    if (typeof userEmail !== 'string' || !userEmail) {
      console.error('Invalid userEmail format:', userEmail);
      return res.status(400).json({ error: 'Invalid userEmail format: must be a non-empty string' });
    }

    if (req.user.email !== userEmail) {
      console.error('User email mismatch:', { requestEmail: userEmail, authenticatedEmail: req.user.email });
      return res.status(403).json({ error: 'Unauthorized: userEmail does not match authenticated user' });
    }

    let projectsData;
    try {
      projectsData = JSON.parse(await fs.readFile(projectsFilePath));
    } catch (error) {
      console.error('Error reading projects.json:', error.message);
      projectsData = [];
    }

    const project = projectsData.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let ratingsData;
    try {
      ratingsData = JSON.parse(await fs.readFile(ratingsFilePath));
    } catch (error) {
      console.warn('ratings.json not found or invalid, initializing');
      ratingsData = {};
    }

    if (!ratingsData[projectId]) {
      ratingsData[projectId] = { ratings: [], average: 0, count: 0 };
    }

    const projectRating = ratingsData[projectId];
    const existingRating = projectRating.ratings.find(r => r.userEmail === userEmail);
    if (existingRating) {
      existingRating.rating = ratingNum;
      existingRating.timestamp = new Date().toISOString();
    } else {
      const newRating = {
        userEmail,
        rating: ratingNum,
        timestamp: new Date().toISOString()
      };
      projectRating.ratings.push(newRating);
      projectRating.count += 1;
    }

    projectRating.average = projectRating.ratings.length > 0
      ? projectRating.ratings.reduce((sum, r) => sum + r.rating, 0) / projectRating.ratings.length
      : 0;

    // Update project ratings in projects.json
    project.ratings = projectRating.ratings;

    await fs.writeFile(ratingsFilePath, JSON.stringify(ratingsData, null, 2));
    await fs.writeFile(projectsFilePath, JSON.stringify(projectsData, null, 2));
    console.log('Rating saved:', { projectId, userEmail, rating: ratingNum });
    res.json({ success: true, rating: { userEmail, rating: ratingNum, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('Error adding rating:', error.message, error.stack);
    res.status(500).json({ error: 'Error adding rating', details: error.message });
  }
});
// API for P2P (Personal Chats)
app.get('/api/users', async (req, res) => {
  try {
    let usersData;
    try {
      usersData = JSON.parse(await fs.readFile(usersFilePath));
    } catch (error) {
      usersData = { Users: {} };
    }

    const users = Object.values(usersData.Users).map(user => ({
      email: user.email,
      name: user.name,
      picture: user.picture
    }));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при читанні користувачів', details: error.message });
  }
});

app.get('/api/messages/p2p', async (req, res) => {
  try {
    const { senderEmail, recipientEmail } = req.query;
    if (!senderEmail || !recipientEmail) {
      return res.status(400).json({ error: 'senderEmail and recipientEmail are required' });
    }

    let p2pMessagesData;
    try {
      p2pMessagesData = JSON.parse(await fs.readFile(p2pMessagesFilePath));
    } catch (error) {
      p2pMessagesData = { p2pMessages: [] };
    }

    const p2pMessages = p2pMessagesData.p2pMessages.filter(
      m =>
        (m.senderEmail === senderEmail && m.recipientEmail === recipientEmail) ||
        (m.senderEmail === recipientEmail && m.recipientEmail === senderEmail)
    );
    res.json(p2pMessages);
  } catch (error) {
    console.error('Error fetching P2P messages:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при читанні повідомлень', details: error.message });
  }
});

app.post('/api/messages/p2p', async (req, res) => {
  try {
    console.log('Received P2P message request:', req.body);
    const { text, senderEmail, recipientEmail, senderName, senderPicture } = req.body;
    if (!text || !senderEmail || !recipientEmail || !senderName) {
      return res.status(400).json({ error: 'text, senderEmail, recipientEmail, and senderName are required' });
    }

    let p2pMessagesData;
    try {
      p2pMessagesData = JSON.parse(await fs.readFile(p2pMessagesFilePath));
    } catch (error) {
      p2pMessagesData = { p2pMessages: [] };
    }

    const newMessage = {
      id: Date.now(),
      text,
      senderEmail,
      recipientEmail,
      senderName,
      senderPicture: senderPicture || 'assets/img/default-avatar.png',
      timestamp: new Date().toISOString()
    };

    p2pMessagesData.p2pMessages.push(newMessage);
    await fs.writeFile(p2pMessagesFilePath, JSON.stringify(p2pMessagesData, null, 2));
    res.json(newMessage);
  } catch (error) {
    console.error('Error adding P2P message:', error.message, error.stack);
    res.status(500).json({ error: 'Помилка при додаванні повідомлення', details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});