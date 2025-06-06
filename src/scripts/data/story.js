import Auth from './auth';
import { 
  getAllStories, 
  getStoryDetail, 
  addNewStory, 
  addNewStoryGuest 
} from './api';

class Story {
  static async getAll({ page = null, size = null, location = null } = {}) {
    try {
      const token = Auth.getToken();
      
      if (token) {
        const response = await getAllStories(token, { page, size, location });
        return response;
      } else {
        throw new Error("Missing Authentication : Please sign in or register to continue");
      }
    } catch (error) {
      console.log(error.message);
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
        throw new Error("Missing Authentication");
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