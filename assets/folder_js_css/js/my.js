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
     window.location.href = '../../../projects/';
    return;
  } else if (buttonId === 'about_func') {
    //asdfgasdfasdfasdfasdf
    //asdfgasdfasdfasdfasdf
    //asdfgasdfasdfasdfasdf
    console.log('work');
    sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));
    document.getElementById('about').classList.remove('hidden_all_h');
    sections_link.forEach(sections_link => sections_link.classList.remove('active'));
    sections_link[1].classList.add('active');
  } else if (buttonId === 'features_func') {
    window.location.href = '../../../aplication/';
    return; // Exit function after redirect
  } else if (buttonId === 'top_func') {
     window.location.href = '../../../projects/top_projects.html';
    return;
  } else if (buttonId === 'topics_container_func') {
    window.location.href = '../../../chat/';
    return;
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

function handleUrlSection() {
  const urlParams = new URLSearchParams(window.location.search);
  const section = urlParams.get('section');
  
  const validSections = {
    'home': 'home_func',
    'about': 'about_func',
    'top': 'top_func',
    'features': 'features_func',
    'chat': 'topics_container_func',
    'news': 'news_func',
    'download': 'download_func'
  };

  if (section && validSections[section]) {
    toggleBlocks(validSections[section]);
  }
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

window.addEventListener('load', () => {
  aosInit();
  handleUrlSection();
});
