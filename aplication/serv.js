const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const app = express();

// Разрешаем запросы с http://127.0.0.1:5500
app.use(cors({
    origin: 'http://127.0.0.1:5500'
}));
app.use(express.json());
app.use(express.static('.')); // Для отдачи index.html и script.js

// Публикация проекта
app.post('/publish', async (req, res) => {
    try {
        const { name, category, html, css, js } = req.body;
        if (!name || !category) {
            return res.status(400).json({ error: 'Название и категория обязательны' });
        }

        const dir = path.join(__dirname, 'projects', name);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, 'index.html'), html);
        await fs.writeFile(path.join(dir, 'style.css'), css);
        await fs.writeFile(path.join(dir, 'script.js'), js);
        // Сохраняем категорию в мета-файл
        await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify({ category }));

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение списка проектов
app.get('/projects', async (req, res) => {
    try {
        const projectsDir = path.join(__dirname, 'projects');
        const dirs = await fs.readdir(projectsDir, { withFileTypes: true });
        const projects = [];

        for (const dir of dirs) {
            if (dir.isDirectory()) {
                const projectDir = path.join(projectsDir, dir.name);
                const html = await fs.readFile(path.join(projectDir, 'index.html'), 'utf8').catch(() => '');
                const css = await fs.readFile(path.join(projectDir, 'style.css'), 'utf8').catch(() => '');
                const js = await fs.readFile(path.join(projectDir, 'script.js'), 'utf8').catch(() => '');
                const meta = await fs.readFile(path.join(projectDir, 'meta.json'), 'utf8').catch(() => '{}');
                const { category = 'Default' } = JSON.parse(meta);
                projects.push({
                    name: dir.name,
                    category,
                    html,
                    css,
                    js
                });
            }
        }

        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));