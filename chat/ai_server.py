from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from g4f.client import Client
import json
import asyncio
import os
from openai import OpenAI

app = Flask(__name__)
# Настраиваем CORS для всех маршрутов
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5421", "http://127.0.0.1:5421"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

client = Client()

# Настройки для оптимизации скорости
CHUNK_SIZE = 5
MAX_TOKENS = 1000  # Увеличиваем для более длинных пересказов
TEMPERATURE = 0.7
REQUEST_TIMEOUT = 30  # Увеличиваем таймаут для длинных пересказов

PORT = 5432  # Изменяем порт на 5432

@app.route('/gen', methods=['POST', 'OPTIONS'])
def generate():
    if request.method == 'OPTIONS':
        # Обработка preflight запроса
        response = Response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response

    try:
        data = request.json
        prompt = data.get('prompt', '')
        language = data.get('language', 'ru')
        
        def generate_stream():
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{
                        "role": "user", 
                        "content": f"You are the assistant for retelling the content of the chat. Your task is to briefly and informatively retell the main topics and events from the chat messages.\n\n{prompt}"
                    }],
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
                    
            except Exception as e:
                print(f"Ошибка при генерации ответа: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
        response = Response(stream_with_context(generate_stream()), mimetype='text/event-stream')
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
            
    except Exception as e:
        print(f"Ошибка при обработке запроса: {str(e)}")
        response = jsonify({"error": str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

if __name__ == '__main__':
    app.run(port=PORT, threaded=True, host='0.0.0.0') 
