const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3035;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Путь к файлам
const categoriesFile = path.join(__dirname, 'categ.json');
const appsFile = path.join(__dirname, 'app.json');
const projectsDir = path.join(__dirname, 'projects');
const userActionsFile = path.join(__dirname, 'user_actions.json');

// Инициализация файлов и директорий
async function initFiles() {
    try {
        await fs.access(categoriesFile);
    } catch {
        await fs.writeFile(categoriesFile, JSON.stringify(['Здоровье', 'Образование']));
    }
    try {
        await fs.access(appsFile);
    } catch {
        await fs.writeFile(appsFile, JSON.stringify([
            { 
                id: 1, 
                name: 'Фитнес', 
                category: 'Здоровье', 
                likes: 10, 
                dislikes: 2, 
                reviews: [
                    { 
                        id: 1, 
                        text: 'Отличное приложение!', 
                        likes: 2, 
                        dislikes: 0, 
                        replies: [] 
                    }
                ] 
            },
            { 
                id: 2, 
                name: 'Уроки', 
                category: 'Образование', 
                likes: 15, 
                dislikes: 1, 
                reviews: [
                    { 
                        id: 2, 
                        text: 'Очень полезно', 
                        likes: 3, 
                        dislikes: 0, 
                        replies: [] 
                    }
                ] 
            }
        ]));
    }
    try {
        await fs.access(userActionsFile);
    } catch {
        await fs.writeFile(userActionsFile, JSON.stringify({
            likes: {},
            dislikes: {},
            reviews: {},
            review_likes: {},
            review_dislikes: {},
            replies: {},
            show_reviews: {}
        }, null, 2));
    }
    // Создаем директорию для проектов, если она не существует
    try {
        await fs.access(projectsDir);
    } catch {
        await fs.mkdir(projectsDir);
    }
}
initFiles();

// Получение категорий
app.get('/categories', async (req, res) => {
    try {
        const categories = await fs.readFile(categoriesFile, 'utf8');
        res.json(JSON.parse(categories));
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Добавление категории
app.post('/categories', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, error: 'Название категории обязательно' });
        }
        const categories = JSON.parse(await fs.readFile(categoriesFile, 'utf8'));
        if (categories.includes(name)) {
            return res.status(400).json({ success: false, error: 'Категория уже существует' });
        }
        categories.push(name);
        await fs.writeFile(categoriesFile, JSON.stringify(categories, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Получение приложений
app.get('/apps', async (req, res) => {
    try {
        const apps = await fs.readFile(appsFile, 'utf8');
        res.json(JSON.parse(apps));
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Сохранение приложений
app.post('/apps', async (req, res) => {
    try {
        const apps = req.body;
        await fs.writeFile(appsFile, JSON.stringify(apps, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Получение действий пользователя
app.get('/user-actions', async (req, res) => {
    try {
        const data = await fs.readFile(userActionsFile, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Сохранение действий пользователя
app.post('/user-actions', async (req, res) => {
    try {
        await fs.writeFile(userActionsFile, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Сохранение проекта
app.post('/save-project', async (req, res) => {
    try {
        const { name, category, html, css, js } = req.body;
        
        // Создаем директорию для проекта
        const projectDir = path.join(projectsDir, name);
        await fs.mkdir(projectDir, { recursive: true });

        // Сохраняем файлы проекта
        await fs.writeFile(path.join(projectDir, 'index.html'), html);
        await fs.writeFile(path.join(projectDir, 'styles.css'), css);
        await fs.writeFile(path.join(projectDir, 'script.js'), js);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
