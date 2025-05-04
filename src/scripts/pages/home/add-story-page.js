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
    // Initialize map with default location
    this.map = initMap('location-map', {
      center: CONFIG.DEFAULT_LOCATION,
      zoom: CONFIG.DEFAULT_ZOOM
    });
    
    // Add click event to map
    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      // Update selected position
      this.selectedPosition = { lat, lng };
      
      // Update marker on map
      if (this.marker) {
        this.map.removeLayer(this.marker);
      }
      
      this.marker = addMarker(this.map, lat, lng, {
        draggable: true,
        title: 'Your selected location'
      });
      
      // Update display
      updateLocationDisplay('selected-location', lat, lng);
    });
    
    // Fix map display issues by forcing a resize
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 500);
    });
    
    // Ensure map renders correctly when tab/container becomes visible
    const resizeMap = () => {
      if (this.map) {
        this.map.invalidateSize();
      }
    };
    
    // Add resize handler for various scenarios
    window.addEventListener('resize', resizeMap);
    
    // Fix for tab switching
    const tabs = document.querySelectorAll('.tab-button');
    if (tabs) {
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          setTimeout(resizeMap, 100);
        });
      });
    }
  }
  
  _selectPosition(lat, lng) {
    // Update selected position
    this.selectedPosition = { lat, lng };
    
    // Update marker on map
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    
    this.marker = addMarker(this.map, lat, lng, {
      draggable: true,
      title: 'Your selected location'
    });
    
    // Center map on the location
    this.map.setView([lat, lng], 15);
    
    // Update display
    updateLocationDisplay('selected-location', lat, lng);
  }
  
  _preloadMapTiles() {
    // Preload tiles around the visible area for smoother panning
    const bounds = this.map.getBounds();
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    
    // Calculate extended bounds to preload
    const extendedBounds = bounds.pad(0.5); // 50% larger area
    
    // Manually request tiles in the extended area
    const tilesToLoad = [];
    for (let z = zoom - 1; z <= zoom + 1; z++) {
      if (z < 0 || z > 19) continue;
      
      const northEast = extendedBounds.getNorthEast();
      const southWest = extendedBounds.getSouthWest();
      
      // Convert to tile coordinates
      const neTile = this._latLngToTile(northEast.lat, northEast.lng, z);
      const swTile = this._latLngToTile(southWest.lat, southWest.lng, z);
      
      // Limit the number of tiles to preload
      const maxTiles = 9;
      const xTiles = Math.min(neTile.x - swTile.x + 1, maxTiles);
      const yTiles = Math.min(neTile.y - swTile.y + 1, maxTiles);
      
      // Add tiles to load
      for (let x = 0; x < xTiles; x++) {
        for (let y = 0; y < yTiles; y++) {
          const tileUrl = `https://api.maptiler.com/maps/streets/${z}/${swTile.x + x}/${swTile.y + y}.png?key=${CONFIG.MAP_TILER_KEY}`;
          tilesToLoad.push(tileUrl);
        }
      }
    }
    
    // Preload tiles
    tilesToLoad.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }
  
  _latLngToTile(lat, lng, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x, y };
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
        this.map.setView(CONFIG.DEFAULT_LOCATION, CONFIG.DEFAULT_ZOOM);
        
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
  
  _selectPosition(lat, lng) {
    // Update selected position
    this.selectedPosition = { lat, lng };
    
    // Update marker on map with animation
    if (this.marker) {
      // Update marker position with animation instead of removing/adding
      this.marker.setLatLng([lat, lng]);
    } else {
      // Create marker with animation
      this.marker = L.marker([lat, lng], {
        icon: this.markerIcon,
        draggable: true, // Allow users to fine-tune position
        autoPan: true,   // Pan map when dragging to edge
        bounceOnAdd: true, // Visual feedback animation
        title: 'Your selected location'
      }).addTo(this.map);
      
      // Add popup with information
      this.marker.bindPopup('Your story location').openPopup();
      
      // Update location when marker is dragged
      this.marker.on('dragend', (e) => {
        const position = e.target.getLatLng();
        this._selectPosition(position.lat, position.lng);
      });
    }
    
    // Update display with formatted coordinates
    document.getElementById('selected-location').innerHTML = `
      <div class="location-info">
        <i class="fas fa-check-circle"></i> Location selected
        <span class="coordinates">
          Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}
        </span>
      </div>
    `;
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
    if (this.camera) {
      this.camera.stop();
    }
  }
}