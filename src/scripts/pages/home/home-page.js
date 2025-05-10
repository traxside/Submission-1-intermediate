import HomePresenter from './home-presenter.js';
import Story from '../../data/story';
import { createStoryItemTemplate, showLoading, updateLocationDisplay } from '../../utils/index';

export default class HomePage {
  #presenter;
  
  constructor() {
    this.#presenter = new HomePresenter({ 
      view: this,
      model: Story
    });
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
            <div id="location-info"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.#presenter.loadStories();
    this._setupEventListeners();
  }
  
  _setupEventListeners() {
    const mapModal = document.getElementById('map-modal');
    const closeModal = document.querySelector('.close-modal');
    
    // Setup map modal handlers
    document.querySelectorAll('.map-toggle-button').forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();

        const storyID = button.dataset.id;
        const { lat, lon } = button.dataset;

        this.#presenter.showStoryMap(storyID, parseFloat(lat), parseFloat(lon));
      });
    });
    
    // Close modal on click
    closeModal.addEventListener('click', () => {
      mapModal.classList.remove('show');
      this.#presenter.closeMap();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === mapModal) {
        mapModal.classList.remove('show');
        this.#presenter.closeMap();
      }
    });
  }
  
  showLoading() {
    const storyListContainer = document.getElementById('story-list');
    showLoading(storyListContainer);
  }
  
  showErrorMessage(message) {
    const storyListContainer = document.getElementById('story-list');
    storyListContainer.innerHTML = `<div class="error-message">${message}</div>`;
  }
  
  showEmptyMessage() {
    const storyListContainer = document.getElementById('story-list');
    storyListContainer.innerHTML = '<div class="empty-message">No stories found</div>';
  }
  
  showStories(stories) {
    const storyListContainer = document.getElementById('story-list');
    storyListContainer.innerHTML = stories
      .map(story => createStoryItemTemplate(story))
      .join('');
  }
  
  showMapModal() {
    const mapModal = document.getElementById('map-modal');
    const mapContainer = document.getElementById('story-map');
    
    // Show modal
    mapModal.classList.add('show');
    
    // Make sure the map container is empty and has dimensions
    mapContainer.style.height = '400px';
    mapContainer.style.width = '100%';
  }
  
  showMapError() {
    const locationInfoContainer = document.getElementById('location-info');
    locationInfoContainer.innerHTML = `
      <div class="error-message">Failed to initialize map</div>
    `;
  }
}