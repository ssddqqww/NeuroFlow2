  const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '../../../index.html';
  let projects = [];
  let filteredProjects = [];
  let activeUser = null;
  let map = null;
  let tempMarker = null;
  const markers = [];

  const cityCoordinates = {
    'Kyiv': [50.4501, 30.5234],
    'Lviv': [49.8397, 24.0297],
    'Odesa': [46.4825, 30.7233],
    'Kharkiv': [49.9935, 36.2304],
    'Dnipro': [48.4647, 35.0462],
    'Warsaw': [52.2297, 21.0122],
    'Brasilia': [-15.7942, -47.8825],
    'Washington': [38.9072, -77.0369],
    'Panama City': [8.9824, -79.5199]
  };

  const countries = [
    { name: 'Ukraine', flag: 'https://flagcdn.com/ua.svg' },
    { name: 'Brazil', flag: 'https://flagcdn.com/br.svg' },
    { name: 'United States', flag: 'https://flagcdn.com/us.svg' },
    { name: 'Poland', flag: 'https://flagcdn.com/pl.svg' },
    { name: 'Afghanistan', flag: 'https://flagcdn.com/af.svg' },
    { name: 'Albania', flag: 'https://flagcdn.com/al.svg' },
    { name: 'Algeria', flag: 'https://flagcdn.com/dz.svg' },
    { name: 'Andorra', flag: 'https://flagcdn.com/ad.svg' },
    { name: 'Angola', flag: 'https://flagcdn.com/ao.svg' },
    { name: 'Argentina', flag: 'https://flagcdn.com/ar.svg' },
    { name: 'Armenia', flag: 'https://flagcdn.com/am.svg' },
    { name: 'Australia', flag: 'https://flagcdn.com/au.svg' },
    { name: 'Austria', flag: 'https://flagcdn.com/at.svg' },
    { name: 'Azerbaijan', flag: 'https://flagcdn.com/az.svg' },
    { name: 'Bahamas', flag: 'https://flagcdn.com/bs.svg' },
    { name: 'Bahrain', flag: 'https://flagcdn.com/bh.svg' },
    { name: 'Bangladesh', flag: 'https://flagcdn.com/bd.svg' },
    { name: 'Barbados', flag: 'https://flagcdn.com/bb.svg' },
    { name: 'Belgium', flag: 'https://flagcdn.com/be.svg' },
    { name: 'Belize', flag: 'https://flagcdn.com/bz.svg' },
    { name: 'Benin', flag: 'https://flagcdn.com/bj.svg' },
    { name: 'Bhutan', flag: 'https://flagcdn.com/bt.svg' },
    { name: 'Bolivia', flag: 'https://flagcdn.com/bo.svg' },
    { name: 'Bosnia and Herzegovina', flag: 'https://flagcdn.com/ba.svg' },
    { name: 'Botswana', flag: 'https://flagcdn.com/bw.svg' },
    { name: 'Brunei', flag: 'https://flagcdn.com/bn.svg' },
    { name: 'Bulgaria', flag: 'https://flagcdn.com/bg.svg' },
    { name: 'Burkina Faso', flag: 'https://flagcdn.com/bf.svg' },
    { name: 'Burundi', flag: 'https://flagcdn.com/bi.svg' },
    { name: 'Cambodia', flag: 'https://flagcdn.com/kh.svg' },
    { name: 'Cameroon', flag: 'https://flagcdn.com/cm.svg' },
    { name: 'Canada', flag: 'https://flagcdn.com/ca.svg' },
    { name: 'Cape Verde', flag: 'https://flagcdn.com/cv.svg' },
    { name: 'Central African Republic', flag: 'https://flagcdn.com/cf.svg' },
    { name: 'Chad', flag: 'https://flagcdn.com/td.svg' },
    { name: 'Chile', flag: 'https://flagcdn.com/cl.svg' },
    { name: 'China', flag: 'https://flagcdn.com/cn.svg' },
    { name: 'Colombia', flag: 'https://flagcdn.com/co.svg' },
    { name: 'Comoros', flag: 'https://flagcdn.com/km.svg' },
    { name: 'Costa Rica', flag: 'https://flagcdn.com/cr.svg' },
    { name: 'Croatia', flag: 'https://flagcdn.com/hr.svg' },
    { name: 'Cuba', flag: 'https://flagcdn.com/cu.svg' },
    { name: 'Cyprus', flag: 'https://flagcdn.com/cy.svg' },
    { name: 'Czech Republic', flag: 'https://flagcdn.com/cz.svg' },
    { name: 'Denmark', flag: 'https://flagcdn.com/dk.svg' },
    { name: 'Djibouti', flag: 'https://flagcdn.com/dj.svg' },
    { name: 'Dominica', flag: 'https://flagcdn.com/dm.svg' },
    { name: 'Dominican Republic', flag: 'https://flagcdn.com/do.svg' },
    { name: 'DR Congo', flag: 'https://flagcdn.com/cd.svg' },
    { name: 'Ecuador', flag: 'https://flagcdn.com/ec.svg' },
    { name: 'Egypt', flag: 'https://flagcdn.com/eg.svg' },
    { name: 'El Salvador', flag: 'https://flagcdn.com/sv.svg' },
    { name: 'Equatorial Guinea', flag: 'https://flagcdn.com/gq.svg' },
    { name: 'Eritrea', flag: 'https://flagcdn.com/er.svg' },
    { name: 'Estonia', flag: 'https://flagcdn.com/ee.svg' },
    { name: 'Eswatini', flag: 'https://flagcdn.com/sz.svg' },
    { name: 'Ethiopia', flag: 'https://flagcdn.com/et.svg' },
    { name: 'Fiji', flag: 'https://flagcdn.com/fj.svg' },
    { name: 'Finland', flag: 'https://flagcdn.com/fi.svg' },
    { name: 'France', flag: 'https://flagcdn.com/fr.svg' },
    { name: 'Gabon', flag: 'https://flagcdn.com/ga.svg' },
    { name: 'Gambia', flag: 'https://flagcdn.com/gm.svg' },
    { name: 'Georgia', flag: 'https://flagcdn.com/ge.svg' },
    { name: 'Germany', flag: 'https://flagcdn.com/de.svg' },
    { name: 'Ghana', flag: 'https://flagcdn.com/gh.svg' },
    { name: 'Greece', flag: 'https://flagcdn.com/gr.svg' },
    { name: 'Grenada', flag: 'https://flagcdn.com/gd.svg' },
    { name: 'Guatemala', flag: 'https://flagcdn.com/gt.svg' },
    { name: 'Guinea', flag: 'https://flagcdn.com/gn.svg' },
    { name: 'Guinea-Bissau', flag: 'https://flagcdn.com/gw.svg' },
    { name: 'Guyana', flag: 'https://flagcdn.com/gy.svg' },
    { name: 'Haiti', flag: 'https://flagcdn.com/ht.svg' },
    { name: 'Honduras', flag: 'https://flagcdn.com/hn.svg' },
    { name: 'Hungary', flag: 'https://flagcdn.com/hu.svg' },
    { name: 'Iceland', flag: 'https://flagcdn.com/is.svg' },
    { name: 'India', flag: 'https://flagcdn.com/in.svg' },
    { name: 'Indonesia', flag: 'https://flagcdn.com/id.svg' },
    { name: 'Iran', flag: 'https://flagcdn.com/ir.svg' },
    { name: 'Iraq', flag: 'https://flagcdn.com/iq.svg' },
    { name: 'Ireland', flag: 'https://flagcdn.com/ie.svg' },
    { name: 'Israel', flag: 'https://flagcdn.com/il.svg' },
    { name: 'Italy', flag: 'https://flagcdn.com/it.svg' },
    { name: 'Jamaica', flag: 'https://flagcdn.com/jm.svg' },
    { name: 'Japan', flag: 'https://flagcdn.com/jp.svg' },
    { name: 'Jordan', flag: 'https://flagcdn.com/jo.svg' },
    { name: 'Kazakhstan', flag: 'https://flagcdn.com/kz.svg' },
    { name: 'Kenya', flag: 'https://flagcdn.com/ke.svg' },
    { name: 'Kiribati', flag: 'https://flagcdn.com/ki.svg' },
    { name: 'Kuwait', flag: 'https://flagcdn.com/kw.svg' },
    { name: 'Kyrgyzstan', flag: 'https://flagcdn.com/kg.svg' },
    { name: 'Laos', flag: 'https://flagcdn.com/la.svg' },
    { name: 'Latvia', flag: 'https://flagcdn.com/lv.svg' },
    { name: 'Lebanon', flag: 'https://flagcdn.com/lb.svg' },
    { name: 'Lesotho', flag: 'https://flagcdn.com/ls.svg' },
    { name: 'Liberia', flag: 'https://flagcdn.com/lr.svg' },
    { name: 'Libya', flag: 'https://flagcdn.com/ly.svg' },
    { name: 'Liechtenstein', flag: 'https://flagcdn.com/li.svg' },
    { name: 'Lithuania', flag: 'https://flagcdn.com/lt.svg' },
    { name: 'Luxembourg', flag: 'https://flagcdn.com/lu.svg' },
    { name: 'Madagascar', flag: 'https://flagcdn.com/mg.svg' },
    { name: 'Malawi', flag: 'https://flagcdn.com/mw.svg' },
    { name: 'Malaysia', flag: 'https://flagcdn.com/my.svg' },
    { name: 'Maldives', flag: 'https://flagcdn.com/mv.svg' },
    { name: 'Mali', flag: 'https://flagcdn.com/ml.svg' },
    { name: 'Malta', flag: 'https://flagcdn.com/mt.svg' },
    { name: 'Marshall Islands', flag: 'https://flagcdn.com/mh.svg' },
    { name: 'Mauritania', flag: 'https://flagcdn.com/mr.svg' },
    { name: 'Mauritius', flag: 'https://flagcdn.com/mu.svg' },
    { name: 'Mexico', flag: 'https://flagcdn.com/mx.svg' },
    { name: 'Micronesia', flag: 'https://flagcdn.com/fm.svg' },
    { name: 'Moldova', flag: 'https://flagcdn.com/md.svg' },
    { name: 'Monaco', flag: 'https://flagcdn.com/mc.svg' },
    { name: 'Mongolia', flag: 'https://flagcdn.com/mn.svg' },
    { name: 'Montenegro', flag: 'https://flagcdn.com/me.svg' },
    { name: 'Morocco', flag: 'https://flagcdn.com/ma.svg' },
    { name: 'Mozambique', flag: 'https://flagcdn.com/mz.svg' },
    { name: 'Myanmar', flag: 'https://flagcdn.com/mm.svg' },
    { name: 'Namibia', flag: 'https://flagcdn.com/na.svg' },
    { name: 'Nauru', flag: 'https://flagcdn.com/nr.svg' },
    { name: 'Nepal', flag: 'https://flagcdn.com/np.svg' },
    { name: 'Netherlands', flag: 'https://flagcdn.com/nl.svg' },
    { name: 'New Zealand', flag: 'https://flagcdn.com/nz.svg' },
    { name: 'Nicaragua', flag: 'https://flagcdn.com/ni.svg' },
    { name: 'Niger', flag: 'https://flagcdn.com/ne.svg' },
    { name: 'Nigeria', flag: 'https://flagcdn.com/ng.svg' },
    { name: 'North Korea', flag: 'https://flagcdn.com/kp.svg' },
    { name: 'North Macedonia', flag: 'https://flagcdn.com/mk.svg' },
    { name: 'Norway', flag: 'https://flagcdn.com/no.svg' },
    { name: 'Oman', flag: 'https://flagcdn.com/om.svg' },
    { name: 'Pakistan', flag: 'https://flagcdn.com/pk.svg' },
    { name: 'Palau', flag: 'https://flagcdn.com/pw.svg' },
    { name: 'Panama', flag: 'https://flagcdn.com/pa.svg' },
    { name: 'Papua New Guinea', flag: 'https://flagcdn.com/pg.svg' },
    { name: 'Paraguay', flag: 'https://flagcdn.com/py.svg' },
    { name: 'Peru', flag: 'https://flagcdn.com/pe.svg' },
    { name: 'Philippines', flag: 'https://flagcdn.com/ph.svg' },
    { name: 'Portugal', flag: 'https://flagcdn.com/pt.svg' },
    { name: 'Qatar', flag: 'https://flagcdn.com/qa.svg' },
    { name: 'Romania', flag: 'https://flagcdn.com/ro.svg' },
    { name: 'Rwanda', flag: 'https://flagcdn.com/rw.svg' },
    { name: 'Saint Kitts and Nevis', flag: 'https://flagcdn.com/kn.svg' },
    { name: 'Saint Lucia', flag: 'https://flagcdn.com/lc.svg' },
    { name: 'Saint Vincent and the Grenadines', flag: 'https://flagcdn.com/vc.svg' },
    { name: 'Samoa', flag: 'https://flagcdn.com/ws.svg' },
    { name: 'San Marino', flag: 'https://flagcdn.com/sm.svg' },
    { name: 'Sao Tome and Principe', flag: 'https://flagcdn.com/st.svg' },
    { name: 'Saudi Arabia', flag: 'https://flagcdn.com/sa.svg' },
    { name: 'Senegal', flag: 'https://flagcdn.com/sn.svg' },
    { name: 'Serbia', flag: 'https://flagcdn.com/rs.svg' },
    { name: 'Seychelles', flag: 'https://flagcdn.com/sc.svg' },
    { name: 'Sierra Leone', flag: 'https://flagcdn.com/sl.svg' },
    { name: 'Singapore', flag: 'https://flagcdn.com/sg.svg' },
    { name: 'Slovakia', flag: 'https://flagcdn.com/sk.svg' },
    { name: 'Slovenia', flag: 'https://flagcdn.com/si.svg' },
    { name: 'Solomon Islands', flag: 'https://flagcdn.com/sb.svg' },
    { name: 'Somalia', flag: 'https://flagcdn.com/so.svg' },
    { name: 'South Africa', flag: 'https://flagcdn.com/za.svg' },
    { name: 'South Korea', flag: 'https://flagcdn.com/kr.svg' },
    { name: 'South Sudan', flag: 'https://flagcdn.com/ss.svg' },
    { name: 'Spain', flag: 'https://flagcdn.com/es.svg' },
    { name: 'Sri Lanka', flag: 'https://flagcdn.com/lk.svg' },
    { name: 'Sudan', flag: 'https://flagcdn.com/sd.svg' },
    { name: 'Suriname', flag: 'https://flagcdn.com/sr.svg' },
    { name: 'Sweden', flag: 'https://flagcdn.com/se.svg' },
    { name: 'Switzerland', flag: 'https://flagcdn.com/ch.svg' },
    { name: 'Syria', flag: 'https://flagcdn.com/sy.svg' },
    { name: 'Tajikistan', flag: 'https://flagcdn.com/tj.svg' },
    { name: 'Tanzania', flag: 'https://flagcdn.com/tz.svg' },
    { name: 'Thailand', flag: 'https://flagcdn.com/th.svg' },
    { name: 'Timor-Leste', flag: 'https://flagcdn.com/tl.svg' },
    { name: 'Togo', flag: 'https://flagcdn.com/tg.svg' },
    { name: 'Tonga', flag: 'https://flagcdn.com/to.svg' },
    { name: 'Trinidad and Tobago', flag: 'https://flagcdn.com/tt.svg' },
    { name: 'Tunisia', flag: 'https://flagcdn.com/tn.svg' },
    { name: 'Turkey', flag: 'https://flagcdn.com/tr.svg' },
    { name: 'Turkmenistan', flag: 'https://flagcdn.com/tm.svg' },
    { name: 'Tuvalu', flag: 'https://flagcdn.com/tv.svg' },
    { name: 'Uganda', flag: 'https://flagcdn.com/ug.svg' },
    { name: 'United Arab Emirates', flag: 'https://flagcdn.com/ae.svg' },
    { name: 'United Kingdom', flag: 'https://flagcdn.com/gb.svg' },
    { name: 'Uruguay', flag: 'https://flagcdn.com/uy.svg' },
    { name: 'Uzbekistan', flag: 'https://flagcdn.com/uz.svg' },
    { name: 'Vanuatu', flag: 'https://flagcdn.com/vu.svg' },
    { name: 'Venezuela', flag: 'https://flagcdn.com/ve.svg' },
    { name: 'Vietnam', flag: 'https://flagcdn.com/vn.svg' },
    { name: 'Yemen', flag: 'https://flagcdn.com/ye.svg' },
    { name: 'Zambia', flag: 'https://flagcdn.com/zm.svg' },
    { name: 'Zimbabwe', flag: 'https://flagcdn.com/zw.svg' }
  ];

  const themes = [
    'Medicine', 'Biology', 'Ecology', 'Energy', 'Education', 'Industry', 'Transport',
    'Agrotechnology', 'Artificial Intelligence', 'Cybersecurity', 'Urban Studies',
    'Astronomy', 'Economics', 'Law', 'Psychology', 'Architecture', 'Sociology',
    'Climatology', 'Geology', 'Physics', 'Chemistry', 'Biotechnology', 'Cosmonautics',
    'Robotics', 'Environmental Protection', 'Tourism', 'Food Technology', 'Logistics',
    'Journalism', 'Art', 'History', 'Anthropology', 'Marketing', 'Finance', 'Management',
    'Aviation', 'Maritime Technology', 'Engineering', 'Information Technology',
    'Civil Sector', 'Volunteering', 'Community Development', 'Humanitarian Aid',
    'Public Health', 'Cultural Heritage', 'Other'
  ];

  const themeColors = {
    'Medicine': 'red',
    'Biology': 'limegreen',
    'Ecology': 'green',
    'Energy': 'orange',
    'Education': 'blue',
    'Industry': 'gray',
    'Transport': 'darkblue',
    'Agrotechnology': 'olive',
    'Artificial Intelligence': 'purple',
    'Cybersecurity': 'teal',
    'Urban Studies': 'brown',
    'Astronomy': 'navy',
    'Economics': 'gold',
    'Law': 'crimson',
    'Psychology': 'magenta',
    'Architecture': 'coral',
    'Sociology': 'lightblue',
    'Climatology': 'cyan',
    'Geology': 'sienna',
    'Physics': 'violet',
    'Chemistry': 'lime',
    'Biotechnology': 'forestgreen',
    'Cosmonautics': 'darkviolet',
    'Robotics': 'steelblue',
    'Environmental Protection': 'darkgreen',
    'Tourism': 'pink',
    'Food Technology': 'chocolate',
    'Logistics': 'darkgray',
    'Journalism': 'salmon',
    'Art': 'hotpink',
    'History': 'tan',
    'Anthropology': 'lightcoral',
    'Marketing': 'turquoise',
    'Finance': 'goldenrod',
    'Management': 'slateblue',
    'Aviation': 'skyblue',
    'Maritime Technology': 'deepskyblue',
    'Engineering': 'darkorange',
    'Information Technology': 'indigo',
    'Civil Sector': 'lightgreen',
    'Volunteering': 'lightpink',
    'Community Development': 'plum',
    'Humanitarian Aid': 'maroon',
    'Public Health': 'tomato',
    'Cultural Heritage': 'khaki',
    'Other': 'gray'
  };

  map = L.map('map').setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  function setStatus(message, isError = true) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `bg-${isError ? 'red' : 'green'}-100 border border-${isError ? 'red' : 'green'}-400 text-${isError ? 'red' : 'green'}-700 px-4 py-3 rounded mb-4`;
    statusDiv.classList.remove('hidden');
    setTimeout(() => statusDiv.classList.add('hidden'), 3000);
  }

  function sanitizeInput(str) {
    if (!str) return '';
    const safeStr = String(str);
    return safeStr
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/`/g, '&#x60;')
      .replace(/\(/g, '&#40;')
      .replace(/\)/g, '&#41;');
  }

  async function checkAuth() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/check-auth`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.authenticated) {
        activeUser = data.user;
        document.getElementById('showCreateProject').classList.remove('hidden');
      } else {
        activeUser = null;
        document.getElementById('showCreateProject').classList.add('hidden');
      }
      await loadProjects();
    } catch (error) {
      console.error('Error checking auth:', error);
      setStatus('Authentication check failed');
    }
  }

  async function loadProjects() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`Failed to load projects: ${response.status}`);
      projects = await response.json();

      // Fetch ratings for each project
      for (let project of projects) {
        try {
          const ratingsResponse = await fetch(`${API_BASE_URL}/api/projects/${project.id}/ratings`, {
            credentials: 'include'
          });
          console.log(`Ratings response for project ${project.id}:`, await ratingsResponse.clone().text()); // Debug log
          if (ratingsResponse.ok) {
            const ratingsData = await ratingsResponse.json();
            // Ensure ratings is an array
            project.ratings = Array.isArray(ratingsData.ratings) ? ratingsData.ratings : [];
            // Use provided average or calculate client-side
            project.averageRating = ratingsData.average != null && !isNaN(ratingsData.average)
              ? parseFloat(ratingsData.average).toFixed(1)
              : project.ratings.length
                ? (project.ratings.reduce((sum, r) => sum + r.rating, 0) / project.ratings.length).toFixed(1)
                : 0;
            // Use provided count or use ratings length
            project.ratingCount = ratingsData.count != null && !isNaN(ratingsData.count)
              ? parseInt(ratingsData.count)
              : project.ratings.length;
          } else {
            console.warn(`Failed to fetch ratings for project ${project.id}: ${ratingsResponse.status}`);
            // Fallback to existing ratings or empty array
            project.ratings = Array.isArray(project.ratings) ? project.ratings : [];
            project.averageRating = project.ratings.length
              ? (project.ratings.reduce((sum, r) => sum + r.rating, 0) / project.ratings.length).toFixed(1)
              : 0;
            project.ratingCount = project.ratings.length;
          }
        } catch (error) {
          console.error(`Error fetching ratings for project ${project.id}:`, error);
          // Fallback to existing ratings or empty array
          project.ratings = Array.isArray(project.ratings) ? project.ratings : [];
          project.averageRating = project.ratings.length
            ? (project.ratings.reduce((sum, r) => sum + r.rating, 0) / project.ratings.length).toFixed(1)
            : 0;
          project.ratingCount = project.ratings.length;
        }

        if (!project.coordinates) {
          const coords = await geocodeLocation(project.location, project.country);
          if (coords) {
            project.coordinates = [coords.lat, coords.lng];
            await fetch(`${API_BASE_URL}/api/projects/${project.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                title: project.title,
                description: project.description,
                theme: project.theme,
                eventType: project.eventType,
                status: project.status,
                functionName: project.functionName,
                country: project.country,
                location: project.location,
                contact: project.contact,
                image: project.image,
                userEmail: project.authorEmail,
                coordinates: project.coordinates,
                ratings: project.ratings
              })
            });
          } else {
            project.coordinates = cityCoordinates[project.location] || cityCoordinates['Kyiv'] || [0, 0];
          }
        }
      }

      projects = projects.map(project => {
        const themeMap = {
          'ecology': 'Ecology',
          'education': 'Education',
          'medicine': 'Medicine',
          'community': 'Community Development',
          'technology': 'Information Technology',
          'culture': 'Cultural Heritage',
          'humanitarian': 'Humanitarian Aid'
        };
        const newTheme = themeMap[project.theme.toLowerCase()] || project.theme || 'Other';
        return {
          ...project,
          category: newTheme,
          lat: project.coordinates ? project.coordinates[0] : (cityCoordinates[project.location] || [0, 0])[0],
          lng: project.coordinates ? project.coordinates[1] : (cityCoordinates[project.location] || [0, 0])[1],
          coordinates: project.coordinates || cityCoordinates[project.location] || [0, 0],
          name: project.title,
          description: project.description || 'No description',
          technologies: 'Unknown',
          contact: project.contact || 'Unknown',
          news: 'No news',
          image: project.image || 'https://via.placeholder.com/150',
          source: 'server',
          averageRating: project.averageRating || 0,
          ratingCount: project.ratingCount || 0,
          status: project.status || 'Active',
          functionName: project.functionName || ''
        };
      });
      filterProjects();
    } catch (error) {
      console.error('Error loading projects:', error);
      setStatus('Failed to load projects');
    }
  }

  async function geocodeLocation(city, country, address = '') {
    let query = address ? address : `${city}, ${country}`;
    const url = `${API_BASE_URL}/api/geocode?address=${encodeURIComponent(query)}`;
    setStatus('Fetching coordinates...');
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        setStatus(`Coordinates found: ${lat}, ${lng}`, false);
        return { lat, lng };
      } else {
        setStatus('Failed to find coordinates, using fallback', true);
        return cityCoordinates[city] || cityCoordinates['Kyiv'] || null;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setStatus('Geocoding error, using fallback', true);
      return cityCoordinates[city] || cityCoordinates['Kyiv'] || null;
    }
  }

  function updateMarkers(projectsToDisplay = filteredProjects) {
    markers.forEach(({ marker }) => map.removeLayer(marker));
    markers.length = 0;

    projectsToDisplay.forEach(project => {
      const markerColor = themeColors[project.category] || 'gray';
      if (!project.category || !themeColors[project.category]) {
        console.warn(`Invalid or missing category for project "${project.name}": ${project.category}. Using default color: gray`);
      }

      const marker = L.circleMarker([project.lat, project.lng], {
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: 0.8,
        radius: 8
      }).addTo(map);

      const popupContent = `
        <div class="project-card">
          <h3 class="text-lg font-semibold text-gray-800">${sanitizeInput(project.name)}</h3>
          <p class="text-gray-600">${sanitizeInput(project.description)}</p>
          <p class="text-gray-600">${sanitizeInput(project.location)}, ${sanitizeInput(project.country)}</p>
          <p class="text-gray-600">Rating: ${project.averageRating} (${project.ratingCount} votes)</p>
          <button class="details-btn bg-blue-500 text-white py-1 px-2 rounded mt-2" data-project-id="${project.id}">Details</button>
        </div>
      `;
      marker.bindPopup(popupContent);
      markers.push({ marker, enterprise: project });
    });

    document.querySelectorAll('.details-btn').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = parseInt(button.dataset.projectId);
        showJoinProjectModal(projectId);
      });
    });
  }

  function showJoinProjectModal(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const modal = document.getElementById('joinProjectModal');
    const title = document.getElementById('joinProjectTitle');
    const content = document.getElementById('joinProjectContent');

    const userRating = activeUser ? project.ratings.find(r => r.userEmail === activeUser.email)?.rating || 0 : 0;

    title.textContent = `Join "${sanitizeInput(project.name)}"`;
    content.innerHTML = `
      <p><strong>Description:</strong> ${sanitizeInput(project.description)}</p>
      <p><strong>Theme:</strong> ${sanitizeInput(project.category)}</p>
      <p><strong>Event Type:</strong> ${sanitizeInput(project.eventType)}</p>
      <p><strong>Status:</strong> ${sanitizeInput(project.status)}</p>
      <p><strong>Function Name:</strong> ${sanitizeInput(project.functionName) || 'None'}</p>
      <p><strong>Location:</strong> ${sanitizeInput(project.location)}, ${sanitizeInput(project.country)}</p>
      <p><strong>Contact:</strong> <a href="mailto:${sanitizeInput(project.contact)}" class="text-blue-500 hover:underline">${sanitizeInput(project.contact)}</a></p>
      <p><strong>Rating:</strong> ${project.averageRating} (${project.ratingCount} votes)</p>
      ${activeUser ? `
        <div class="mt-2">
          <label for="projectRating${projectId}" class="block text-sm font-medium text-gray-700">Your Rating:</label>
          <div class="star-rating" data-project-id="${projectId}">
            ${[1, 2, 3, 4, 5].map(star => `
              <span class="star ${star <= userRating ? 'filled' : ''}" data-value="${star}">★</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <p class="mt-4"><strong>How to Join:</strong> Please email the provided contact for more information about participating in this project.</p>
    `;

    modal.classList.remove('hidden');

    if (activeUser) {
      document.querySelectorAll(`.star-rating[data-project-id="${projectId}"] .star`).forEach(star => {
        star.addEventListener('click', () => rateProject(projectId, parseInt(star.dataset.value)));
      });
    }
  }

  async function rateProject(projectId, rating) {
    try {
      const userEmailEncoded = getCookie('userEmail');
      if (!userEmailEncoded) {
        setStatus('Please log in to rate a project.');
        window.location.href = `/auth/google?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      const userEmail = decodeURIComponent(userEmailEncoded);
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ rating, userEmail })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error.includes('Unauthorized')) {
          setStatus('Session expired or invalid. Please log in again.');
          window.location.href = `/auth/google?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        throw new Error(errorData.error || `Failed to rate project: ${response.status}`);
      }

      setStatus('Rating submitted successfully!', false);
      await loadProjects();
      showJoinProjectModal(projectId);
    } catch (error) {
      console.error('Error rating project:', error.message);
      setStatus(`Failed to rate project: ${error.message}`);
    }
  }

  function showDeleteProjectModal(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const modal = document.getElementById('deleteProjectModal');
    const message = document.getElementById('deleteProjectMessage');
    const confirmButton = document.getElementById('confirmDeleteProject');

    message.textContent = `Are you sure you want to delete the project "${sanitizeInput(project.name)}"? This action cannot be undone.`;
    confirmButton.onclick = () => {
      deleteProject(projectId);
      closeDeleteProjectModal();
    };

    modal.classList.remove('hidden');
  }

  function closeDeleteProjectModal() {
    const modal = document.getElementById('deleteProjectModal');
    modal.classList.add('hidden');
  }

  function closeJoinProjectModal() {
    const modal = document.getElementById('joinProjectModal');
    modal.classList.add('hidden');
  }

  function closeContactModal() {
    const modal = document.getElementById('contactModal');
    modal.classList.add('hidden');
    document.getElementById('contactIframe').src = '';
  }

  function filterProjects() {
    let tempProjects = [...projects];
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const selectedCountries = Array.from(document.querySelectorAll('#countryFilters .filter-item.selected'))
      .map(item => item.dataset.country);
    const selectedThemes = Array.from(document.querySelectorAll('#themeFilters .filter-item.selected'))
      .map(item => item.dataset.theme);

    if (searchTerm) {
      tempProjects = tempProjects.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.description.toLowerCase().includes(searchTerm)
      );
    }
    if (selectedCountries.length) {
      tempProjects = tempProjects.filter(p => selectedCountries.includes(p.country));
    }
    if (selectedThemes.length) {
      tempProjects = tempProjects.filter(p => selectedThemes.includes(p.category));
    }

    filteredProjects = tempProjects;
    updateProjectList();
    updateMarkers();
  }

  function clearFilters() {
    document.getElementById('searchBar').value = '';
    document.querySelectorAll('#countryFilters .filter-item').forEach(item => {
      item.classList.remove('selected');
    });
    document.querySelectorAll('#themeFilters .filter-item').forEach(item => {
      item.classList.remove('selected');
    });
    filterProjects();
  }

  async function createProject() {
    if (!activeUser) {
      setStatus('Please log in');
      return;
    }

    const title = document.getElementById('projectTitle').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    const theme = document.getElementById('projectTheme').value;
    const eventType = document.getElementById('projectEventType').value;
    const country = document.getElementById('projectCountry').value.trim();
    const location = document.getElementById('projectCity').value.trim();
    const contact = document.getElementById('projectContact').value.trim();
    const image = document.getElementById('projectImage').value.trim();
    const latitude = parseFloat(document.getElementById('projectLatitude').value);
    const longitude = parseFloat(document.getElementById('projectLongitude').value);

    if (!title || !description || !country || !location || !contact || isNaN(latitude) || isNaN(longitude)) {
      setStatus('Please fill in all required fields, including coordinates');
      return;
    }

    const projectData = {
      title,
      description,
      theme,
      eventType,
      status: 'Active',
      functionName: '',
      country,
      location,
      contact,
      image: image || 'https://via.placeholder.com/150',
      author: activeUser.name,
      authorEmail: activeUser.email,
      coordinates: [latitude, longitude],
      ratings: []
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(projectData)
      });
      if (!response.ok) throw new Error(`Failed to create project: ${response.status}`);
      setStatus('Project created successfully!', false);
      document.getElementById('createProjectForm').classList.add('hidden');
      resetCreateForm();
      await loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      setStatus('Failed to create project');
    }
  }

  async function saveEditProject(projectId) {
    if (!activeUser) {
      setStatus('Please log in');
      return;
    }

    const title = document.getElementById(`editProjectTitle${projectId}`).value.trim();
    const description = document.getElementById(`editProjectDescription${projectId}`).value.trim();
    const theme = document.getElementById(`editProjectTheme${projectId}`).value;
    const eventType = document.getElementById(`editProjectEventType${projectId}`).value;
    const status = document.getElementById(`editProjectStatus${projectId}`).value;
    const functionName = document.getElementById(`editProjectFunctionName${projectId}`).value.trim();
    const country = document.getElementById(`editProjectCountry${projectId}`).value.trim();
    const location = document.getElementById(`editProjectCity${projectId}`).value.trim();
    const contact = document.getElementById(`editProjectContact${projectId}`).value.trim();
    const image = document.getElementById(`editProjectImage${projectId}`).value.trim();
    const latitude = parseFloat(document.getElementById(`editProjectLatitude${projectId}`).value);
    const longitude = parseFloat(document.getElementById(`editProjectLongitude${projectId}`).value);

    if (!title || !description || !country || !location || !contact || isNaN(latitude) || isNaN(longitude)) {
      setStatus('Please fill in all required fields, including coordinates');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    const projectData = {
      title,
      description,
      theme,
      eventType,
      status,
      functionName,
      country,
      location,
      contact,
      image: image || 'https://via.placeholder.com/150',
      userEmail: activeUser.email,
      coordinates: [latitude, longitude],
      ratings: project.ratings
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(projectData)
      });
      if (!response.ok) throw new Error(`Failed to update project: ${response.status}`);
      setStatus('Project updated successfully!', false);
      await loadProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      setStatus('Failed to update project');
    }
  }

  function updateProjectList() {
    const projectList = document.getElementById('projectList');
    projectList.innerHTML = '';
    filteredProjects.forEach(project => {
      const isAuthor = activeUser && project.authorEmail === activeUser.email;
      const dotColor = themeColors[project.category] || 'gray';
      const card = document.createElement('div');
      card.className = 'project-card flex items-start';
      card.innerHTML = `
        <img src="${sanitizeInput(project.image)}" alt="${sanitizeInput(project.name)}" class="w-24 h-24 object-cover rounded-md mr-4">
        <div class="flex-1">
          <div class="flex items-center">
            <span class="dot" style="background-color: ${dotColor};"></span>
            <h4 class="text-md font-medium text-gray-800">${sanitizeInput(project.name)}</h4>
          </div>
          <p class="text-gray-600">${sanitizeInput(project.description)}</p>
          <p class="text-gray-500 text-sm"><span class="font-medium">Theme:</span> ${sanitizeInput(project.category)}</p>
          <p class="text-gray-500 text-sm"><span class="font-medium">Event Type:</span> ${sanitizeInput(project.eventType)}</p>
          <p class="text-gray-500 text-sm"><span class="font-medium">Status:</span> ${sanitizeInput(project.status)}</p>
          <p class="text-gray-500 text-sm"><span class="font-medium">Function Name:</span> ${sanitizeInput(project.functionName) || 'None'}</p>
          <p class="text-gray-500 text-sm"><span class="font-medium">Location:</span> ${sanitizeInput(project.location)}, ${sanitizeInput(project.country)}</p>
          <p class="text-gray-500 text-sm"><span class="font-medium">Author:</span> ${sanitizeInput(project.author)}</p>
          <p class="text-gray-500 text-sm"><span class="font-medium">Rating:</span> ${project.averageRating} (${project.ratingCount} votes)</p>
          <div class="flex gap-2 mt-2">
            <button class="details-btn bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600" data-project-id="${project.id}">Details</button>
            <button class="check-btn bg-purple-500 text-white py-1 px-2 rounded hover:bg-purple-600" data-project-id="${project.id}">Check</button>
            ${!isAuthor ? `<button class="contact-btn bg-green-500 text-white py-1 px-2 rounded hover:bg-green-600" data-author-email="${sanitizeInput(project.authorEmail)}">Contact</button>` : ''}
          </div>
          ${isAuthor ? `
            <div class="flex gap-2 mt-2">
              <button class="edit-btn bg-yellow-500 text-white py-1 px-3 rounded-md hover:bg-yellow-600" data-project-id="${project.id}">
                <i class="bi bi-pencil mr-1"></i>Edit
              </button>
              <button class="delete-btn bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600" data-project-id="${project.id}">
                <i class="bi bi-trash mr-1"></i>Delete
              </button>
            </div>
          ` : ''}
        </div>
        <div id="editProjectForm${project.id}" class="hidden bg-gray-100 p-4 mt-4 rounded-md">
          <h3 class="text-lg font-semibold mb-2 text-gray-800">Edit Project</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="editProjectTitle${project.id}" class="block text-sm font-medium text-gray-700">Project Title</label>
              <input type="text" id="editProjectTitle${project.id}" value="${sanitizeInput(project.title)}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300" required>
            </div>
            <div>
              <label for="editProjectTheme${project.id}" class="block text-sm font-medium text-gray-700">Theme</label>
              <select id="editProjectTheme${project.id}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300" required>
                ${themes.map(theme => `<option value="${theme}" ${project.category === theme ? 'selected' : ''}>${theme}</option>`).join('')}
              </select>
            </div>
            <div>
              <label for="editProjectEventType${project.id}" class="block text-sm font-medium text-gray-700">Event Type</label>
              <select id="editProjectEventType${project.id}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300" required>
                <option value="OFFLINE" ${project.eventType === 'OFFLINE' ? 'selected' : ''}>Offline</option>
                <option value="ONLINE" ${project.eventType === 'ONLINE' ? 'selected' : ''}>Online</option>
                <option value="BOTH" ${project.eventType === 'BOTH' ? 'selected' : ''}>Both</option>
              </select>
            </div>
            <div>
              <label for="editProjectStatus${project.id}" class="block text-sm font-medium text-gray-700">Status</label>
              <select id="editProjectStatus${project.id}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300" required>
                <option value="Active" ${project.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Planned" ${project.status === 'Planned' ? 'selected' : ''}>Planned</option>
                <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label for="editProjectDescription${project.id}" class="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="editProjectDescription${project.id}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300" rows="4" required>${sanitizeInput(project.description)}</textarea>
            </div>
            <div>
              <label for="editProjectCountry${project.id}" class="block text-sm font-medium text-gray-700">Country</label>
              <input type="text" id="editProjectCountry${project.id}" value="${sanitizeInput(project.country)}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300" required>
            </div>
            <div>
              <label for="editProjectCity${project.id}" class="block text-sm font-medium text-gray-700">City</label>
              <input type="text" id="editProjectCity${project.id}" value="${sanitizeInput(project.location)}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300" required>
            </div>
            <div class="md:col-span-2">
              <label for="editProjectAddress${project.id}" class="block text-sm font-medium text-gray-700">Address (Optional)</label>
              <input type="text" id="editProjectAddress${project.id}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300">
            </div>
            <div class="md:col-span-2">
              <button class="geocode-btn bg-gray-400 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-500" data-project-id="${project.id}">
                Get Coordinates
              </button>
            </div>
            <div>
              <label for="editProjectLatitude${project.id}" class="block text-sm font-medium text-gray-700">Latitude</label>
              <input type="number" id="editProjectLatitude${project.id}" value="${project.lat || ''}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300" step="any" required readonly>
            </div>
            <div>
              <label for="editProjectLongitude${project.id}" class="block text-sm font-medium text-gray-700">Longitude</label>
              <input type="number" id="editProjectLongitude${project.id}" value="${project.lng || ''}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300" step="any" required readonly>
            </div>
            <div>
              <label for="editProjectContact${project.id}" class="block text-sm font-medium text-gray-700">Contact</label>
              <input type="text" id="editProjectContact${project.id}" value="${sanitizeInput(project.contact)}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300" required>
            </div>
            <div>
              <label for="editProjectImage${project.id}" class="block text-sm font-medium text-gray-700">Image URL</label>
              <input type="text" id="editProjectImage${project.id}" value="${sanitizeInput(project.image)}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300">
            </div>
            <div class="md:col-span-2">
              <label for="editProjectFunctionName${project.id}" class="block text-sm font-medium text-gray-700">Function Name (Optional)</label>
              <input type="text" id="editProjectFunctionName${project.id}" value="${sanitizeInput(project.functionName)}" class="w-full p-2 border rounded-md bg-white text-gray-800 border-gray-300">
            </div>
          </div>
          <div class="mt-4 flex gap-4">
            <button class="save-edit-btn bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600" data-project-id="${project.id}">
              Save
            </button>
            <button class="cancel-edit-btn bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300" data-project-id="${project.id}">
              Cancel
            </button>
          </div>
        </div>
      `;
      projectList.appendChild(card);
    });

    document.querySelectorAll('.details-btn').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = parseInt(button.dataset.projectId);
        showJoinProjectModal(projectId);
      });
    });
    document.querySelectorAll('.check-btn').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = parseInt(button.dataset.projectId);
        const project = projects.find(p => p.id === projectId);
        alert(`Check button clicked for project: ${project.name}. Function: ${project.functionName || 'None'}`);
      });
    });
    document.querySelectorAll('.edit-btn').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = parseInt(button.dataset.projectId);
        showEditProjectForm(projectId);
      });
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = parseInt(button.dataset.projectId);
        showDeleteProjectModal(projectId);
      });
    });
    document.querySelectorAll('.contact-btn').forEach(button => {
      button.addEventListener('click', () => {
        if (!activeUser) {
          setStatus('Please log in to contact the project creator.');
          window.location.href = `/auth/google?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        const authorEmail = button.dataset.authorEmail;
        const iframe = document.getElementById('contactIframe');
        iframe.src = `../../../p2p?searchEmail=${encodeURIComponent(authorEmail)}`;
        document.getElementById('contactModal').classList.remove('hidden');
      });
    });
    document.querySelectorAll('.geocode-btn').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = parseInt(button.dataset.projectId);
        geocodeEdit(projectId);
      });
    });
    document.querySelectorAll('.save-edit-btn').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = parseInt(button.dataset.projectId);
        saveEditProject(projectId);
      });
    });
    document.querySelectorAll('.cancel-edit-btn').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = parseInt(button.dataset.projectId);
        cancelEditProject(projectId);
      });
    });
  }

  function showEditProjectForm(projectId) {
    if (!activeUser) {
      setStatus('Please log in');
      return;
    }
    const editForm = document.getElementById(`editProjectForm${projectId}`);
    if (editForm) editForm.classList.remove('hidden');
  }

  function cancelEditProject(projectId) {
    const editForm = document.getElementById(`editProjectForm${projectId}`);
    if (editForm) editForm.classList.add('hidden');
  }

  async function deleteProject(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}?userEmail=${encodeURIComponent(activeUser.email)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`Failed to delete project: ${response.status}`);
      setStatus('Project deleted successfully!', false);
      await loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      setStatus('Failed to delete project');
    }
  }

  function resetCreateForm() {
    document.getElementById('projectTitle').value = '';
    document.getElementById('projectDescription').value = '';
    document.getElementById('projectTheme').value = 'Medicine';
    document.getElementById('projectEventType').value = 'OFFLINE';
    document.getElementById('projectCountry').value = 'Ukraine';
    document.getElementById('projectCity').value = '';
    document.getElementById('projectAddress').value = '';
    document.getElementById('projectContact').value = '';
    document.getElementById('projectImage').value = '';
    document.getElementById('projectLatitude').value = '';
    document.getElementById('projectLongitude').value = '';
    if (tempMarker) {
      map.removeLayer(tempMarker);
      tempMarker = null;
    }
  }

  async function geocodeCreate() {
    const city = document.getElementById('projectCity').value.trim();
    const country = document.getElementById('projectCountry').value.trim();
    const address = document.getElementById('projectAddress').value.trim();

    if (!city || !country) {
      setStatus('Please enter city and country', true);
      return;
    }

    const coords = await geocodeLocation(city, country, address);
    if (coords) {
      document.getElementById('projectLatitude').value = coords.lat;
      document.getElementById('projectLongitude').value = coords.lng;
      if (tempMarker) map.removeLayer(tempMarker);
      tempMarker = L.circleMarker([coords.lat, coords.lng], { color: 'blue', radius: 8 }).addTo(map);
      map.setView([coords.lat, coords.lng], 12);
    } else {
      setStatus('Failed to retrieve coordinates for this location', true);
    }
  }

  async function geocodeEdit(projectId) {
    const city = document.getElementById(`editProjectCity${projectId}`).value.trim();
    const country = document.getElementById(`editProjectCountry${projectId}`).value.trim();
    const address = document.getElementById(`editProjectAddress${projectId}`).value.trim();

    if (!city || !country) {
      setStatus('Please enter city and country', true);
      return;
    }

    const coords = await geocodeLocation(city, country, address);
    if (coords) {
      document.getElementById(`editProjectLatitude${projectId}`).value = coords.lat;
      document.getElementById(`editProjectLongitude${projectId}`).value = coords.lng;
      if (tempMarker) map.removeLayer(tempMarker);
      tempMarker = L.circleMarker([coords.lat, coords.lng], { color: 'blue', radius: 8 }).addTo(map);
      map.setView([coords.lat, coords.lng], 12);
    } else {
      setStatus('Failed to retrieve coordinates for this location', true);
    }
  }

  function populateFilters() {
    const countryFilters = document.getElementById('countryFilters');
    countryFilters.innerHTML = countries.map(country => `
      <div class="filter-item" data-country="${sanitizeInput(country.name)}">
        <img src="${sanitizeInput(country.flag)}" width="20" height="15" alt="${sanitizeInput(country.name)}">
        ${sanitizeInput(country.name)}
      </div>
    `).join('');

    const themeFilters = document.getElementById('themeFilters');
    themeFilters.innerHTML = themes.map(theme => `
      <div class="filter-item" data-theme="${sanitizeInput(theme)}">
        <span class="checkmark" style="background-color: ${themeColors[theme] || 'gray'};"></span>
        ${sanitizeInput(theme)}
      </div>
    `).join('');

    const projectTheme = document.getElementById('projectTheme');
    projectTheme.innerHTML = themes.map(theme => `
      <option value="${sanitizeInput(theme)}">${sanitizeInput(theme)}</option>
    `).join('');

    document.querySelectorAll('#countryFilters .filter-item').forEach(item => {
      item.addEventListener('click', () => {
        item.classList.toggle('selected');
        filterProjects();
      });
    });

    document.querySelectorAll('#themeFilters .filter-item').forEach(item => {
      item.addEventListener('click', () => {
        item.classList.toggle('selected');
        filterProjects();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    populateFilters();

    document.getElementById('searchBar').addEventListener('input', filterProjects);

    document.getElementById('clearFilters').addEventListener('click', clearFilters);

    document.getElementById('showCreateProject').addEventListener('click', () => {
      document.getElementById('createProjectForm').classList.remove('hidden');
    });

    document.getElementById('submitProject').addEventListener('click', createProject);

    document.getElementById('cancelProject').addEventListener('click', () => {
      document.getElementById('createProjectForm').classList.add('hidden');
      resetCreateForm();
    });

    document.getElementById('geocodeCreate').addEventListener('click', geocodeCreate);

    document.getElementById('closeJoinModal').addEventListener('click', closeJoinProjectModal);
    document.getElementById('cancelDeleteProject').addEventListener('click', closeDeleteProjectModal);
    document.getElementById('closeContactModal').addEventListener('click', closeContactModal);

    document.getElementById('showMore').addEventListener('click', () => {
      setStatus('Loading more projects...', false);
      setTimeout(() => setStatus('More projects loaded!', false), 1000);
    });
  });
