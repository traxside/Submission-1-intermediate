import Story from '../../data/story';
import CONFIG from '../../config';
import { createStoryItemTemplate, showLoading, showAlert, initMap, updateLocationDisplay, addMarker} from '../../utils/index';

export default class HomePage {
  constructor() {
    this.map = null;
    this.marker = null;
    this.stories = [];
  }

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

      // Store stories data
      this.stories = response.listStory;
      
      storyListContainer.innerHTML = response.listStory
        .map(story => createStoryItemTemplate(story))
        .join('');
      
      // Setup map modal handlers
      document.querySelectorAll('.map-toggle-button').forEach(button => {
        button.addEventListener('click', (event) => {
          event.preventDefault();

          const storyID = button.dataset.id;
          const { lat, lon } = button.dataset;

          // find story
          const story = this.stories.find(s => s.id === storyID);
          this._showMap(parseFloat(lat), parseFloat(lon), story);
        });
      });
      
      // Close modal on click
      closeModal.addEventListener('click', () => {
        mapModal.classList.remove('show');
        this._cleanupMap();
      });
      
      // Close modal when clicking outside
      window.addEventListener('click', (event) => {
        if (event.target === mapModal) {
          mapModal.classList.remove('show');
          this._cleanupMap()
        }
      });
    } catch (error) {
      storyListContainer.innerHTML = `<div class="error-message">Failed to load stories: ${error.message}</div>`;
    }
  }
  
  _cleanupMap() {
    // Clean existing map instance to prevent error
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

_showMap(lat, lon, story = null) {
    const mapModal = document.getElementById('map-modal');
    const mapContainer = document.getElementById('story-map');
    const locationInfoContainer = document.getElementById('location-info');
    
    // Clean up any existing map before creating a new one
    this._cleanupMap();
    
    // Show modal
    mapModal.classList.add('show');
    
    // Make sure the map container is empty and has dimensions
    mapContainer.style.height = '400px';
    mapContainer.style.width = '100%';
    
    // Initialize map
    this.map = initMap('story-map', {
      center: { lat, lng: lon },
      zoom: 15,
      apiKey: CONFIG.MAP_TILER_KEY
    });
    
    // Only add marker if map was successfully created
    if (this.map) {
      // Add marker
      // this.marker = L.marker([lat, lon]).addTo(this.map);
      this.marker = addMarker(this.map, lat, lon, {
        title: 'Story location',
        popupContent: `<strong>${story.name}'s story</strong><br>Location`
      })
      
      // Display location information
      updateLocationDisplay('location-info', lat, lon, story?.name); //TODO
      
      // Resize map after modal is shown to ensure proper rendering
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize(true);
        }
      }, 300);
    } else {
      locationInfoContainer.innerHTML = `
        <div class="error-message">Failed to initialize map</div>
      `;
    }
  }
}