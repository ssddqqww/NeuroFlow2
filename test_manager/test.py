from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from g4f.client import Client
import json
import time
import os
import asyncio  # Добавляем импорт asyncio
from dotenv import load_dotenv
import aiohttp

app = Flask(__name__)
# Разрешаем запросы только с https://neuroflow.world
CORS(app, resources={r"/generate": {"origins": "../index.html"}})

# Загружаем переменные окружения
load_dotenv()
SERPER_API_KEY = os.getenv('SERPER_API_KEY')

client = Client()

# Настройки для оптимизации скорости
CHUNK_SIZE = 5
MAX_TOKENS = 3000
TEMPERATURE = 0.7
REQUEST_TIMEOUT = 10
SEARCH_CACHE = {}
CACHE_EXPIRY = 24 * 60 * 60  # 24 часа в секундах

# Языковые инструкции
LANGUAGE_INSTRUCTIONS = {
    'en': "You MUST respond in English only. Do not use Russian or any other language. Use the search results if provided to give more accurate answers.",
    'ru': "Вы ОБЯЗАТЕЛЬНО должны отвечать только на русском языке. Не используйте английский или другие языки. Используйте результаты поиска, если они предоставлены, для более точных ответов."
}

async def search_web(query):
    try:
        # Проверяем кэш
        if query in SEARCH_CACHE:
            cached = SEARCH_CACHE[query]
            if time.time() - cached['timestamp'] < CACHE_EXPIRY:
                print('Используем кэшированный результат')
                return cached['data']

        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://google.serper.dev/search',
                headers={
                    'X-API-KEY': SERPER_API_KEY,
                    'Content-Type': 'application/json'
                },
                json={
                    'q': query,
                    'num': 5
                }
            ) as response:
                data = await response.json()
                
                # Сохраняем в кэш
                SEARCH_CACHE[query] = {
                    'data': data,
                    'timestamp': time.time()
                }
                
                return data
    except Exception as e:
        print(f'Ошибка поиска: {str(e)}')
        return None

def clean_cache():
    now = time.time()
    keys_to_delete = [key for key, value in SEARCH_CACHE.items() if now - value['timestamp'] > CACHE_EXPIRY]
    for key in keys_to_delete:
        del SEARCH_CACHE[key]

# Очищаем кэш каждые 30 минут
from threading import Timer
def schedule_cache_clean():
    clean_cache()
    Timer(30 * 60, schedule_cache_clean).start()
schedule_cache_clean()

@app.route('/generate', methods=['POST', 'OPTIONS'])
def generate():
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '../index.html'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    try:
        data = request.json
        prompt = data.get('prompt', '')
        language = data.get('language', 'ru')
        message = data.get('message', '')
        
        # Проверяем, нужен ли поиск
        needs_search = any(keyword in message.lower() for keyword in ["что", "как", "когда", "где", "почему", "what", "how", "when", "where", "why"])
        search_results = ""
        
        if needs_search:
            # Выполняем поиск асинхронно
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            search_data = loop.run_until_complete(search_web(message))
            loop.close()
            
            if search_data and search_data.get('organic'):
                search_results = "\n\nНайденная информация:\n" + \
                    "\n".join(f"- {result['title']}: {result['snippet']}" for result in search_data['organic'][:3])
        
        # Добавляем языковые инструкции и результаты поиска в промпт
        language_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS['ru'])
        if search_results:
            prompt = f"{language_instruction}\n\n{prompt}\n\nДополнительная информация из интернета:{search_results}"
        else:
            prompt = f"{language_instruction}\n\n{prompt}"
        
        print(f"Получен запрос с prompt: {prompt}, язык: {language}")
        
        def generate_stream():
            try:
                start_time = time.time()
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    web_search=False,
                    stream=True,
                    max_tokens=MAX_TOKENS,
                    temperature=TEMPERATURE,
                    presence_penalty=0.6,
                    frequency_penalty=0.3,
                    top_p=0.9,
                    timeout=REQUEST_TIMEOUT
                )
                
                buffer = ""
                for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content:
                        buffer += chunk.choices[0].delta.content
                        if len(buffer) >= CHUNK_SIZE:
                            yield f"data: {json.dumps({'output': buffer})}\n\n"
                            buffer = ""
                
                if buffer:
                    yield f"data: {json.dumps({'output': buffer})}\n\n"
                yield "data: [DONE]\n\n"
                
                print(f"Ответ отправлен за {time.time() - start_time:.2f} секунд")
                
            except Exception as e:
                print(f"Ошибка при генерации ответа за {time.time() - start_time:.2f} секунд: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
        return Response(
            stream_with_context(generate_stream()),
            mimetype='text/event-stream',
            headers={
                'Access-Control-Allow-Origin': '../index.html',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        )
            
    except Exception as e:
        print(f"Ошибка при обработке запроса: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3427, threaded=True)
