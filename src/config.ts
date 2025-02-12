import { Platform } from 'react-native';

// Base URL configuration
export const API_URL = 'https://chillbackend.onrender.com';  // Sans le slash final

export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  validateStatus: (status: number) => status >= 200 && status < 300,
};

// Media URL configuration
export const MEDIA_URL = `${API_URL}/media/`;  // URL complète pour les médias

// Ensure consistent URL formatting with SSL handling
export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with a status code outside of 2xx range
    console.error('Response error:', error.response.data);
    return `Error: ${error.response.data.message || 'Something went wrong'}`;
  } else if (error.request) {
    // Request was made but no response received
    console.error('Network error:', error.request);
    return 'Network error. Please check your connection.';
  } else {
    // Something happened in setting up the request
    console.error('Request setup error:', error.message);
    return 'Connection error. Please try again.';
  }
};

export const API_ENDPOINTS = {
  login: 'api/auth/login/',
  register: 'api/auth/register/',
  profile: 'api/profile/',
}; 