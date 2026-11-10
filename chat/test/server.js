const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Создаем WebSocket сервер
const wss = new WebSocket.Server({ port: 8080 });

// Обработка подключений
wss.on('connection', function connection(ws) {
    console.log('Новое подключение установлено');

    // Обработка сообщений
    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'saveUsername') {
                // Сохраняем имя пользователя в файл
                const username = data.username;
                const filePath = path.join(__dirname, 'username.txt');
                
                fs.writeFile(filePath, username, 'utf8', (err) => {
                    if (err) {
                        console.error('Ошибка при сохранении файла:', err);
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Ошибка при сохранении имени'
                        }));
                    } else {
                        console.log('Имя успешно сохранено:', username);
                        ws.send(JSON.stringify({
                            type: 'success',
                            message: 'Имя успешно сохранено'
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка при обработке сообщения:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Ошибка при обработке запроса'
            }));
        }
    });

    // Обработка отключения
    ws.on('close', function() {
        console.log('Клиент отключился');
    });
});

console.log('WebSocket сервер запущен на порту 8080'); 