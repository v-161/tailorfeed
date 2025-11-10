// src/services/api.ts (Create this file)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = {
  async get(endpoint: string) {
    console.log('Mock API call to:', `${API_BASE_URL}${endpoint}`);
    // Return mock data for now
    return { posts: [] };
  },

  async post(endpoint: string, data: any) {
    console.log('Mock API POST to:', `${API_BASE_URL}${endpoint}`, data);
    return { postId: 'mock-post-id' };
  },

  async put(endpoint: string, data: any) {
    console.log('Mock API PUT to:', `${API_BASE_URL}${endpoint}`, data);
    return { success: true };
  },
};