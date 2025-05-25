import Auth from '../../data/auth.js';
import pushNotificationManager from '../../utils/push-notification.js';
import { showAlert } from '../../utils/index.js';

export default class ProfilePresenter {
  #view;
  #model;
  #user;
  #isSubscribed = false;

  constructor({ view, model}) {
    this.#view = view;
    this.#model = model;
    this.#user = this.#model.getUser();
  }

  async loadProfile() {
    console.log("From load profile", this.#user);
    if (!this.#user) {
      // find user
      this.#user = this.#model.getUser();
      return;
    }

    this.#view.showProfile(this.#user);
  }

  async initializeNotifications() {
    try {
      // Check if push notifications are supported
      if (!this._areNotificationsSupported()) {
        this.#view.showNotificationStatus('Push notifications are not supported in this browser', 'warning');
        return;
      }

      // Check current permission status
      const permission = pushNotificationManager.getPermissionStatus();

      if (permission === 'denied') {
        this.#view.showNotificationStatus('Notifications are blocked. Please enable them in your browser settings.', 'error');
        return;
      }

      // Check if user is currently subscribed
      this.#isSubscribed = await pushNotificationManager.isSubscribed();
      this.#view.updateNotificationUI(this.#isSubscribed);

    } catch (error) {
      console.error('Error initializing notifications:', error);
      this.#view.showNotificationStatus('Error checking notification status', 'error');
    }
  }

  async handleNotificationToggle() {
    console.log('handleNotificationToggle called');
    try {
      // Show loading state
      this.#view.setNotificationButtonLoading(true);

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
      this.#view.updateNotificationUI(this.#isSubscribed);

    } catch (error) {
      console.error('Error toggling notifications:', error);
      showAlert(`Error: ${error.message}`, 'error');

      // Reset UI on error
      this.#view.setNotificationButtonLoading(false);
      this.#view.updateNotificationUI(this.#isSubscribed);
    }
  }

  sendTestNotification() {
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

  logout() {
    this.#model.logout();
    showAlert('You have been logged out', 'info');

    // Redirect to home page
    setTimeout(() => {
      window.location.hash = '#/';
    }, 1500);
  }

  // Private helper methods
  _areNotificationsSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }
}