import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { MEDIA_URL, API_URL, API_TIMEOUT, API_ENDPOINTS } from '../config';
import type { User, LoginResponse, UpdateProfileData } from '../types';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface SubCategory {
  id: number;
  nom: string;
  description?: string;
}

export interface Category {
  id: number;
  nom: string;
  description?: string;
  sous_categories: SubCategory[];
}

export interface Announcement {
  id: number;
  titre: string;
  description: string;
  photos: Array<{
    id: number;
    image: string;
  }>;
  categorie: {
    id: number;
    nom: string;
  };
  sous_categorie: {
    id: number;
    nom: string;
  };
  localisation: string;
  date_evenement?: string;
  est_actif: boolean;
  categorie_nom: string;
  sous_categorie_nom: string;
  created: string;
  modified: string;
  utilisateur?: number;
}

// Create Axios instance
export const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Log the complete URL being called
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('Full request URL:', fullUrl);
    console.log('Request method:', config.method);
    console.log('Request headers:', config.headers);
    console.log('Request data:', config.data);
    
    const token = await AsyncStorage.getItem('@ChillNow:token');
    if (token && shouldAddToken(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(new Error('Erreur lors de l\'envoi de la requête'));
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response;
  },
  error => {
    console.error('Response Error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    
    if (!error.response) {
      // Network error
      console.error('Network Error - No response received');
      return Promise.reject(new Error('Erreur de connexion au serveur. Veuillez réessayer.'));
    }
    
    // Handle specific error status
    if (error.response) {
      const errorMessage = error.response.data?.error || error.response.data?.message || error.response.data;
      console.error('Server error message:', errorMessage);
      
      switch (error.response.status) {
        case 400:
          return Promise.reject(new Error(errorMessage || 'Données invalides'));
        case 401:
          return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
        case 404:
          return Promise.reject(new Error('Ressource non trouvée'));
        case 500:
          return Promise.reject(new Error('Erreur serveur. Veuillez réessayer plus tard.'));
        default:
          return Promise.reject(new Error(errorMessage || 'Une erreur est survenue'));
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to determine if a route needs authentication
const shouldAddToken = (url: string | undefined): boolean => {
  if (!url) return false;
  
  // Public routes that don't need authentication
  const publicRoutes = [
    'api/categories',
    'api/annonces',
    'api/auth/login',
    'api/auth/register'
  ];
  
  return !publicRoutes.some(route => url.startsWith(route));
};

export interface RegisterData {
  email: string;
  password: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: 'ANNONCEUR' | 'UTILISATEUR';
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      console.log('Attempting login for:', email);
      const response = await api.post<LoginResponse>(API_ENDPOINTS.login, { 
        email, 
        password 
      });
      
      console.log('Login successful');
      await AsyncStorage.setItem('@ChillNow:token', response.data.access);
      await AsyncStorage.setItem('@ChillNow:user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      if (error instanceof AxiosError) {
        if (error.response) {
          // Server responded with an error status code
          const status = error.response.status;
          const errorData = error.response.data;

          switch (status) {
            case 400:
              throw new Error('Email ou mot de passe incorrect');
            case 401:
              throw new Error('Non autorisé. Veuillez vérifier vos identifiants.');
            case 500:
              throw new Error('Erreur serveur. Veuillez réessayer dans quelques instants.');
            default:
              throw new Error(errorData?.error || 'Une erreur est survenue lors de la connexion');
          }
        } else if (error.request) {
          // Request made but no response received
          throw new Error('Le serveur ne répond pas. Veuillez vérifier votre connexion internet.');
        }
      }
      // For non-Axios errors
      throw new Error('Une erreur inattendue est survenue');
    }
  },

  register: async (userData: RegisterData): Promise<LoginResponse> => {
    try {
      console.log('Attempting registration with data:', userData);
      const response = await api.post<LoginResponse>(API_ENDPOINTS.register, {
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone,
        role: userData.role || 'UTILISATEUR'
      });

      console.log('Registration successful:', response.data);
      
      // Store the tokens and user data
      await AsyncStorage.setItem('@ChillNow:token', response.data.access);
      await AsyncStorage.setItem('@ChillNow:user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof AxiosError) {
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;

          switch (status) {
            case 400:
              if (errorData.email) {
                throw new Error('Cette adresse email est déjà utilisée');
              }
              throw new Error(Object.values(errorData).flat().join('\n'));
            case 500:
              throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
            default:
              throw new Error(errorData?.error || 'Une erreur est survenue lors de l\'inscription');
          }
        } else if (error.request) {
          throw new Error('Le serveur ne répond pas. Veuillez vérifier votre connexion internet.');
        }
      }
      throw new Error('Une erreur inattendue est survenue');
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('@ChillNow:token');
      await AsyncStorage.removeItem('@ChillNow:user');
    } catch (error) {
      console.error('Erreur logout:', error);
      throw error;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('@ChillNow:token');
      const userStr = await AsyncStorage.getItem('@ChillNow:user');
      console.log('Auth check - Token:', !!token, 'User:', !!userStr);
      
      if (!token || !userStr) {
        console.log('Missing token or user data');
        return false;
      }

      // Vérifier que le token est valide en décodant le JWT
      const user = JSON.parse(userStr);
      console.log('User data found:', user);
      
      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const userStr = await AsyncStorage.getItem('@ChillNow:user');
      console.log('Stored user data:', userStr);
      if (!userStr) {
        console.log('No user data found in storage');
        return null;
      }
      const user = JSON.parse(userStr);
      console.log('Parsed user data:', user);
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  registerAnnonceur: async (formData: FormData): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>(
        'api/auth/register/annonceur/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      await AsyncStorage.setItem('@ChillNow:token', response.data.token);
      await AsyncStorage.setItem('@ChillNow:user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Erreur register annonceur:', error.response?.data || error.message);
      }
      throw error;
    }
  },
};

export const userService = {
  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get<{data: User}>('api/profile/');
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Erreur get profile:', error.response?.data || error.message);
      }
      throw error;
    }
  },

  updateProfile: async (data: UpdateProfileData | FormData, isFormData: boolean = false): Promise<User> => {
    try {
      const headers = isFormData ? {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      } : {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const response = await api.put<{data: User}>('api/profile/', data, { headers });
      
      console.log('Update profile response:', response.data);
      
      const currentUser = await AsyncStorage.getItem('@ChillNow:user');
      if (currentUser) {
        const updatedUser = { ...JSON.parse(currentUser), ...response.data };
        await AsyncStorage.setItem('@ChillNow:user', JSON.stringify(updatedUser));
      }
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Erreur update profile:', error.response?.data || error.message);
      }
      throw error;
    }
  },

  updatePassword: async (data: { current_password: string; new_password: string }) => {
    const response = await api.post('api/auth/change-password/', data);
    return response.data;
  },

  updateProfileImage: async (formData: FormData): Promise<User> => {
    const response = await api.put<User>('api/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      },
    });
    return response.data;
  }
};

export const categoryService = {
  getCategories: async () => {
    const response = await api.get('api/categories/');
    return response.data;
  },
  
  getAnnouncements: async (params: { categorie?: number, sous_categorie?: number, search?: string }) => {
    try {
      console.log('Fetching announcements with params:', params);
      const response = await api.get('api/annonces/', { params });
      console.log('Raw API response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        // Transform the image URLs in the response
        return response.data.map(announcement => ({
          ...announcement,
          photos: announcement.photos.map(photo => ({
            ...photo,
            image: imageService.getAnnouncementImageUrl({ image: photo.image })
          }))
        }));
      }
      
      console.warn('Unexpected announcements response format:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  },

  searchAnnouncements: async (searchQuery: string): Promise<Announcement[]> => {
    try {
      const response = await api.get<Announcement[]>(`api/annonces/search/?query=${encodeURIComponent(searchQuery)}`);
      return Array.isArray(response.data) ? response.data.map(announcement => ({
        ...announcement,
        photos: announcement.photos.map(photo => ({
          ...photo,
          image: imageService.getAnnouncementImageUrl({ image: photo.image })
        }))
      })) : [];
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Error searching announcements:', error.message);
      }
      throw error;
    }
  }
};

export const imageService = {
  getImageUrl: (path: string | null): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    // Remove any leading slashes and media prefix if present
    const cleanPath = path.replace(/^\/+/, '').replace(/^media\//, '');
    return `${MEDIA_URL}${cleanPath}`;
  },

  getAnnouncementImageUrl: (photo: { image: string }): string => {
    if (!photo.image) return '';
    if (photo.image.startsWith('http')) return photo.image;
    
    // Remove any leading slashes and media prefix if present
    const cleanPath = photo.image.replace(/^\/+/, '').replace(/^media\//, '');
    return `${MEDIA_URL}${cleanPath}`;
  }
};

export const announcementService = {
  getMyAnnouncements: async () => {
    try {
      const response = await api.get<{data: Announcement[]}>('/api/annonces/mes-annonces/');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching my announcements:', error);
      throw error;
    }
  },

  getMyChills: async () => {
    try {
      const response = await api.get<{data: Announcement[]}>('/api/annonces/mes-chills/');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching my chills:', error);
      throw error;
    }
  },

  getMyTickets: async () => {
    try {
      const response = await api.get<{data: Announcement[]}>('/api/annonces/mes-tickets/');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching my tickets:', error);
      throw error;
    }
  },

  createAnnouncement: async (formData: FormData) => {
    try {
      const response = await api.post('/api/annonces/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  updateAnnouncement: async (id: number, formData: FormData) => {
    try {
      const response = await api.put(`/api/annonces/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  },

  deleteAnnouncement: async (id: number) => {
    try {
      await api.delete(`/api/annonces/${id}/`);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  },
};

const uploadImage = async (image: ImagePickerAsset) => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: image.uri,
      type: 'image/jpeg',
      name: 'photo.jpg'
    } as any);

    const response = await api.post('/api/upload-image/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const paymentService = {
  createPayment: async (data: {
    annonce: number;
    amount: number;
    payment_type: 'ticket' | 'table';
    tarif: number;
  }) => {
    try {
      const response = await api.post('/api/payments/create/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },
};

export { API_URL }; 