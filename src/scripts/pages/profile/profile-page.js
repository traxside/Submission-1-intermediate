import ProfilePresenter from './profile-presenter.js';
import Auth from '../../data/auth';

export default class ProfilePage {
  #presenter;

  constructor() {
    this.#presenter = new ProfilePresenter({ 
      view: this,
      model: Auth
    });
  }
  
  async render() {
    return `
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
    await this.#presenter.loadProfile();
    this._setupEventListeners();
  }
  
  _setupEventListeners() {
    const logoutButton = document.getElementById('logout-button');
    
    // Add logout handler
    logoutButton.addEventListener('click', () => {
      this.#presenter.logout();
    });
  }
  
  showProfile(user) {
    const profileInfo = document.getElementById('profile-info');
    
    // Display user information
    profileInfo.innerHTML = `
      <h2>${user.name}</h2>
      <p>User ID: ${user.id}</p>
    `;
  }
}