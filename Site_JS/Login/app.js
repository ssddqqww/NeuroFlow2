const express = require('express');
const axios = require('axios');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

// Додаємо middleware
app.use(cors());
app.use(express.json());

// Шлях до файлу з повідомленнями
const messagesFilePath = path.join(__dirname, '../base_date/messages.json');

// Настройка сессий
app.use(session({
    secret: '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',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // в продакшені має бути true
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 години
    }
}));

// Инициализация Passport
app.use(passport.initialize());
app.use(passport.session());

// Настройка стратегии Google OAuth 2.0
const usersFilePath = path.join(__dirname, '../base_date/users.json');

passport.use(new GoogleStrategy({
    clientID: "449301712934-otg87n2g8ue800t9lmt2f095d3okfqlr.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        const usersData = JSON.parse(fs.readFileSync(usersFilePath));
        const userEmail = req.query.email || profile.emails[0].value;
        // console.log(profile);
        // Проверяем существование пользователя
        if (!usersData.Users[userEmail]) {
            // Регистрация нового пользователя
            const userData = {
                email: userEmail,
                name: profile.displayName,
                picture: profile.photos[0].value,
                registrationDate: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            usersData.Users[userEmail] = userData;
            fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2));
            return done(null, { ...userData, isNewUser: true });
        } else {
            // Обновление времени входа для существующего пользователя
            usersData.Users[userEmail].lastLogin = new Date().toISOString();
            fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2));
            return done(null, { ...usersData.Users[userEmail], isNewUser: false });
        }
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Подаём статические файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Настройка CSP
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", 
        "default-src 'self'; " +                    // Разрешаем ресурсы только с текущего домена
        "script-src 'self' 'unsafe-inline'; " +     // Разрешаем скрипты с 'self' и встроенные скрипты
        "style-src 'self' 'unsafe-inline'; " +      // Разрешаем стили с 'self' и встроенные стили
        "img-src 'self' http://localhost:3000; " +  // Разрешаем изображения с 'self' и localhost:3000
        "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com;" // Разрешаем подключения к Google API
    );
    next();
});

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
    passport.authenticate('google', (err, user, info) => {
        if (err) return res.redirect('/login');
        if (!user) return res.redirect('/login');
        
        req.logIn(user, (err) => {
            if (err) return next(err);
            
            res.cookie('userEmail', user.email, {
                maxAge: 24 * 60 * 60 * 1000,
                httpOnly: false
            });
            res.cookie('userName', user.name, {
                maxAge: 24 * 60 * 60 * 1000,
                httpOnly: false
            });
            
            res.redirect('http://localhost:63343/NeuroFlow/Site_JS/Lypenko/forum.html?_ijt=6maboi3b9j1nq6mrvjhrmft1eu&_ij_reload=RELOAD_ON_SAVE');
        });
    })(req, res, next);
});

app.get('/api/messages', (req, res) => {
    try {
        const messagesData = JSON.parse(fs.readFileSync(messagesFilePath));
        res.json(messagesData.messages);
    } catch (error) {
        res.status(500).json({ error: 'Помилка при читанні повідомлень' });
    }
});

app.post('/api/messages', (req, res) => {
    try {
        const { text, author, authorEmail } = req.body;
        const messagesData = JSON.parse(fs.readFileSync(messagesFilePath));
        
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
        fs.writeFileSync(messagesFilePath, JSON.stringify(messagesData, null, 2));
        
        res.json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Помилка при додаванні повідомлення' });
    }
});

app.post('/api/messages/:messageId/reaction', (req, res) => {
    try {
        const { messageId } = req.params;
        const { type, userEmail } = req.body; // type може бути 'like' або 'dislike'
        
        const messagesData = JSON.parse(fs.readFileSync(messagesFilePath));
        const message = messagesData.messages.find(m => m.id === parseInt(messageId));
        
        if (!message) {
            return res.status(404).json({ error: 'Повідомлення не знайдено' });
        }

        // Видаляємо попередні реакції користувача
        message.likes = message.likes.filter(email => email !== userEmail);
        message.dislikes = message.dislikes.filter(email => email !== userEmail);

        // Додаємо нову реакцію
        if (type === 'like') {
            message.likes.push(userEmail);
        } else if (type === 'dislike') {
            message.dislikes.push(userEmail);
        }

        fs.writeFileSync(messagesFilePath, JSON.stringify(messagesData, null, 2));
        res.json({ likes: message.likes.length, dislikes: message.dislikes.length });
    } catch (error) {
        res.status(500).json({ error: 'Помилка при обробці реакції' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});