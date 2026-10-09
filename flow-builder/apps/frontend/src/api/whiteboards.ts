import axios from 'axios';
import { API_BASE as API_BASE_URL } from './origin';

export interface Whiteboard {
  id: string;
  name: string;
  description?: string;
  data: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface WhiteboardListItem {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateWhiteboardRequest {
  name: string;
  description?: string;
  data: string;
}

export const whiteboardsApi = {
  // Get all whiteboards
  getAll: async (): Promise<WhiteboardListItem[]> => {
    const response = await axios.get(`${API_BASE_URL}/whiteboards`);
    return response.data;
  },

  // Get specific whiteboard
  getById: async (id: string): Promise<Whiteboard> => {
    const response = await axios.get(`${API_BASE_URL}/whiteboards/${id}`);
    return response.data;
  },

  // Create new whiteboard
  create: async (data: CreateWhiteboardRequest): Promise<Whiteboard> => {
    const response = await axios.post(`${API_BASE_URL}/whiteboards`, data);
    return response.data;
  },

  // Update whiteboard
  update: async (id: string, data: CreateWhiteboardRequest): Promise<Whiteboard> => {
    const response = await axios.put(`${API_BASE_URL}/whiteboards/${id}`, data);
    return response.data;
  },

  // Delete whiteboard
  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/whiteboards/${id}`);
  },
};