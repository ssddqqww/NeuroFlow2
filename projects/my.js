
function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: false,
      mirror: false
    });
  }
  
  function toggleBlocks(buttonId) {
    // Р•СЃР»Рё РЅР°Р¶Р°С‚Р° РєРЅРѕРїРєР° Features, РѕСЃС‚Р°РІР»СЏРµРј С‚РµРєСѓС‰РµРµ РїРѕРІРµРґРµРЅРёРµ
    if (buttonId === 'features_func') {
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

        sections_block.forEach(sections_block => sections_block.classList.add('hidden_all_h'));
        document.getElementById('features_one').classList.remove('hidden_all_h');
        document.getElementById('features_cards_two').classList.remove('hidden_all_h');
        sections_link.forEach(sections_link => sections_link.classList.remove('active'));
        sections_link[2].classList.add('active');

        setTimeout(() => {
            AOS.refresh();
        }, 50);
    } else {
        // Р”Р»СЏ РѕСЃС‚Р°Р»СЊРЅС‹С… РєРЅРѕРїРѕРє РґРµР»Р°РµРј РїРµСЂРµРЅР°РїСЂР°РІР»РµРЅРёРµ
        const sectionParams = {
            'home_func': 'home',
            'about_func': 'about',
            'top_func': 'top',
	    'features_func': 'features',
            'topics_container_func': 'chat',
            'news_func': 'news',
            'download_func': 'download'
        };

        const urlParam = sectionParams[buttonId];
        if (urlParam) {
            window.location.href = `../index.html?section=${urlParam}`;
        }
    }

    console.log('РќР°Р¶Р°С‚Р° РєРЅРѕРїРєР° СЃ id: ' + buttonId);
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
