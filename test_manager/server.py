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

from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from g4f.client import Client
import json
import time
import os
import asyncio
from dotenv import load_dotenv
import aiohttp

app = Flask(__name__)
# Allow requests only from https://neuroflow.world
CORS(app, resources={r"/generate": {"origins": "../index.html"}})

# Load environment variables
load_dotenv()
SERPER_API_KEY = os.getenv('SERPER_API_KEY')

client = Client()

# Settings for optimizing speed
CHUNK_SIZE = 5
MAX_TOKENS = 3000
TEMPERATURE = 0.7
REQUEST_TIMEOUT = 10
SEARCH_CACHE = {}
CACHE_EXPIRY = 24 * 60 * 60  # 24 hours in seconds

# Language instruction
LANGUAGE_INSTRUCTION = "You MUST respond in English only. Use the search results if provided to give more accurate answers."

async def search_web(query):
    try:
        # Check cache
        if query in SEARCH_CACHE:
            cached = SEARCH_CACHE[query]
            if time.time() - cached['timestamp'] < CACHE_EXPIRY:
                print('Using cached result')
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
                
                # Save to cache
                SEARCH_CACHE[query] = {
                    'data': data,
                    'timestamp': time.time()
                }
                
                return data
    except Exception as e:
        print(f'Search error: {str(e)}')
        return None

def clean_cache():
    now = time.time()
    keys_to_delete = [key for key, value in SEARCH_CACHE.items() if now - value['timestamp'] > CACHE_EXPIRY]
    for key in keys_to_delete:
        del SEARCH_CACHE[key]

# Clean cache every 30 minutes
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
        message = data.get('message', '')
        
        # Check if search is needed
        needs_search = any(keyword in message.lower() for keyword in ["what", "how", "when", "where", "why"])
        search_results = ""
        
        if needs_search:
            # Perform search asynchronously
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            search_data = loop.run_until_complete(search_web(message))
            loop.close()
            
            if search_data and search_data.get('organic'):
                search_results = "\n\nFound information:\n" + \
                    "\n".join(f"- {result['title']}: {result['snippet']}" for result in search_data['organic'][:3])
        
        # Add language instruction and search results to prompt
        if search_results:
            prompt = f"{LANGUAGE_INSTRUCTION}\n\n{prompt}\n\nAdditional information from the web:{search_results}"
        else:
            prompt = f"{LANGUAGE_INSTRUCTION}\n\n{prompt}"
        
        print(f"Received request with prompt: {prompt}")
        
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
                
                print(f"Response sent in {time.time() - start_time:.2f} seconds")
                
            except Exception as e:
                print(f"Error generating response in {time.time() - start_time:.2f} seconds: {str(e)}")
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
        print(f"Error processing request: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3427, threaded=True)
