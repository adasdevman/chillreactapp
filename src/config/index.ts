import { Platform } from 'react-native';

// Base URL configuration
const BASE_URL = 'https://chillbackend.onrender.com/';  // URL de production sur render.com

// Commenté pour le moment car nous utilisons render.com
// const BASE_URL = Platform.select({
//   default: 'http://192.168.1.40:8000/',
//   android: 'http://10.0.2.2:8000/',
//   ios: 'http://localhost:8000/',
// });

export const API_URL = BASE_URL;
export const MEDIA_URL = BASE_URL;

// API timeout in milliseconds
export const API_TIMEOUT = 30000;

// API endpoints
export const API_ENDPOINTS = {
  categories: 'api/categories/',
  announcements: 'api/annonces/',
  login: 'api/auth/login/',
  register: 'api/auth/register/',
  profile: 'api/profile/',
}; 