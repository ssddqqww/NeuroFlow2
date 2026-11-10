const API_BASE_URL = '../index.html';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded: partners-for-change.js loaded');
  loadProjects();
  setupEventListeners();
});

function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('searchInputProjects');
  searchInput.addEventListener('input', filterProjects);

  // Filter dropdowns
  document.getElementById('themeFilter').addEventListener('change', filterProjects);
  document.getElementById('countryFilter').addEventListener('change', filterProjects);

  // Create project button
  document.getElementById('createProjectBtn').addEventListener('click', toggleCreateProjectForm);

  // Form submission
  document.getElementById('projectForm').querySelector('button').addEventListener('click', createProject);

  // Delete confirmation
  document.getElementById('confirmDeleteProjectBtn').addEventListener('click', confirmDeleteProject);
}

async function loadProjects() {
  console.log('loadProjects: Starting to load projects');
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects`);
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

function displayProjects(projects) {
  const projectList = document.getElementById('projectList');
  projectList.innerHTML = '';

  projects.forEach(project => {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.setAttribute('data-aos', 'fade-up');
    projectCard.setAttribute('data-theme', project.theme);
    projectCard.setAttribute('data-country', project.country);

    projectCard.innerHTML = `
      <img src="${project.image || 'assets/img/default-project.jpg'}" alt="${project.title}">
      <div class="project-card-content">
        <h3>${project.title}</h3>
        <p><strong>Опис:</strong> ${project.description}</p>
        <p><strong>Тема:</strong> ${project.theme}</p>
        <p><strong>Країна:</strong> ${project.country}</p>
        <p><strong>Місце:</strong> ${project.location}</p>
        <p><strong>Контакт:</strong> ${project.contact}</p>
        <p><strong>Автор:</strong> ${project.author} (${project.authorEmail})</p>
        <p><strong>Дата створення:</strong> ${new Date(project.createdAt).toLocaleDateString()}</p>
      </div>
      <div class="project-card-actions">
        <button class="edit-btn" onclick="editProject(${project.id})">Редагувати</button>
        <button class="delete-btn" onclick="showDeleteProjectModal(${project.id})">Видалити</button>
        <button class="contact-btn" onclick="showContactModal('${project.contact}')">Контактувати</button>
      </div>
    `;

    projectList.appendChild(projectCard);
  });
}

function toggleCreateProjectForm() {
  const projectForm = document.getElementById('projectForm');
  const authMessage = document.getElementById('authMessageProjects');
  
  // Simulate authentication check (replace with actual auth logic)
  const isAuthenticated = false; // Replace with real auth check
  if (!isAuthenticated) {
    showAuthMessageProjects('Будь ласка, увійдіть щоб створити проєкт');
    return;
  }

  projectForm.classList.toggle('hidden');
  clearForm();
}

function clearForm() {
  document.getElementById('projectTitle').value = '';
  document.getElementById('projectDescription').value = '';
  document.getElementById('projectTheme').value = 'ecology';
  document.getElementById('projectCountry').value = 'Ukraine';
  document.getElementById('projectLocation').value = '';
  document.getElementById('projectContact').value = '';
  document.getElementById('projectImage').value = '';
}

async function createProject() {
  console.log('createProject: Starting to create project');
  const title = document.getElementById('projectTitle').value;
  const description = document.getElementById('projectDescription').value;
  const theme = document.getElementById('projectTheme').value;
  const country = document.getElementById('projectCountry').value;
  const location = document.getElementById('projectLocation').value;
  const contact = document.getElementById('projectContact').value;
  const image = document.getElementById('projectImage').value;

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
    author: 'Anonymous', // Replace with actual user data
    authorEmail: 'anonymous@example.com' // Replace with actual user data
  };

  console.log('createProject: Project data:', projectData);

  try {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });

    console.log('createProject: Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('createProject: Response body:', errorData);
      throw new Error(`Помилка створення проєкту: ${response.status}`);
    }

    const newProject = await response.json();
    console.log('createProject: Project created:', newProject);
    document.getElementById('projectForm').classList.add('hidden');
    loadProjects();
  } catch (error) {
    console.error('createProject:', error);
    showAuthMessageProjects('Не вдалося створити проєкт. Спробуйте ще раз.');
  }
}

async function editProject(projectId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects`);
    const projects = await response.json();
    const project = projects.find(p => p.id === projectId);

    if (project) {
      document.getElementById('projectTitle').value = project.title;
      document.getElementById('projectDescription').value = project.description;
      document.getElementById('projectTheme').value = project.theme;
      document.getElementById('projectCountry').value = project.country;
      document.getElementById('projectLocation').value = project.location;
      document.getElementById('projectContact').value = project.contact;
      document.getElementById('projectImage').value = project.image;

      const projectForm = document.getElementById('projectForm');
      projectForm.classList.remove('hidden');
      projectForm.querySelector('button').onclick = () => updateProject(projectId);
    } else {
      showAuthMessageProjects('Проєкт не знайдено.');
    }
  } catch (error) {
    console.error('editProject:', error);
    showAuthMessageProjects('Помилка при редагуванні проєкту.');
  }
}

async function updateProject(projectId) {
  console.log('updateProject: Starting to update project', projectId);
  const title = document.getElementById('projectTitle').value;
  const description = document.getElementById('projectDescription').value;
  const theme = document.getElementById('projectTheme').value;
  const country = document.getElementById('projectCountry').value;
  const location = document.getElementById('projectLocation').value;
  const contact = document.getElementById('projectContact').value;
  const image = document.getElementById('projectImage').value;

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
    image: image || 'assets/img/default-project.jpg'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });

    console.log('updateProject: Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('updateProject: Response body:', errorData);
      throw new Error(`Помилка оновлення проєкту: ${response.status}`);
    }

    const updatedProject = await response.json();
    console.log('updateProject: Project updated:', updatedProject);
    document.getElementById(' grokprojectForm').classList.add('hidden');
    loadProjects();
  } catch (error) {
    console.error('updateProject:', error);
    showAuthMessageProjects('Не вдалося оновити проєкт. Спробуйте ще раз.');
  }
}

function showDeleteProjectModal(projectId) {
  window.currentProjectId = projectId;
  const modal = new bootstrap.Modal(document.getElementById('deleteProjectModal'));
  modal.show();
}

async function confirmDeleteProject() {
  const projectId = window.currentProjectId;
  console.log('confirmDeleteProject: Deleting project', projectId);

  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      method: 'DELETE'
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
  document.getElementById('contactInfoContent').textContent = contact;
  const modal = new bootstrap.Modal(document.getElementById('contactInfoModal'));
  modal.show();
}

function filterProjects() {
  const search = document.getElementById('searchInputProjects').value.toLowerCase();
  const theme = document.getElementById('themeFilter').value;
  const country = document.getElementById('countryFilter').value;

  console.log('filterProjects: Filtering with search:', search, 'theme:', theme, 'country:', country);

  const projectCards = document.querySelectorAll('.project-card');

  projectCards.forEach(card => {
    const title = card.querySelector('h3').textContent.toLowerCase();
    const description = card.querySelector('p:nth-child(2)').textContent.toLowerCase();
    const projectTheme = card.getAttribute('data-theme');
    const projectCountry = card.getAttribute('data-country');

    const matchesSearch = title.includes(search) || description.includes(search);
    const matchesTheme = theme === 'all' || projectTheme === theme;
    const matchesCountry = country === 'all' || projectCountry === country;

    if (matchesSearch && matchesTheme && matchesCountry) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function showAuthMessageProjects(message) {
  console.log('showAuthMessageProjects: Showing message:', message);
  const messageDiv = document.getElementById('authMessageProjects');
  messageDiv.textContent = message;
  messageDiv.classList.remove('hidden');

  setTimeout(() => {
    messageDiv.classList.add('hidden');
    console.log('showAuthMessageProjects: Message hidden');
  }, 3000);
}
