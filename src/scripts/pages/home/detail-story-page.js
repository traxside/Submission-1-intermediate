import Story from '../../data/story';
import CONFIG from '../../config';
import { showLoading, showFormattedDate, showAlert, initMap, addMarker } from '../../utils';

export default class DetailStoryPage {
  async render(id) {
    return `
      <div class="skip-link-container">
        <a href="#main-content" class="skip-link">Skip to content</a>
      </div>
      <section class="container detail-story-page" id="main-content">
        <div id="story-detail" class="story-detail"></div>
      </section>
    `;
  }

  async afterRender(id) {
    const storyDetailContainer = document.getElementById('story-detail');
    
    // Show loading
    showLoading(storyDetailContainer);
    
    try {
      // Fetch story detail
      const response = await Story.getById(id);
      
      if (response.error) {
        storyDetailContainer.innerHTML = `<div class="error-message">${response.message}</div>`;
        return;
      }
      
      const { story } = response;
      const hasLocation = story.lat && story.lon;
      
      // Render story detail
      storyDetailContainer.innerHTML = `
        <div class="story-header">
          <a href="#/" class="back-button">
            <i class="fas fa-arrow-left"></i> Back to Stories
          </a>
          <h1 class="story-title">Story by ${story.name}</h1>
        </div>
        
        <div class="story-content">
          <div class="story-image-container">
            <img src="${story.photoUrl}" alt="Story image from ${story.name}" class="story-detail-image">
          </div>
          
          <div class="story-info">
            <p class="story-date"><i class="fas fa-calendar"></i> ${showFormattedDate(story.createdAt)}</p>
            <p class="story-description">${story.description}</p>
            
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
      
      // Initialize map if location exists
      if (hasLocation) {
        // Wait for DOM to be ready
        setTimeout(() => {
          try {
            // Initialize map
            const map = initMap('story-map', {
              center: { lat: story.lat, lng: story.lon },
              zoom: 15
            });
            
            if (map) {
              // Add marker with popup
              addMarker(map, story.lat, story.lon, {
                title: 'Story location',
                popupContent: `<strong>${story.name}'s story</strong><br>Location`
              });
              
              setTimeout(() => {
                map.invalidateSize(true);
              }, 300);
            }
          } catch (error) {
            console.error('Error initializing story map:', error);
            document.getElementById('story-map').innerHTML = '<div class="error-message">Could not load map</div>';
          }
        }, 500);
      }
    } catch (error) {
      storyDetailContainer.innerHTML = `<div class="error-message">Failed to load story: ${error.message}</div>`;
    }
  }
}