export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function showLoading(element) {
  element.innerHTML = `
    <div class="loading-container">
      <div class="lds-ripple"><div></div><div></div></div>
    </div>
  `;
}

export function showAlert(message, type = 'info', duration = 3000) {
  const alertContainer = document.createElement('div');
  alertContainer.className = `alert alert-${type}`;
  alertContainer.textContent = message;
  
  document.body.appendChild(alertContainer);
  
  // Animation to show alert
  setTimeout(() => {
    alertContainer.classList.add('show');
  }, 100);
  
  // Remove alert after duration
  setTimeout(() => {
    alertContainer.classList.remove('show');
    setTimeout(() => {
      alertContainer.remove();
    }, 500);
  }, duration);
}

export function createStoryItemTemplate(story) {
  const hasLocation = story.lat && story.lon;
  
  return `
    <article class="story-item">
      <div class="story-image-container">
        <img class="story-image lazyload" 
          src="${story.photoUrl}" 
          alt="Story image from ${story.name}" 
          loading="lazy">
      </div>
      <div class="story-content">
        <h3 class="story-name">${story.name}</h3>
        <p class="story-description">${story.description}</p>
        <div class="story-meta">
          <p class="story-date">${showFormattedDate(story.createdAt)}</p>
          ${hasLocation ? `<button class="map-toggle-button" data-id="${story.id}" data-lat="${story.lat}" data-lon="${story.lon}">
            <i class="fas fa-map-marker-alt"></i> Show on map
          </button>` : ''}
        </div>
      </div>
      <a href="#/story/${story.id}" class="story-link" aria-label="View details of story by ${story.name}"></a>
    </article>
  `;
}

export function initMap(containerId, options = {}) {
  const { lat, lng } = options.center || { lat: -6.2088, lng: 106.8456 }; // Default to Jakarta
  const zoom = options.zoom || 10;
  
  // Initialize the map
  const map = L.map(containerId).setView([lat, lng], zoom);
  
  // Add tile layers
  const standardLayer = L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key={apiKey}', {
    attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
    apiKey: options.apiKey,
    tileSize: 512,
    zoomOffset: -1
  });
  
  const satelliteLayer = L.tileLayer('https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key={apiKey}', {
    attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
    apiKey: options.apiKey,
    tileSize: 512,
    zoomOffset: -1
  });
  
  const darkLayer = L.tileLayer('https://api.maptiler.com/maps/darkmatter/{z}/{x}/{y}.png?key={apiKey}', {
    attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
    apiKey: options.apiKey,
    tileSize: 512,
    zoomOffset: -1
  });
  
  // Add layer control
  const baseMaps = {
    "Standard": standardLayer,
    "Satellite": satelliteLayer,
    "Dark": darkLayer
  };
  
  // Add the default layer
  standardLayer.addTo(map);
  
  // Add layer control
  L.control.layers(baseMaps).addTo(map);
  
  return map;
}

export function createCameraElement(videoContainerId, snapshotContainerId) {
  let stream = null;
  let videoElement = null;
  
  const startCamera = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      });
      
      const videoContainer = document.getElementById(videoContainerId);
      videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.classList.add('camera-preview');
      
      videoContainer.innerHTML = '';
      videoContainer.appendChild(videoElement);
      
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      showAlert('Could not access camera. Please make sure you have granted permission.', 'error');
      throw error;
    }
  };
  
  const takeSnapshot = () => {
    if (!videoElement || !stream) {
      showAlert('Camera is not initialized', 'error');
      return null;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    const snapshotContainer = document.getElementById(snapshotContainerId);
    snapshotContainer.innerHTML = `
      <img src="${canvas.toDataURL('image/jpeg')}" alt="Camera snapshot" class="snapshot-preview">
    `;
    
    // Return the blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
      
      if (videoElement) {
        videoElement.srcObject = null;
      }
    }
  };
  
  return {
    start: startCamera,
    takeSnapshot,
    stop: stopCamera
  };
}