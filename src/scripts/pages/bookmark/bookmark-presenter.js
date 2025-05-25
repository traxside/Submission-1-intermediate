import { initMap, addMarker } from '../../utils/index';

export default class BookmarkPresenter {
  #view;
  #model;
  #bookmarkedStories = [];
  #storyMaps = {};

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model; // Database object
  }

  async initializeBookmarkPage() {
    try {
      this.#view.showLoading();

      // Get all bookmarked stories from IndexedDB
      const bookmarkedStories = await this.#model.getAllStories();
      console.log('bookmarkedStories : ', bookmarkedStories);

      if (!bookmarkedStories || bookmarkedStories.length === 0) {
        this.#view.showEmptyMessage();
        return;
      }

      // Sort stories by creation date (newest first)
      const sortedStories = bookmarkedStories.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Store stories data for later use
      this.#bookmarkedStories = sortedStories;

      // Display the stories using the view
      this.#view.showBookmarkedStories(sortedStories);

      // Display how many story bookmarked (saved)
      this.#view.showCountBookmark(sortedStories);

      setTimeout(() => {
        this.setupInlineMaps();
      }, 100);

    } catch (error) {
      console.error('Error loading bookmarked stories:', error);
      this.#view.showErrorMessage(`Failed to load bookmarked stories: ${error.message}`);
    }
  }


  findStoryById(id) {
    return this.#bookmarkedStories.find(story => story.id === id);
  }

  setupInlineMaps() {
    // Find all map containers in the bookmark page
    const mapContainers = document.querySelectorAll('.story-map-container');

    if (mapContainers.length === 0) {
      console.log('No map containers found');
      return;
    }

    console.log(`Setting up ${mapContainers.length} inline maps`);

    // Initialize maps for each story that has location data
    mapContainers.forEach((container, index) => {
      const storyID = container.dataset.id;
      const lat = parseFloat(container.dataset.lat);
      const lon = parseFloat(container.dataset.lon);
      const mapElementId = `map-${storyID}`;

      // Validate coordinates
      if (isNaN(lat) || isNaN(lon)) {
        console.warn(`Invalid coordinates for story ${storyID}: lat=${lat}, lon=${lon}`);
        return;
      }

      console.log(`Initializing map ${index + 1} for story ${storyID} at ${lat}, ${lon}`);

      // Clean up any existing map for this story
      if (this.#storyMaps[storyID]) {
        try {
          this.#storyMaps[storyID].map.remove();
        } catch (e) {
          console.warn('Error removing existing map:', e);
        }
        this.#storyMaps[storyID] = null;
      }

      // Initialize the map
      const map = initMap(mapElementId, {
        center: { lat, lng: lon },
        zoom: 13
      });

      if (map) {
        // Find the story data for popup content
        const story = this.findStoryById(storyID);

        // Add marker with popup
        const marker = addMarker(map, lat, lon, {
          title: `${story?.name || 'Story'} location`,
          popupContent: `
            <div style="text-align: center;">
              <strong>${story?.name || 'Unknown'}'s Story</strong><br>
              <small>Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}</small>
            </div>
          `
        });

        // Store references for cleanup later
        this.#storyMaps[storyID] = { map, marker };

        // Fix map rendering issues by invalidating size after initialization
        setTimeout(() => {
          if (map && typeof map.invalidateSize === 'function') {
            map.invalidateSize(true);
          }
        }, 300);

        console.log(`Map initialized successfully for story ${storyID}`);
      } else {
        console.warn(`Failed to initialize map for story ${storyID}`);
      }
    });
  }

  // Clean up maps when navigating away from the page
  cleanup() {
    console.log('Cleaning up bookmark presenter...');

    // Clean up all maps
    Object.entries(this.#storyMaps).forEach(([storyId, { map }]) => {
      if (map && typeof map.remove === 'function') {
        try {
          map.remove();
          console.log(`Map for story ${storyId} cleaned up`);
        } catch (e) {
          console.warn(`Error cleaning up map for story ${storyId}:`, e);
        }
      }
    });

    // Reset state
    this.#storyMaps = {};
    this.#bookmarkedStories = [];
  }
}