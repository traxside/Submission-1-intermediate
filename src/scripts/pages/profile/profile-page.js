import Auth from '../../data/auth';
import { showAlert } from '../../utils';

export default class ProfilePage {
  async render() {
    return `
      <div class="skip-link-container">
        <a href="#main-content" class="skip-link">Skip to content</a>
      </div>
      <section class="container profile-page" id="main-content">
        <h1 class="page-title">Your Profile</h1>
        
        <div class="profile-content">
          <div class="profile-section">
            <div class="profile-avatar">
              <i class="fas fa-user-circle"></i>
            </div>
            <div id="profile-info" class="profile-info"></div>
          </div>
          
          <div class="profile-section">
            <h2><i class="fas fa-cog"></i> Account Settings</h2>
            <button id="logout-button" class="btn btn-danger">
              <i class="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const profileInfo = document.getElementById('profile-info');
    const logoutButton = document.getElementById('logout-button');
    
    // Get user information
    const user = Auth.getUser();
    
    if (!user) {
      // Redirect to login if no user found
      window.location.hash = '#/login';
      return;
    }
    
    // Display user information
    profileInfo.innerHTML = `
      <h2>${user.name}</h2>
      <p>User ID: ${user.id}</p>
    `;
    
    // Add logout handler
    logoutButton.addEventListener('click', () => {
      Auth.logout();
      showAlert('You have been logged out', 'info');
      
      // Redirect to home page
      setTimeout(() => {
        window.location.hash = '#/';
      }, 1500);
    });
  }
}