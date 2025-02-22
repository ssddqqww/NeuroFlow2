from ollama import chat

response = chat(
    model='deepseek-coder:6.7b',
    messages=[{
        'role': 'user',
        'content': 'Кто ты такой?'
    }],
    stream=True  # Включаем потоковый режим
)

full_response = []
for chunk in response:
    part = chunk.get('message', {}).get('content', '')
    if part:
        print(part, end='', flush=True)  # Выводим по частям без переноса строки
        full_response.append(part)

# Для сохранения полного ответа в переменной
final_answer = ''.join(full_response)   


