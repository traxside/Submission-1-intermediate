import Auth from '../../data/auth';
import { showAlert } from '../../utils';

export default class ProfilePresenter {
  #view;
  #model;
  #user;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model || Auth;
    this.#user = this.#model.getUser();
  }

  async loadProfile() {
    if (!this.#user) {
      // Redirect to login if no user found
      window.location.hash = '#/login';
      return;
    }
    
    this.#view.showProfile(this.#user);
  }
  
  logout() {
    this.#model.logout();
    showAlert('You have been logged out', 'info');
    
    // Redirect to home page
    setTimeout(() => {
      window.location.hash = '#/';
    }, 1500);
  }
}