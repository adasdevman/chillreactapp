import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_image?: string;
}

interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (token: string, refreshToken: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const [storedUser, storedToken, storedRefreshToken] = await Promise.all([
          AsyncStorage.getItem('@ChillNow:user'),
          AsyncStorage.getItem('@ChillNow:token'),
          AsyncStorage.getItem('@ChillNow:refreshToken')
        ]);

        console.log('Stored data:', { 
          hasUser: !!storedUser, 
          hasToken: !!storedToken, 
          hasRefreshToken: !!storedRefreshToken 
        });

        if (storedUser && storedToken && storedRefreshToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          console.log('Auth restored:', { userId: parsedUser.id, role: parsedUser.role });
        } else {
          console.log('Clearing incomplete auth data');
          await AsyncStorage.multiRemove([
            '@ChillNow:user',
            '@ChillNow:token',
            '@ChillNow:refreshToken'
          ]);
          setUser(null);
          setToken(null);
          api.defaults.headers.common['Authorization'] = '';
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    loadStorageData();
  }, []);

  const signIn = async (token: string, refreshToken: string, user: User) => {
    try {
      if (!token || !refreshToken || !user) {
        console.error('SignIn error: Missing required data', { 
          hasToken: !!token, 
          hasRefreshToken: !!refreshToken, 
          hasUser: !!user 
        });
        throw new Error('Données de connexion incomplètes');
      }

      if (!user.id || !user.email || !user.role) {
        console.error('SignIn error: Invalid user data', user);
        throw new Error('Données utilisateur invalides');
      }

      console.log('SignIn attempt:', { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });

      const userData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role,
        profile_image: user.profile_image
      };

      try {
        await Promise.all([
          AsyncStorage.setItem('@ChillNow:token', token),
          AsyncStorage.setItem('@ChillNow:refreshToken', refreshToken),
          AsyncStorage.setItem('@ChillNow:user', JSON.stringify(userData))
        ]);
      } catch (storageError) {
        console.error('Failed to store auth data:', storageError);
        throw new Error('Échec de la sauvegarde des données de connexion');
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      setToken(token);

      console.log('SignIn successful:', { userId: userData.id, role: userData.role });
    } catch (error) {
      console.error('SignIn error:', error);
      // Clear any partial data that might have been stored
      await AsyncStorage.multiRemove([
        '@ChillNow:token',
        '@ChillNow:refreshToken',
        '@ChillNow:user'
      ]);
      api.defaults.headers.common['Authorization'] = '';
      setUser(null);
      setToken(null);
      throw error;
    }
  };

  const signUp = async (userData: RegisterData) => {
    try {
      const response = await api.post('api/auth/register/', userData);

      const { token: newToken, user: newUser } = response.data;

      await AsyncStorage.setItem('@ChillNow:token', newToken);
      await AsyncStorage.setItem('@ChillNow:user', JSON.stringify(newUser));

      setUser(newUser);
      setToken(newToken);
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('SignOut initiated');
      await AsyncStorage.multiRemove([
        '@ChillNow:token',
        '@ChillNow:refreshToken',
        '@ChillNow:user'
      ]);

      api.defaults.headers.common['Authorization'] = '';
      
      setUser(null);
      setToken(null);
      console.log('SignOut successful');
    } catch (error) {
      console.error('SignOut error:', error);
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    try {
      console.log('Updating user:', updatedUser.id);
      setUser(updatedUser);
      AsyncStorage.setItem('@ChillNow:user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      signIn, 
      signUp, 
      signOut,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
} 