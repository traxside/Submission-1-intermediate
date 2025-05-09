import Auth from '../../data/auth';
import { showAlert } from '../../utils';

export default class RegisterPage {
  async render() {
    return `
      <section class="container auth-page">
        <div class="auth-container" id="main-content">
          <h1 class="page-title">Register</h1>
          <form id="register-form" class="auth-form">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" required autocomplete="name">
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required autocomplete="new-password" 
                minlength="8" pattern="(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" 
                title="Must contain at least one number, one uppercase and lowercase letter, and at least 8 or more characters">
            </div>
            <div class="form-group">
              <label for="confirm-password">Confirm Password</label>
              <input type="password" id="confirm-password" name="confirm-password" required autocomplete="new-password">
            </div>
            <button type="submit" class="btn btn-primary">Register</button>
          </form>
          <p class="auth-link">Already have an account? <a href="#/login">Login here</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const registerForm = document.getElementById('register-form');
    
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // Simple validation
      if (!name || !email || !password || !confirmPassword) {
        showAlert('Please fill in all fields', 'error');
        return;
      }
      
      if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
      }
      
      try {
        const response = await Auth.register(name, email, password);
        
        if (response.error) {
          showAlert(response.message, 'error');
          return;
        }
        
        showAlert('Registration successful! Please login.', 'success');
        
        // Redirect to login page after successful registration
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 1500);
      } catch (error) {
        showAlert(`Registration failed: ${error.message}`, 'error');
      }
    });
  }
}