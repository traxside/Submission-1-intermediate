import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import LoginPage from '../pages/home/login-page';
import RegisterPage from '../pages/home/register-page';
import AddStoryPage from '../pages/home/add-story-page';
import DetailStoryPage from '../pages/home/detail-story-page';
import ProfilePage from '../pages/profile/profile-page';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/add': new AddStoryPage(),
  '/story/:id': new DetailStoryPage(),
  '/profile': new ProfilePage(),
};

export default routes;