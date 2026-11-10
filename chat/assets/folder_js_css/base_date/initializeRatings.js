const fs = require('fs').promises;
const path = require('path');

const projectsFilePath = path.join(__dirname, 'projects.json');
const ratingsFilePath = path.join(__dirname, 'ratings.json');

async function initializeRatingsForExistingProjects() {
  try {
    // Read projects
    let projectsData = JSON.parse(await fs.readFile(projectsFilePath));
    let ratingsData = {};
    
    // Try to read existing ratings, or start fresh
    try {
      ratingsData = JSON.parse(await fs.readFile(ratingsFilePath));
    } catch (error) {
      console.warn('ratings.json not found or invalid, initializing');
    }

    // Initialize ratings for each project if not already present
    projectsData.projects.forEach(project => {
      const projectId = project.id.toString();
      if (!ratingsData[projectId]) {
        ratingsData[projectId] = {
          ratings: [],
          average: 0,
          count: 0
        };
      }
    });

    // Write updated ratings back to file
    await fs.writeFile(ratingsFilePath, JSON.stringify(ratingsData, null, 2));
    console.log('Ratings initialized for existing projects');
  } catch (error) {
    console.error('Error initializing ratings:', error);
  }
}

initializeRatingsForExistingProjects();
