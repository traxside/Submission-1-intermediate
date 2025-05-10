import Story from '../../data/story';
import CONFIG from '../../config';
import { initMap, addMarker } from '../../utils/index';

export default class HomePresenter {
  #view;
  #model;
  #stories = [];
  #map = null;
  #marker = null;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model || Story;
  }

  async loadStories() {
    try {
      this.#view.showLoading();
      
      const response = await this.#model.getAll({ location: 1 });
      
      if (response.error) {
        this.#view.showErrorMessage(response.message);
        return;
      }
      
      if (response.listStory.length === 0) {
        this.#view.showEmptyMessage();
        return;
      }

      // Store stories data
      this.#stories = response.listStory;
      this.#view.showStories(response.listStory);
      
    } catch (error) {
      this.#view.showErrorMessage(`Failed to load stories: ${error.message}`);
    }
  }

  getStories() {
    return this.#stories;
  }

  findStoryById(id) {
    return this.#stories.find(story => story.id === id);
  }

  showStoryMap(storyId, lat, lon) {
    const story = this.findStoryById(storyId);
    
    if (!story) {
      this.#view.showErrorMessage('Story not found');
      return;
    }
    
    this.#view.showMapModal();
    
    // Clean up existing map
    this._cleanupMap();
    
    // Initialize new map
    this.#map = initMap('story-map', {
      center: { lat, lng: lon },
      zoom: 15,
      apiKey: CONFIG.MAP_TILER_KEY
    });
    
    if (this.#map) {
      // Add marker
      this.#marker = addMarker(this.#map, lat, lon, {
        title: 'Story location',
        popupContent: `<strong>${story.name}'s story</strong><br>Location`
      });
      
      // Resize map after modal is shown
      setTimeout(() => {
        if (this.#map) {
          this.#map.invalidateSize(true);
        }
      }, 300);
    } else {
      this.#view.showMapError();
    }
  }
  
  closeMap() {
    this._cleanupMap();
  }
  
  _cleanupMap() {
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
      this.#marker = null;
    }
  }
}