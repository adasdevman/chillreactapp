import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { API_ENDPOINTS } from '../config';
import type { LoginResponse } from '../types';

interface LoginResponse {
  access: string;    // au lieu de token
  refresh: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    profile_image: string;
    role: string;
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      console.log('Login attempt for:', email);
      console.log('API endpoint:', API_ENDPOINTS.login);
      
      const response = await api.post<LoginResponse>(API_ENDPOINTS.login, { 
        email, 
        password 
      });
      
      if (!response.data) {
        throw new Error('Réponse invalide du serveur');
      }

      console.log('Login response:', response.data);
      
      // Store the tokens
      if (response.data.access) {
        await AsyncStorage.setItem('@ChillNow:token', response.data.access);
      }
      if (response.data.user) {
        await AsyncStorage.setItem('@ChillNow:user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Une erreur est survenue lors de la connexion');
    }
  },

  register: async (userData: RegisterData): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('api/register/', userData);
      await AsyncStorage.setItem('@ChillNow:token', response.data.access);
      await AsyncStorage.setItem('@ChillNow:user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Erreur register:', error.response?.data || error.message);
      }
      throw error;
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

  // Pour naviguer vers Home
  navigateToHome: (navigation: any) => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      })
    );
  },
}; 