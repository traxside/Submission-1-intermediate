// CSS imports
import '../styles/styles.css';
// import {registerServiceWorker} from "./utils/";
import App from './pages/app';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();
  //
  // // Register service worker
  // await registerServiceWorker();


  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });
  const mainContent = document.querySelector('#main-content');
  const skipLink = document.querySelector('.skip-link');

  skipLink.addEventListener('click', function (event) {
      event.preventDefault(); // Prevent page refresh

      // Focus on main content and scroll to it
      mainContent.focus(); // Focus on main content
      mainContent.scrollIntoView({behavior: 'smooth'}); // Scroll to main content smoothly
  });


});
