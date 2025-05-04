import Story from '../../data/story';
import CONFIG from '../../config';
import { showLoading, showFormattedDate, showAlert, initMap } from '../../utils';

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
                <div id="story-map" class="story-detail-map"></div>
                <p class="location-coordinates">
                  <i class="fas fa-crosshairs"></i> Coordinates: ${parseFloat(story.lat).toFixed(6)}, ${parseFloat(story.lon).toFixed(6)}
                </p>
              </div>
            ` : ''}
          </div>
        </div>
      `;
      
      // Initialize map if location exists with enhanced functionality
      if (hasLocation) {
        setTimeout(() => {
          const map = initMap('story-map', {
            center: { lat: story.lat, lng: story.lon },
            zoom: 15
          });
          
          // Add a highly visible marker
          addMarker(map, story.lat, story.lon, {
            title: 'Story location',
            popupContent: `<strong>Story location</strong><br>\${story.name}'s story`
          });
          
          // Ensure map renders correctly
          setTimeout(() => map.invalidateSize(), 300);
        }, 100);
      }
    } catch (error) {
      storyDetailContainer.innerHTML = `<div class="error-message">Failed to load story: ${error.message}</div>`;
    }
  }
}