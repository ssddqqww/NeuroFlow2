        AOS.init();

        // Mock data as a fallback
        const mockNews = [
            {
                title: "Global Efforts to Reduce Carbon Emissions",
                description: "Countries worldwide are adopting new policies to cut carbon emissions by 2030.",
                image: "https://placehold.co/300x200?text=Carbon+Emissions"
            },
            {
                title: "Coral Reef Restoration Success",
                description: "Scientists report progress in restoring damaged coral reefs in the Pacific.",
                image: "https://placehold.co/300x200?text=Coral+Reef"
            },
            {
                title: "Renewable Energy Surges",
                description: "Solar and wind energy adoption reaches record highs in 2025.",
                image: "https://placehold.co/300x200?text=Renewable+Energy"
            },
            {
                title: "Deforestation Rates Decline",
                description: "New conservation efforts lead to a significant drop in deforestation in 2025.",
                image: "https://placehold.co/300x200?text=Deforestation"
            },
            {
                title: "Plastic Waste Reduction Initiatives",
                description: "Global campaigns successfully reduce single-use plastic consumption.",
                image: "https://placehold.co/300x200?text=Plastic+Waste"
            },
            {
                title: "Urban Green Spaces Expansion",
                description: "Cities worldwide invest in green spaces to combat urban heat and pollution.",
                image: "https://placehold.co/300x200?text=Green+Spaces"
            }
        ];

        async function fetchEcologyNews() {
            const apiKey = '7aafc30a5dae0270c0c64f9ea89b3161'; // Replace with your GNews API key
            const url = `https://gnews.io/api/v4/search?q=cyber&lang=en&max=6&token=${apiKey}`;
            const newsContainer = document.getElementById('newsContainer');
            const errorMessage = document.getElementById('errorMessage');

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error('Access denied. Please verify your GNews API key or check plan restrictions.');
                    } else if (response.status === 401) {
                        throw new Error('Invalid API key. Please verify your GNews API key.');
                    } else if (response.status === 429) {
                        throw new Error('Rate limit exceeded. Try again later.');
                    } else if (response.status === 426) {
                        throw new Error('API requires an upgrade. Check GNews plan or protocol requirements.');
                    } else {
                        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                    }
                }
                const data = await response.json();
                const articles = data.articles || [];

                if (articles.length === 0) {
                    throw new Error('No news articles found for the query.');
                }

                newsContainer.innerHTML = ''; // Clear existing content

                articles.forEach((article, index) => {
                    const newsItem = document.createElement('div');
                    newsItem.className = 'news-item';
                    newsItem.setAttribute('data-aos', 'fade-up');
                    newsItem.setAttribute('data-aos-delay', `${100 * (index + 1)}`);

                    const imageUrl = article.image || 'https://placehold.co/300x200?text=No+Image';
                    // Alternative: Use local image if available
                    // const imageUrl = article.image || '/images/placeholder.jpg';
                    const title = article.title || 'No Title';
                    const description = article.description || 'No description available.';

                    newsItem.innerHTML = `
                        <img src="${imageUrl}" alt="${title}">
                        <h3>${title}</h3>
                        <p>${description}</p>
                    `;

                    newsContainer.appendChild(newsItem);
                });

                AOS.refresh(); // Refresh AOS to include new elements
            } catch (error) {
                console.error('Error fetching news:', error.message);
                errorMessage.textContent = error.message || 'Failed to load news. Displaying sample data.';
                errorMessage.style.display = 'block';

                // Fallback to mock data
                newsContainer.innerHTML = '';
                mockNews.forEach((article, index) => {
                    const newsItem = document.createElement('div');
                    newsItem.className = 'news-item';
                    newsItem.setAttribute('data-aos', 'fade-up');
                    newsItem.setAttribute('data-aos-delay', `${100 * (index + 1)}`);

                    newsItem.innerHTML = `
                        <img src="${article.image}" alt="${article.title}">
                        <h3>${article.title}</h3>
                        <p>${article.description}</p>
                    `;

                    newsContainer.appendChild(newsItem);
                });

                AOS.refresh();
            }
        }

        // Fetch news when the page loads
        document.addEventListener('DOMContentLoaded', fetchEcologyNews);
