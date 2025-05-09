import Story from '../../data/story';
import CONFIG from '../../config';
import { createStoryItemTemplate, showLoading, showAlert, initMap } from '../../utils';

export default class HomePage {
  async render() {
    return `
      <section class="container home-page">
        <h1 class="page-title">Latest Stories</h1>
        <div id="main-content" class="story-list-container">
          <div id="story-list" class="story-list"></div>
        </div>
        
        <div id="map-modal" class="modal">
          <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Story Location</h2>
            <div id="story-map" class="story-map"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const storyListContainer = document.getElementById('story-list');
    const mapModal = document.getElementById('map-modal');
    const closeModal = document.querySelector('.close-modal');
    
    // Show loading indicator
    showLoading(storyListContainer);
    
    try {
      // Fetch stories data
      const response = await Story.getAll({ location: 1 });
      
      if (response.error) {
        storyListContainer.innerHTML = `<div class="error-message">${response.message}</div>`;
        return;
      }
      
      // Render stories
      if (response.listStory.length === 0) {
        storyListContainer.innerHTML = '<div class="empty-message">No stories found</div>';
        return;
      }
      
      storyListContainer.innerHTML = response.listStory
        .map(story => createStoryItemTemplate(story))
        .join('');
      
      // Setup map modal handlers
      document.querySelectorAll('.map-toggle-button').forEach(button => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          
          const { lat, lon } = button.dataset;
          this._showMap(parseFloat(lat), parseFloat(lon));
        });
      });
      
      // Close modal on click
      closeModal.addEventListener('click', () => {
        mapModal.classList.remove('show');
      });
      
      // Close modal when clicking outside
      window.addEventListener('click', (event) => {
        if (event.target === mapModal) {
          mapModal.classList.remove('show');
        }
      });
    } catch (error) {
      storyListContainer.innerHTML = `<div class="error-message">Failed to load stories: ${error.message}</div>`;
    }
  }
  
  _showMap(lat, lon) {
    const mapModal = document.getElementById('map-modal');
    const mapContainer = document.getElementById('story-map');
    
    // Show modal
    mapModal.classList.add('show');
    
    // Initialize map
    const map = initMap('story-map', {
      center: { lat, lng: lon },
      zoom: 15,
      apiKey: CONFIG.MAP_TILER_KEY
    });
    
    // Add marker
    L.marker([lat, lon]).addTo(map);
    
    // Resize map after modal is shown
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }
}