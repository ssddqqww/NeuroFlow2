const API_BASE_URL = '../index.html';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded: partners-for-change.js loaded');
  loadProjects();
  checkAuth();
  document.getElementById('confirmDeleteProjectBtn').addEventListener('click', confirmDeleteProject);
  document.getElementById('create-project-btn').addEventListener('click', () => {
    console.log('create-project-btn: Clicked');
    showCreateProjectForm();
  });
});

async function loadProjects() {
  console.log('loadProjects: Starting to load projects');
  try {
    console.log('loadProjects: Fetching /api/projects');
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      credentials: 'include'
    });
    console.log('loadProjects: Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('loadProjects: Response body:', errorData);
      throw new Error(`Помилка завантаження проєктів: ${response.status}`);
    }
    
    const projects = await response.json();
    console.log('loadProjects: Projects loaded:', projects);
    displayProjects(projects);
  } catch (error) {
    console.error('loadProjects:', error);
    showAuthMessageProjects('Не вдалося завантажити проєкти. Спробуйте ще раз.');
  }
}

async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/check-auth`, {
      credentials: 'include'
    });
    const data = await response.json();
    console.log('checkAuth: Auth status:', data);
    
    if (data.authenticated && data.user && data.user.email) {
      window.currentUser = data.user;
      document.getElementById('create-project-btn').style.display = 'block';
    } else {
      window.currentUser = null;
      document.getElementById('create-project-btn').style.display = 'none';
      showAuthMessageProjects('Увійдіть, щоб створити проєкт.');
    }
  } catch (error) {
    console.error('checkAuth:', error);
    document.getElementById('create-project-btn').style.display = 'none';
    showAuthMessageProjects('Помилка перевірки авторизації. Спробуйте ще раз.');
  }
}

function displayProjects(projects) {
  const projectsList = document.getElementById('projects-list');
  projectsList.innerHTML = '';
  
  projects.forEach(project => {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.setAttribute('data-aos', 'fade-up');
    
    const imageUrl = project.image && project.image !== 'афі' && project.image !== 'пфі' 
      ? project.image 
      : 'assets/img/default-project.jpg';
    
    projectCard.innerHTML = `
      <img src="${imageUrl}" alt="${project.title}">
      <div class="project-card-content">
        <h3>${project.title}</h3>
        <p><strong>Опис:</strong> ${project.description}</p>
        <p><strong>Тема:</strong> ${project.theme}</p>
        <p><strong>Країна:</strong> ${project.country}</p>
        <p><strong>Місце:</strong> ${project.location}</p>
        <p><strong>Контакт:</strong> ${project.contact}</p>
        <p class="author"><strong>Автор:</strong> ${project.author} (${project.authorEmail})</p>
        <p><strong>Дата створення:</strong> ${new Date(project.createdAt).toLocaleDateString()}</p>
      </div>
      <div class="project-card-actions">
        ${window.currentUser && window.currentUser.email && project.authorEmail === window.currentUser.email ? `
          <button class="edit-btn" onclick="editProject(${project.id})">Редагувати</button>
          <button class="delete-btn" onclick="showDeleteProjectModal(${project.id})">Видалити</button>
        ` : ''}
        <button class="contact-btn" onclick="showContactModal('${project.contact}')">Контактувати</button>
      </div>
    `;
    
    projectsList.appendChild(projectCard);
  });
}

function showCreateProjectForm(project = null) {
  console.log('showCreateProjectForm: Starting', project ? `Editing project ${project.id}` : 'Creating new project');
  if (!window.currentUser || !window.currentUser.email) {
    showAuthMessageProjects('Увійдіть, щоб створити або редагувати проєкт.');
    return;
  }
  
  const formContainer = document.getElementById('create-project-form-container');
  formContainer.style.display = 'block';
  
  const form = document.getElementById('create-project-form');
  form.innerHTML = `
    <h3>${project ? 'Редагувати проєкт' : 'Створити новий проєкт'}</h3>
    <label for="project-title">Назва:</label>
    <input type="text" id="project-title" value="${project ? project.title : ''}" required>
    <label for="project-description">Опис:</label>
    <textarea id="project-description" required>${project ? project.description : ''}</textarea>
    <label for="project-theme">Тема:</label>
    <select id="project-theme" required>
      <option value="ecology" ${project && project.theme === 'ecology' ? 'selected' : ''}>Екологія</option>
      <option value="education" ${project && project.theme === 'education' ? 'selected' : ''}>Освіта</option>
      <option value="health" ${project && project.theme === 'health' ? 'selected' : ''}>Здоров'я</option>
      <option value="social" ${project && project.theme === 'social' ? 'selected' : ''}>Соціальні ініціативи</option>
    </select>
    <label for="project-country">Країна:</label>
    <input type="text" id="project-country" value="${project ? project.country : ''}" required>
    <label for="project-location">Місце:</label>
    <input type="text" id="project-location" value="${project ? project.location : ''}" required>
    <label for="project-contact">Контакт:</label>
    <input type="text" id="project-contact" value="${project ? project.contact : ''}" required>
    <label for="project-image">URL зображення:</label>
    <input type="url" id="project-image" value="${project && project.image !== 'афі' && project.image !== 'пфі' ? project.image : ''}">
    <button type="submit">${project ? 'Оновити проєкт' : 'Створити проєкт'}</button>
  `;
  
  console.log('showCreateProjectForm: Project form shown');
  form.onsubmit = (e) => {
    e.preventDefault();
    if (project && project.id) {
      console.log('showCreateProjectForm: Submitting update for project', project.id);
      updateProject(project.id);
    } else {
      console.log('showCreateProjectForm: Submitting new project');
      createProject();
    }
  };
}

async function createProject() {
  console.log('createProject: Starting to create project');
  if (!window.currentUser || !window.currentUser.email) {
    showAuthMessageProjects('Увійдіть, щоб створити проєкт.');
    return;
  }
  
  const title = document.getElementById('project-title').value;
  const description = document.getElementById('project-description').value;
  const theme = document.getElementById('project-theme').value;
  const country = document.getElementById('project-country').value;
  const location = document.getElementById('project-location').value;
  const contact = document.getElementById('project-contact').value;
  const image = document.getElementById('project-image').value;
  
  if (!title || !description || !theme || !country || !location || !contact) {
    console.log('createProject: Missing required fields');
    showAuthMessageProjects('Заповніть усі обов’язкові поля');
    return;
  }
  
  const projectData = {
    title,
    description,
    theme,
    country,
    location,
    contact,
    image: image || 'assets/img/default-project.jpg',
    author: window.currentUser.name,
    authorEmail: window.currentUser.email
  };
  
  console.log('createProject: Project data:', projectData);
  
  try {
    console.log('createProject: Fetching /api/projects');
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
      credentials: 'include'
    });
    
    console.log('createProject: Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('createProject: Response body:', errorData);
      throw new Error(`Помилка створення проєкту: ${response.status}`);
    }
    
    const newProject = await response.json();
    console.log('createProject: Project created:', newProject);
    document.getElementById('create-project-form-container').style.display = 'none';
    loadProjects();
  } catch (error) {
    console.error('createProject:', error);
    showAuthMessageProjects('Не вдалося створити проєкт. Спробуйте ще раз.');
  }
}

async function editProject(projectId) {
  console.log('editProject: Starting to edit project', projectId);
  if (!window.currentUser || !window.currentUser.email) {
    showAuthMessageProjects('Увійдіть, щоб редагувати проєкт.');
    return;
  }
  
  try {
    console.log('editProject: Fetching /api/projects');
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('editProject: Response body:', errorData);
      throw new Error(`Помилка завантаження проєктів: ${response.status}`);
    }
    
    const projects = await response.json();
    const project = projects.find(p => p.id === parseInt(projectId));
    
    if (project) {
      console.log('editProject: Project found:', project);
      showCreateProjectForm(project);
    } else {
      console.log('editProject: Project not found for ID:', projectId);
      showAuthMessageProjects('Проєкт не знайдено.');
    }
  } catch (error) {
    console.error('editProject:', error);
    showAuthMessageProjects('Помилка при редагуванні проєкту.');
  }
}

async function updateProject(projectId) {
  console.log('updateProject: Starting to update project', projectId);
  if (!window.currentUser || !window.currentUser.email) {
    showAuthMessageProjects('Увійдіть, щоб редагувати проєкт.');
    return;
  }
  
  const title = document.getElementById('project-title').value;
  const description = document.getElementById('project-description').value;
  const theme = document.getElementById('project-theme').value;
  const country = document.getElementById('project-country').value;
  const location = document.getElementById('project-location').value;
  const contact = document.getElementById('project-contact').value;
  const image = document.getElementById('project-image').value;
  
  if (!title || !description || !theme || !country || !location || !contact) {
    console.log('updateProject: Missing required fields');
    showAuthMessageProjects('Заповніть усі обов’язкові поля');
    return;
  }
  
  const projectData = {
    title,
    description,
    theme,
    country,
    location,
    contact,
    image: image || 'assets/img/default-project.jpg',
    userEmail: window.currentUser.email
  };
  
  try {
    console.log('updateProject: Fetching /api/projects/' + projectId);
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
      credentials: 'include'
    });
    
    console.log('updateProject: Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('updateProject: Response body:', errorData);
      throw new Error(`Помилка оновлення проєкту: ${response.status}`);
    }
    
    const updatedProject = await response.json();
    console.log('updateProject: Project updated:', updatedProject);
    document.getElementById('create-project-form-container').style.display = 'none';
    loadProjects();
  } catch (error) {
    console.error('updateProject:', error);
    showAuthMessageProjects('Не вдалося оновити проєкт. Спробуйте ще раз.');
  }
}

async function confirmDeleteProject() {
  const projectId = window.currentProjectId;
  console.log('confirmDeleteProject: Deleting project', projectId);
  
  if (!window.currentUser || !window.currentUser.email) {
    showAuthMessageProjects('Увійдіть, щоб видалити проєкт.');
    return;
  }
  
  try {
    console.log('confirmDeleteProject: Fetching /api/projects/' + projectId);
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}?userEmail=${encodeURIComponent(window.currentUser.email)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    console.log('confirmDeleteProject: Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('confirmDeleteProject: Response body:', errorData);
      throw new Error(`Помилка видалення проєкту: ${response.status}`);
    }
    
    console.log('confirmDeleteProject: Project deleted');
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteProjectModal'));
    modal.hide();
    loadProjects();
  } catch (error) {
    console.error('confirmDeleteProject:', error);
    showAuthMessageProjects('Не вдалося видалити проєкт. Спробуйте ще раз.');
  }
}

function showContactModal(contact) {
  document.getElementById('contactDetails').textContent = contact;
  const modal = new bootstrap.Modal(document.getElementById('contactModal'));
  modal.show();
}

function filterProjects() {
  const theme = document.getElementById('filter-theme').value;
  const country = document.getElementById('filter-country').value.toLowerCase();
  
  console.log('filterProjects: Filtering with theme:', theme, 'country:', country);
  
  const projectCards = document.querySelectorAll('.project-card');
  
  projectCards.forEach(card => {
    const projectTheme = card.querySelector('p:nth-child(3)').textContent.toLowerCase().includes(theme.toLowerCase()) || theme === '';
    const projectCountry = card.querySelector('p:nth-child(4)').textContent.toLowerCase().includes(country);
    
    if ((theme === '' || projectTheme) && (country === '' || projectCountry)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function showAuthMessageProjects(message) {
  console.log('showAuthMessageProjects: Showing message:', message);
  const messageDiv = document.getElementById('auth-message-projects');
  messageDiv.textContent = message;
  messageDiv.style.display = 'block';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
    console.log('showAuthMessageProjects: Message hidden');
  }, 3000);
}
