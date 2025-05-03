import Auth from './auth.js';
import { 
  getAllStories, 
  getAllStoriesGuest, 
  getStoryDetail, 
  getStoryDetailGuest, 
  addNewStory, 
  addNewStoryGuest 
} from './api.js';

class Story {
  static async getAll({ page = null, size = null, location = null } = {}) {
    try {
      const token = Auth.getToken();
      
      if (token) {
        const response = await getAllStories(token, { page, size, location });
        return response;
      } else {
        const response = await getAllStoriesGuest({ page, size, location });
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      const token = Auth.getToken();
      
      if (token) {
        const response = await getStoryDetail(token, id);
        return response;
      } else {
        const response = await getStoryDetailGuest(id);
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  static async add(description, photoFile, lat = null, lon = null) {
    try {
      const token = Auth.getToken();
      
      if (token) {
        const response = await addNewStory(token, description, photoFile, lat, lon);
        return response;
      } else {
        const response = await addNewStoryGuest(description, photoFile, lat, lon);
        return response;
      }
    } catch (error) {
      throw error;
    }
  }
}

export default Story;