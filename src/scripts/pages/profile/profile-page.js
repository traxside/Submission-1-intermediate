import ProfilePresenter from './profile-presenter.js';
import Auth from '../../data/auth.js';

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
            <h2><i class="fas fa-bell"></i> Notifications</h2>
            <div class="notification-settings">
              <div id="notification-status" class="notification-status">
                <p>Checking notification status...</p>
              </div>
              <div class="notification-controls">
                <button id="toggle-notifications" class="btn btn-primary" disabled>
                  <i class="fas fa-spinner fa-spin"></i> Loading...
                </button>
                <button id="test-notification" class="btn btn-secondary" style="display: none;">
                  <i class="fas fa-paper-plane"></i> Test Notification
                </button>
              </div>
            </div>
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
    await this.#presenter.initializeNotifications();
    this._setupEventListeners();
  }

  _setupEventListeners() {
    const logoutButton = document.getElementById('logout-button');
    const toggleNotificationsButton = document.getElementById('toggle-notifications');
    const testNotificationButton = document.getElementById('test-notification');

    // Logout handler
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.#presenter.logout();
    });

    // Notification toggle handler
    toggleNotificationsButton.addEventListener('click', () => {
      this.#presenter.handleNotificationToggle();
    });

    // Test notification handler
    testNotificationButton.addEventListener('click', () => {
      this.#presenter.sendTestNotification();
    });
  }

  // View methods
  showProfile(user) {
    const profileInfo = document.getElementById('profile-info');
    profileInfo.innerHTML = `
      <h2>${user.name}</h2>
      <p>User ID: ${user.id}</p>
    `;
  }

  showNotificationStatus(message, type = 'info') {
    const statusDiv = document.querySelector('#notification-status');
    const iconClass = type === 'error' ? 'fas fa-exclamation-triangle' :
        type === 'warning' ? 'fas fa-exclamation-circle' :
            type === 'success' ? 'fas fa-check-circle' : 'fas fa-info-circle';

    statusDiv.innerHTML = `
      <p class="status-text ${type}">
        <i class="${iconClass}"></i>
        ${message}
      </p>
    `;

    const toggleButton = document.querySelector('#toggle-notifications');
    toggleButton.style.display = type === 'error' || type === 'warning' ? 'none' : 'inline-block';
  }

  updateNotificationUI(isSubscribed) {
    const statusDiv = document.querySelector('#notification-status');
    const toggleButton = document.querySelector('#toggle-notifications');
    const testButton = document.querySelector('#test-notification');

    if (isSubscribed) {
      statusDiv.innerHTML = `
        <p class="status-text success">
          <i class="fas fa-check-circle"></i>
          You are subscribed to push notifications
        </p>
      `;

      toggleButton.innerHTML = '<i class="fas fa-bell-slash"></i> Unsubscribe';
      toggleButton.className = 'btn btn-warning';
      toggleButton.disabled = false;

      testButton.style.display = 'inline-block';
    } else {
      statusDiv.innerHTML = `
        <p class="status-text">
          <i class="fas fa-bell"></i>
          Get notified when new stories are created
        </p>
      `;

      toggleButton.innerHTML = '<i class="fas fa-bell"></i> Subscribe to Notifications';
      toggleButton.className = 'btn btn-primary';
      toggleButton.disabled = false;

      testButton.style.display = 'none';
    }
  }

  setNotificationButtonLoading(isLoading = true) {
    const toggleButton = document.getElementById('toggle-notifications');

    if (isLoading) {
      toggleButton.disabled = true;
      toggleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    } else {
      toggleButton.disabled = false;
    }
  }
}