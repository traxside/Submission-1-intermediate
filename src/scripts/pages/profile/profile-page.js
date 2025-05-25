
import ProfilePresenter from './profile-presenter.js';
import Auth from '../../data/auth.js';
import pushNotificationManager from '../../utils/push-notification.js';
import { showAlert } from '../../utils/index.js';

export default class ProfilePage {
  #presenter;
  #isSubscribed = false;

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
    await this._initializeNotifications();
    this._setupEventListeners();
  }

  async _initializeNotifications() {
    try {
      // Check if push notifications are supported
      if (!('serviceWorker' in navigator && 'PushManager' in window)) {
        this._showNotificationStatus('Push notifications are not supported in this browser', 'warning');
        return;
      }

      // Check current permission status
      const permission = pushNotificationManager.getPermissionStatus();

      if (permission === 'denied') {
        this._showNotificationStatus('Notifications are blocked. Please enable them in your browser settings.', 'error');
        return;
      }

      // Check if user is currently subscribed
      this.#isSubscribed = await pushNotificationManager.isSubscribed();

      this._updateNotificationUI();

    } catch (error) {
      console.error('Error initializing notifications:', error);
      this._showNotificationStatus('Error checking notification status', 'error');
    }
  }

  _updateNotificationUI() {
    const statusDiv = document.querySelector('#notification-status');
    const toggleButton = document.querySelector('#toggle-notifications');
    const testButton = document.querySelector('#test-notification');

    if (this.#isSubscribed) {
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

  _showNotificationStatus(message, type = 'info') {
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

  async _handleNotificationToggle() {
    const toggleButton = document.getElementById('toggle-notifications');

    try {
      // Disable button and show loading
      toggleButton.disabled = true;
      toggleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

      if (this.#isSubscribed) {
        // Unsubscribe
        const result = await pushNotificationManager.unsubscribe();
        this.#isSubscribed = false;
        showAlert(result.message, 'success');
      } else {
        // Subscribe
        const result = await pushNotificationManager.subscribe();
        this.#isSubscribed = true;
        showAlert(result.message, 'success');
      }

      // Update UI
      this._updateNotificationUI();

    } catch (error) {
      console.error('Error toggling notifications:', error);
      showAlert(`Error: ${error.message}`, 'error');

      // Re-enable button
      toggleButton.disabled = false;
      this._updateNotificationUI();
    }
  }

  _sendTestNotification() {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      showAlert('This browser does not support notifications', 'error');
      return;
    }

    // Check permission
    if (Notification.permission !== 'granted') {
      showAlert('Notifications are not enabled', 'warning');
      return;
    }

    // Create a test notification
    const notification = new Notification('Test Notification', {
      body: 'This is a test notification from your Story App!',
      tag: 'test-notification',
      requireInteraction: false
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    showAlert('Test notification sent!', 'info');
  }

  _setupEventListeners() {
    const logoutButton = document.getElementById('logout-button');
    const toggleNotificationsButton = document.getElementById('toggle-notifications');
    const testNotificationButton = document.getElementById('test-notification');

    // Logout handler
    logoutButton.addEventListener('click', () => {
      this.#presenter.logout();
    });

    // Notification toggle handler
    toggleNotificationsButton.addEventListener('click', () => {
      this._handleNotificationToggle();
    });

    // Test notification handler
    testNotificationButton.addEventListener('click', () => {
      this._sendTestNotification();
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