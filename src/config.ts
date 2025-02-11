import { Platform } from 'react-native';

// Base URL configuration
export const API_URL = 'https://chillbackend.onrender.com';  // Sans le slash final

export const API_TIMEOUT = 30000; // 30 seconds

// Media URL configuration
export const MEDIA_URL = `${API_URL}/media/`;  // URL complète pour les médias

// Ensure consistent URL formatting
export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

export const API_ENDPOINTS = {
  login: 'api/auth/login/',
  register: 'api/auth/register/',
  profile: 'api/profile/',
}; 