function sayHello() {
    alert("Hello!");
}
function aosInit() {
  AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: false, // Изменено на false для многократного воспроизведения
      mirror: false
  });
}
function toggleBlocks(buttonId) {
    // Создаем массив с секциями
    alert("Hello");
    const sections_block = [
        document.getElementById('features'),
        document.getElementById('features-cards'),
        document.getElementById('services'),
        document.getElementById('clients'),
        document.getElementById('faq'),
        document.getElementById('stats'),
        document.getElementById('about'),
        document.getElementById('features_one'),
        document.getElementById('features_cards_two'),
        document.getElementById('call-to-action'),
        document.getElementById('topics-container'),
        document.getElementById('forum-container'),
        document.getElementById('top-messages-container'),
        document.getElementById('news')

    ];
    const sections_link = [
      document.getElementById('home_func'),
      document.getElementById('about_func'),
      document.getElementById('features_func'),
      document.getElementById('top_func'),
      document.getElementById('topics_container_func'),
      document.getElementById('news_func'),
      document.getElementById('download_func')
    ];
   const sections_home = [
      document.getElementById('features'),
      document.getElementById('features-cards'),
      document.getElementById('services'),
      document.getElementById('clients'),
      document.getElementById('faq'),
      document.getElementById('stats'),
    ];
    if (buttonId === 'home_func') {
        // Показываем все секции, кроме about
        sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));

        // Скрываем about
        sections_home.forEach(sections_home => sections_home.classList.remove('hidden_all_h'));

        sections_link.forEach(sections_link => sections_link.classList.remove('active'));
        sections_link[0].classList.add('active');
    } if (buttonId === 'about_func') {
      // Скрываем все секции
      sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));

      // Показываем только about
      document.getElementById('about').classList.remove('hidden_all_h');

      sections_link.forEach(sections_link => sections_link.classList.remove('active'));
      sections_link[1].classList.add('active');
    } if (buttonId === 'features_func') {
      // Скрываем все секции
      sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));

      // Показываем только about
      document.getElementById('features_one').classList.remove('hidden_all_h');
      document.getElementById('features_cards_two').classList.remove('hidden_all_h');

      sections_link.forEach(sections_link => sections_link.classList.remove('active'));
      sections_link[2].classList.add('active');
    }  if (buttonId === 'top_func') {
 // Скрываем все секции
      sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));

      // Показываем только топикс
      document.getElementById('top-messages-container').classList.remove('hidden_all_h');

      sections_link.forEach(sections_link => sections_link.classList.remove('active'));
      sections_link[3].classList.add('active');
    }if (buttonId === 'topics_container_func') {
      // Скрываем все секции
      sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));

      // Показываем только топикс
      document.getElementById('topics-container').classList.remove('hidden_all_h');
      document.getElementById('forum-container').classList.remove('hidden_all_h');

      sections_link.forEach(sections_link => sections_link.classList.remove('active'));
      sections_link[4].classList.add('active');
    } if (buttonId === 'news_func') {
      // Скрываем все секции
      sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));

      // Показываем только about
      document.getElementById('news').classList.remove('hidden_all_h');

      sections_link.forEach(sections_link => sections_link.classList.remove('active'));
      sections_link[5].classList.add('active');
    } if (buttonId === 'download_func') {
      // Скрываем все секции
      sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));

      // Показываем только about
      document.getElementById('call-to-action').classList.remove('hidden_all_h');

      sections_link.forEach(sections_link => sections_link.classList.remove('active'));
      sections_link[6].classList.add('active');
  }
  
    // Пересчет AOS после изменения видимости
    setTimeout(() => {
      AOS.refresh();
    }, 50)

    console.log('Нажата кнопка с id: ' + buttonId);
}


/*Text hover*/
// Функция для преобразования текста в spans
function convertTextToSpans(element) {
  const text = element.textContent;
  element.innerHTML = ''; // Очищаем содержимое
  element.classList.remove('text_hov'); // Убираем старый класс
  element.classList.add('wave-text');   // Добавляем новый класс

  // Разбиваем текст на символы и оборачиваем в span
  text.split('').forEach(char => {
      const span = document.createElement('span');
      span.textContent = char;
      element.appendChild(span);
  });
}

// Находим все элементы с классом text_hov
const textHovElements = document.querySelectorAll('.text_hov');
textHovElements.forEach(element => {
  convertTextToSpans(element); // Преобразуем текст

  let timeoutId;
  element.addEventListener('mouseenter', function() {
      clearTimeout(timeoutId);
      this.classList.add('active');
  });
  element.addEventListener('mouseleave', function() {
      timeoutId = setTimeout(() => {
          this.classList.remove('active');
      }, 100); // Задержка 0.5 секунды
  });

// Вызов aosInit при загрузке (если это нужно в my.js)
window.addEventListener('load', aosInit);
