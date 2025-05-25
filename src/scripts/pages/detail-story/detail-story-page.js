import DetailStoryPresenter from './detail-story-presenter.js';
import Story from '../../data/story';
import { showLoading, showFormattedDate } from '../../utils';
import Database from  '../../data/database';

export default class DetailStoryPage {
  #presenter;

  constructor() {
    // Presenter will be initialized in afterRender with the story ID
  }
  
  async render() {
    return `
      <div id="story-detail" class="story-detail"></div>
    `;
  }

  async afterRender(id) {
    this.#presenter = new DetailStoryPresenter({ 
      view: this,
      model: Story,
      id,
      dbModel: Database,
    });

    await this.#presenter.loadStoryDetail();

    await this.#presenter.showSaveButton(); // Initialize listener
  }
  
  showLoading() {
    const storyDetailContainer = document.getElementById('story-detail');
    showLoading(storyDetailContainer);
  }
  
  showErrorMessage(message) {
    const storyDetailContainer = document.getElementById('story-detail');
    storyDetailContainer.innerHTML = `<div class="error-message">${message}</div>`;
  }
  
  showStoryDetail(story) {
    const storyDetailContainer = document.getElementById('story-detail');
    const hasLocation = story.lat && story.lon;
    
    storyDetailContainer.innerHTML = `
      <div class="story-header">
        <a href="#/" class="back-button">
          <i class="fas fa-arrow-left"></i> Back to Stories
        </a>
        <h1 class="story-title">Story by ${story.name}</h1>
        <div class="button-container"></div>
      </div>
      
      <div class="story-content">
        <div class="story-detail-image-container">
          <img src="${story.photoUrl}" alt="Story image from ${story.name}" class="story-detail-image">
        </div>
        
        <div class="story-info">
          <p class="story-date"><i class="fas fa-calendar"></i> ${showFormattedDate(story.createdAt)}</p>
          <p class="story-detail-description">${story.description}</p>
          
          ${hasLocation ? `
            <div class="story-location">
              <h3><i class="fas fa-map-marker-alt"></i> Location</h3>
              <div id="story-map" class="story-detail-map" style="height: 400px; width: 100%;"></div>
              <p class="location-coordinates">
                <i class="fas fa-crosshairs"></i> Coordinates: ${parseFloat(story.lat).toFixed(6)}, ${parseFloat(story.lon).toFixed(6)}
              </p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  showMapError() {
    const mapContainer = document.getElementById('story-map');
    if (mapContainer) {
      mapContainer.innerHTML = '<div class="error-message">Could not load map</div>';
    }
  }

  renderSaveButton() {
    document.querySelector('.button-container').innerHTML =
        this.generateSaveStoryButtonTemplate();

    document.querySelector('#story-detail-save').addEventListener('click', async () => {
      await this.#presenter.saveStory();
      await this.#presenter.showSaveButton();
    })
  }

  renderRemoveButton() {
    document.querySelector('.button-container').innerHTML =
        this.generateRemoveStoryButtonTemplate();

    document.querySelector('#story-detail-remove').addEventListener('click', async () => {
      await this.#presenter.deleteStory();
      await this.#presenter.showSaveButton();
    })
  }

  saveToBookmarkSuccessfully(message) {
    console.log(message);
  }

  saveToBookmarkFailed(message) {
    alert(message);
  }

  removeFromBookmarkSuccessfully(message) {
    console.log(message);
  }
  removeFromBookmarkFailed(message) {
    alert(message);
  }

  generateSaveStoryButtonTemplate() {
    return `
    <button id="story-detail-save" class="btn btn-transparent">
      Simpan story <i class="far fa-bookmark"></i>
    </button>
  `;
  }

  generateRemoveStoryButtonTemplate() {
    return `
    <button id="story-detail-remove" class="btn btn-transparent">
      Buang story <i class="fas fa-bookmark"></i>
    </button>
  `;
  }
}