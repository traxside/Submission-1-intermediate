import Auth from '../../data/auth';
import { showAlert } from '../../utils';

export default class LoginPage {
  async render() {
    return `
      <div class="skip-link-container">
        <a href="#main-content" class="skip-link">Skip to content</a>
      </div>
      <section class="container auth-page">
        <div class="auth-container" id="main-content">
          <h1 class="page-title">Login</h1>
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary">Login</button>
          </form>
          <p class="auth-link">Don't have an account? <a href="#/register">Register here</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Simple validation
      if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
      }
      
      try {
        const response = await Auth.login(email, password);
        
        if (response.error) {
          showAlert(response.message, 'error');
          return;
        }
        
        showAlert('Login successful! Redirecting...', 'success');
        
        // Redirect after successful login
        setTimeout(() => {
          window.location.hash = '#/';
        }, 1500);
      } catch (error) {
        showAlert(`Login failed: ${error.message}`, 'error');
      }
    });
  }
}