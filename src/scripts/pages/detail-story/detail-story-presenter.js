import Story from '../../data/story';
import { initMap, addMarker } from '../../utils';

export default class DetailStoryPresenter {
  #view;
  #model; // Save response API (apimodel)
  #id;
  #story = null;
  #map = null;
  #dbModel

  constructor({ view, model, id , dbModel }) {
    this.#view = view;
    this.#model = model || Story;
    this.#id = id;
    this.#dbModel = dbModel;
  }

  async loadStoryDetail() {
    try {
      this.#view.showLoading();
      
      const response = await this.#model.getById(this.#id);
      
      if (response.error) {
        this.#view.showErrorMessage(response.message);
        return;
      }
      
      this.#story = response.story;
      this.#view.showStoryDetail(this.#story);
      
      // Initialize map if location exists
      if (this.#story.lat && this.#story.lon) {
        setTimeout(() => this._initializeMap(), 500);
      }
    } catch (error) {
      this.#view.showErrorMessage(`Failed to load story: ${error.message}`);
    }
  }
  
  _initializeMap() {
    try {
      // Initialize map
      this.#map = initMap('story-map', {
        center: { lat: this.#story.lat, lng: this.#story.lon },
        zoom: 15
      });
      
      if (this.#map) {
        // Add marker with popup
        addMarker(this.#map, this.#story.lat, this.#story.lon, {
          title: 'Story location',
          popupContent: `<strong>${this.#story.name}'s story</strong><br>Location`
        });
        
        setTimeout(() => {
          this.#map.invalidateSize(true);
        }, 300);
      }
    } catch (error) {
      console.error('Error initializing story map:', error);
      this.#view.showMapError();
    }
  }

  async saveStory() {
    try {
      const response = await this.#model.getById(this.#id);
      console.log('this story is from presenter saveStory() :', response);
      await this.#dbModel.putStory(response.story);
      this.#view.saveToBookmarkSuccessfully(response);
    }
    catch (error) {
      console.error('saveStory: error:', error);
      this.#view.saveToBookmarkFailed(error.message);
    }
  }

  async deleteStory() {
    try {
      await this.#dbModel.removeStory(this.#id);

      this.#view.removeFromBookmarkSuccessfully('Successfully to remove from bookmark');
    }
    catch (error) {
      console.error('removeStory: error:', error);
      this.#view.removeFromBookmarkFailed(error.message);
    }
  }

  async showSaveButton() {
    if (await this.#isReportSaved()) {
      this.#view.renderRemoveButton();
      return;
    }

    this.#view.renderSaveButton();
  }

  async #isReportSaved() {
    return !!(await this.#dbModel.getStoryById(this.#id));
  }


}