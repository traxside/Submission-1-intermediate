import Story from '../../data/story';
import CONFIG from '../../config';
import { showAlert, createCameraElement, initMap, addMarker, updateLocationDisplay } from '../../utils';
import L from 'leaflet';

export default class AddStoryPage {
  constructor() {
    this.camera = null;
    this.map = null;
    this.marker = null;
    this.selectedPosition = null;
    this.photoBlob = null;
    this.mapInitialized = false;
    this.resizeTimeout = null;
    this.markerIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
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
            <div class="map-controls">
              <p class="map-instructions">Click on the map to set your location or use the button below.</p>
              <button type="button" id="use-current-location" class="btn btn-secondary">
                <i class="fas fa-map-marker-alt"></i> Use My Current Location
              </button>
              <button type="button" id="reset-map-view" class="btn btn-outline-secondary">
                <i class="fas fa-sync"></i> Reset Map
              </button>
            </div>
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
    
    // We'll delay map initialization until the form group is visible
    this._setupMapInitialization();
    
    // Set up event listeners
    this._setupEventListeners();
  }
  
  _setupMapInitialization() {
    // Use Intersection Observer to initialize map when it comes into view
    const mapContainer = document.getElementById('location-map');
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.mapInitialized) {
        this._initializeMap();
        this.mapInitialized = true;
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    observer.observe(mapContainer);
    
    // Also initialize if user scrolled to map section manually
    mapContainer.addEventListener('mouseenter', () => {
      if (!this.mapInitialized) {
        this._initializeMap();
        this.mapInitialized = true;
        observer.disconnect();
      }
    }, { once: true });
  }
  
  _initializeMap() {
    try {
      const mapContainer = document.getElementById('location-map');
      
      // Ensure the container has proper height for map display
      if (!mapContainer.style.height) {
        mapContainer.style.height = '400px';
      }
      
      // Initialize map with default location
      this.map = initMap('location-map', {
        center: CONFIG.DEFAULT_LOCATION || { lat: -6.2088, lng: 106.8456 }, // Fallback to Jakarta
        zoom: CONFIG.DEFAULT_ZOOM || 10
      });
      
      // Add click event to map
      this.map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        this._selectPosition(lat, lng);
      });
      
      // Fix map display issues by forcing a resize
      setTimeout(() => {
        this.map.invalidateSize();
      }, 500);
    } catch (error) {
      console.error('Map initialization error:', error);
      showAlert('Failed to initialize map. Please try refreshing the page.', 'error');
    }
  }
  
  _selectPosition(lat, lng) {
    // Update selected position
    this.selectedPosition = { lat, lng };
    
    try {
      // Update marker on map with animation
      if (this.marker) {
        // Update marker position with animation instead of removing/adding
        this.marker.setLatLng([lat, lng]);
      } else {
        // Create marker with proper configuration
        this.marker = L.marker([lat, lng], {
          draggable: true, // Allow users to fine-tune position
          autoPan: true,   // Pan map when dragging to edge
          title: 'Your selected location'
        }).addTo(this.map);
        
        // Add popup with information
        this.marker.bindPopup('Your story location').openPopup();
        
        // Update location when marker is dragged
        this.marker.on('dragend', (e) => {
          const position = e.target.getLatLng();
          this.selectedPosition = { lat: position.lat, lng: position.lng };
          updateLocationDisplay('selected-location', position.lat, position.lng);
        });
      }
      
      // Update display with formatted coordinates
      updateLocationDisplay('selected-location', lat, lng);
    } catch (error) {
      console.error('Error setting map position:', error);
      showAlert('Failed to set map position. Please try again.', 'error');
    }
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
        startCameraButton.disabled = true;
        startCameraButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting camera...';
        
        await this.camera.start();
        
        startCameraButton.innerHTML = '<i class="fas fa-camera"></i> Restart Camera';
        startCameraButton.disabled = false;
        capturePhotoButton.disabled = false;
      } catch (error) {
        startCameraButton.disabled = false;
        startCameraButton.innerHTML = '<i class="fas fa-camera"></i> Start Camera';
        showAlert('Failed to start camera: ' + (error.message || 'Unknown error'), 'error');
      }
    });
    
    capturePhotoButton.addEventListener('click', async () => {
      try {
        capturePhotoButton.disabled = true;
        capturePhotoButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        this.photoBlob = await this.camera.takeSnapshot();
        
        capturePhotoButton.innerHTML = '<i class="fas fa-camera-retro"></i> Retake Photo';
        capturePhotoButton.disabled = false;
      } catch (error) {
        capturePhotoButton.innerHTML = '<i class="fas fa-camera-retro"></i> Take Photo';
        capturePhotoButton.disabled = false;
        showAlert('Failed to capture photo: ' + (error.message || 'Unknown error'), 'error');
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
        useCurrentLocationButton.disabled = true;
        useCurrentLocationButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            this._selectPosition(latitude, longitude);
            this.map.setView([latitude, longitude], 15);
            
            useCurrentLocationButton.disabled = false;
            useCurrentLocationButton.innerHTML = '<i class="fas fa-map-marker-alt"></i> Use My Current Location';
          },
          (error) => {
            showAlert(`Geolocation error: ${error.message}`, 'error');
            useCurrentLocationButton.disabled = false;
            useCurrentLocationButton.innerHTML = '<i class="fas fa-map-marker-alt"></i> Use My Current Location';
          },
          { 
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        showAlert('Geolocation is not supported by your browser', 'error');
      }
    });
    
    // Reset map view
    const resetMapButton = document.getElementById('reset-map-view');
    resetMapButton.addEventListener('click', () => {
      if (this.map) {
        const defaultLocation = CONFIG.DEFAULT_LOCATION || { lat: -6.2088, lng: 106.8456 }; // Fallback to Jakarta
        const defaultZoom = CONFIG.DEFAULT_ZOOM || 10;
        
        this.map.setView([defaultLocation.lat, defaultLocation.lng], defaultZoom);
        
        // Remove existing marker
        if (this.marker) {
          this.map.removeLayer(this.marker);
          this.marker = null;
        }
        
        // Clear selected location
        this.selectedPosition = null;
        document.getElementById('selected-location').innerHTML = '';
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
    
    // Handle window resize events to update map
    window.addEventListener('resize', this._handleResize.bind(this));
  }
  
  _handleResize() {
    // Debounce the resize event
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    
    this.resizeTimeout = setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 250);
  }
  
  _cleanupCamera() {
    if (this.camera) {
      try {
        this.camera.stop();
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
    }
  }

  // Cleanup resources when page is unloaded
  destroy() {
    // Remove event listeners
    window.removeEventListener('resize', this._handleResize.bind(this));
    
    // Clean up map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    
    // Clean up camera
    this._cleanupCamera();
  }
}