from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from g4f.client import Client
import json
import asyncio

app = Flask(__name__)
CORS(app)

client = Client()

# Настройки для оптимизации скорости
CHUNK_SIZE = 5  # Уменьшаем размер чанка для более быстрой передачи
MAX_TOKENS = 100  # Уменьшаем максимальное количество токенов
TEMPERATURE = 0.7
REQUEST_TIMEOUT = 10  # Таймаут для запроса в секундах

# Языковые инструкции
LANGUAGE_INSTRUCTIONS = {
    'en': "You MUST respond in English only. Do not use Russian or any other language. Use the search results if provided to give more accurate answers.",
    'ru': "Вы ОБЯЗАТЕЛЬНО должны отвечать только на русском языке. Не используйте английский или другие языки. Используйте результаты поиска, если они предоставлены, для более точных ответов."
}

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        language = data.get('language', 'ru')  # Получаем язык из запроса
        search_results = data.get('searchResults', '')
        
        # Добавляем языковые инструкции и результаты поиска в промпт
        language_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS['ru'])
        if search_results:
            prompt = f"{language_instruction}\n\n{prompt}\n\nДополнительная информация из интернета:{search_results}"
        else:
            prompt = f"{language_instruction}\n\n{prompt}"
        
        def generate_stream():
            try:
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
                    timeout=REQUEST_TIMEOUT  # Добавляем таймаут
                )
                
                buffer = ""
                for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content:
                        buffer += chunk.choices[0].delta.content
                        if len(buffer) >= CHUNK_SIZE:
                            yield f"data: {json.dumps({'output': buffer})}\n\n"
                            buffer = ""
                
                if buffer:  # Отправляем оставшийся текст
                    yield f"data: {json.dumps({'output': buffer})}\n\n"
                    
            except Exception as e:
                print(f"Ошибка при генерации ответа: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
        return Response(stream_with_context(generate_stream()), mimetype='text/event-stream')
            
    except Exception as e:
        print(f"Ошибка при обработке запроса: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=3427, threaded=True)
