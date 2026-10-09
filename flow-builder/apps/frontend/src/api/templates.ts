import axios from 'axios';
import { API_BASE as API_BASE_URL } from './origin';

export const templatesAPI = {
  getTemplates: async () => {
    const response = await axios.get(`${API_BASE_URL}/templates`);
    return response.data;
  },

  getTemplate: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/templates/${id}`);
    return response.data;
  }
};