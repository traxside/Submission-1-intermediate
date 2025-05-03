import Story from '../../data/story';
import CONFIG from '../../config';
import { showAlert, createCameraElement, initMap } from '../../utils';

export default class AddStoryPage {
  constructor() {
    this.camera = null;
    this.map = null;
    this.marker = null;
    this.selectedPosition = null;
    this.photoBlob = null;
  }

  async render() {
    return `
      <div class="skip-link-container">
        <a href="#main-content" class="skip-link">Skip to content</a>
      </div>
      <section class="container add-story-page" id="main-content">
        <h1 class="page-title">Share Your Story</h1>
        
        <form id="add-story-form" class="add-story-form">
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" name="description" rows="4" required></textarea>
          </div>
          
          <div class="form-group">
            <label for="photo">Photo</label>
            <div class="photo-input-container">
              <div class="tabs">
                <button type="button" id="camera-tab" class="tab-button active">Camera</button>
                <button type="button" id="upload-tab" class="tab-button">Upload</button>
              </div>
              
              <div id="camera-container" class="tab-content active">
                <div id="video-container" class="video-container"></div>
                <div class="camera-controls">
                  <button type="button" id="start-camera" class="btn btn-secondary">
                    <i class="fas fa-camera"></i> Start Camera
                  </button>
                  <button type="button" id="capture-photo" class="btn btn-primary" disabled>
                    <i class="fas fa-camera-retro"></i> Take Photo
                  </button>
                </div>
              </div>
              
              <div id="upload-container" class="tab-content">
                <input type="file" id="photo-upload" name="photo" accept="image/*">
                <label for="photo-upload" class="file-input-label">
                  <i class="fas fa-upload"></i> Choose a file
                </label>
              </div>
              
              <div id="snapshot-container" class="snapshot-container"></div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="location">Location</label>
            <div id="location-map" class="location-map"></div>
            <p class="map-instructions">Click on the map to set your location or use the button below.</p>
            <button type="button" id="use-current-location" class="btn btn-secondary">
              <i class="fas fa-map-marker-alt"></i> Use My Current Location
            </button>
            <div id="selected-location" class="selected-location"></div>
          </div>
          
          <button type="submit" id="submit-story" class="btn btn-primary">Share Story</button>
        </form>
      </section>
    `;
  }

  async afterRender() {
    // Initialize camera
    this.camera = createCameraElement('video-container', 'snapshot-container');
    
    // Initialize map
    this._initializeMap();
    
    // Set up event listeners
    this._setupEventListeners();
  }
  
  _initializeMap() {
    // Initialize map with default location
    this.map = initMap('location-map', {
      center: CONFIG.DEFAULT_LOCATION,
      zoom: CONFIG.DEFAULT_ZOOM,
      apiKey: CONFIG.MAP_TILER_KEY
    });
    
    // Add click event to map
    this.map.on('click', (e) => {
      this._selectPosition(e.latlng.lat, e.latlng.lng);
    });
  }
  
  _setupEventListeners() {
    // Camera tab switching
    const cameraTab = document.getElementById('camera-tab');
    const uploadTab = document.getElementById('upload-tab');
    const cameraContainer = document.getElementById('camera-container');
    const uploadContainer = document.getElementById('upload-container');
    
    cameraTab.addEventListener('click', () => {
      cameraTab.classList.add('active');
      uploadTab.classList.remove('active');
      cameraContainer.classList.add('active');
      uploadContainer.classList.remove('active');
    });
    
    uploadTab.addEventListener('click', () => {
      uploadTab.classList.add('active');
      cameraTab.classList.remove('active');
      uploadContainer.classList.add('active');
      cameraContainer.classList.remove('active');
      
      // Stop camera if running
      this.camera.stop();
      document.getElementById('capture-photo').disabled = true;
      document.getElementById('start-camera').disabled = false;
    });
    
    // Camera controls
    const startCameraButton = document.getElementById('start-camera');
    const capturePhotoButton = document.getElementById('capture-photo');
    
    startCameraButton.addEventListener('click', async () => {
      try {
        await this.camera.start();
        startCameraButton.disabled = true;
        capturePhotoButton.disabled = false;
      } catch (error) {
        showAlert('Failed to start camera', 'error');
      }
    });
    
    capturePhotoButton.addEventListener('click', async () => {
      try {
        this.photoBlob = await this.camera.takeSnapshot();
        capturePhotoButton.textContent = 'Retake Photo';
      } catch (error) {
        showAlert('Failed to capture photo', 'error');
      }
    });
    
    // File upload
    const photoUpload = document.getElementById('photo-upload');
    photoUpload.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.photoBlob = e.target.files[0];
        
        // Preview uploaded image
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('snapshot-container').innerHTML = `
            <img src="${event.target.result}" alt="Uploaded preview" class="snapshot-preview">
          `;
        };
        reader.readAsDataURL(this.photoBlob);
      }
    });
    
    // Current location
    const useCurrentLocationButton = document.getElementById('use-current-location');
    useCurrentLocationButton.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            this._selectPosition(latitude, longitude);
            this.map.setView([latitude, longitude], 15);
          },
          (error) => {
            showAlert(`Geolocation error: ${error.message}`, 'error');
          }
        );
      } else {
        showAlert('Geolocation is not supported by your browser', 'error');
      }
    });
    
    // Form submission
    const addStoryForm = document.getElementById('add-story-form');
    addStoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const description = document.getElementById('description').value;
      
      if (!description) {
        showAlert('Please enter a description', 'error');
        return;
      }
      
      if (!this.photoBlob) {
        showAlert('Please take or upload a photo', 'error');
        return;
      }
      
      try {
        // Prepare location data
        let lat = null;
        let lon = null;
        
        if (this.selectedPosition) {
          lat = this.selectedPosition.lat;
          lon = this.selectedPosition.lng;
        }
        
        // Submit the story
        const response = await Story.add(description, this.photoBlob, lat, lon);
        
        if (response.error) {
          showAlert(response.message, 'error');
          return;
        }
        
        showAlert('Story shared successfully!', 'success');
        
        // Clean up
        this.camera.stop();
        
        // Redirect to home page
        setTimeout(() => {
          window.location.hash = '#/';
        }, 1500);
      } catch (error) {
        showAlert(`Failed to share story: ${error.message}`, 'error');
      }
    });
  }
  
  _selectPosition(lat, lng) {
    // Update selected position
    this.selectedPosition = { lat, lng };
    
    // Update marker on map
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    
    this.marker = L.marker([lat, lng]).addTo(this.map);
    
    // Update display
    document.getElementById('selected-location').innerHTML = `
      <p>Selected location: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
    `;
  }
}