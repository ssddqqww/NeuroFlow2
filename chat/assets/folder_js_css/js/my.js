function aosInit() {
  AOS.init({
    duration: 600,
    easing: 'ease-in-out',
    once: false,
    mirror: false
  });
}

function toggleBlocks(buttonId) {
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
    alert("10000")
    sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));
    sections_home.forEach(sections_home => sections_home.classList.remove('hidden_all_h'));
    sections_link.forEach(sections_link => sections_link.classList.remove('active'));
    sections_link[0].classList.add('active');
  } else if (buttonId === 'about_func') {
    alert("12222")
    sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));
    document.getElementById('about').classList.remove('hidden_all_h');
    sections_link.forEach(sections_link => sections_link.classList.remove('active'));
    sections_link[1].classList.add('active');
  } else if (buttonId === 'features_func') {
    sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));
    document.getElementById('features_one').classList.remove('hidden_all_h');
    document.getElementById('features_cards_two').classList.remove('hidden_all_h');
    sections_link.forEach(sections_link => sections_link.classList.remove('active'));
    sections_link[2].classList.add('active');
  } else if (buttonId === 'top_func') {
    sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));
    document.getElementById('top-messages-container').classList.remove('hidden_all_h');
    sections_link.forEach(sections_link => sections_link.classList.remove('active'));
    sections_link[3].classList.add('active');
  } else if (buttonId === 'topics_container_func') {
    sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));
    document.getElementById('topics-container').classList.remove('hidden_all_h');
    document.getElementById('forum-container').classList.add('hidden_all_h');
    sections_link.forEach(sections_link => sections_link.classList.remove('active'));
    sections_link[4].classList.add('active');
  } else if (buttonId === 'news_func') {
    sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));
    document.getElementById('news').classList.remove('hidden_all_h');
    sections_link.forEach(sections_link => sections_link.classList.remove('active'));
    sections_link[5].classList.add('active');
  } else if (buttonId === 'download_func') {
    sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));
    document.getElementById('call-to-action').classList.remove('hidden_all_h');
    sections_link.forEach(sections_link => sections_link.classList.remove('active'));
    sections_link[6].classList.add('active');
  }

  setTimeout(() => {
    AOS.refresh();
  }, 50);

  console.log('Нажата кнопка с id: ' + buttonId);
}

function convertTextToSpans(element) {
  const text = element.textContent;
  element.innerHTML = '';
  element.classList.remove('text_hov');
  element.classList.add('wave-text');

  text.split('').forEach(char => {
    const span = document.createElement('span');
    span.textContent = char;
    element.appendChild(span);
  });
}

const textHovElements = document.querySelectorAll('.text_hov');
textHovElements.forEach(element => {
  convertTextToSpans(element);
  let timeoutId;
  element.addEventListener('mouseenter', function() {
    clearTimeout(timeoutId);
    this.classList.add('active');
  });
  element.addEventListener('mouseleave', function() {
    timeoutId = setTimeout(() => {
      this.classList.remove('active');
    }, 100);
  });
});

window.addEventListener('load', aosInit);
