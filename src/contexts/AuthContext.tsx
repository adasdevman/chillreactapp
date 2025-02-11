import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
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
  signIn: (token: string, user: User) => Promise<void>;
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
      const storedUser = await AsyncStorage.getItem('@ChillNow:user');
      const storedToken = await AsyncStorage.getItem('@ChillNow:token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }

      setLoading(false);
    }

    loadStorageData();
  }, []);

  const signIn = async (token: string, user: User) => {
    try {
      await AsyncStorage.setItem('@ChillNow:token', token);
      await AsyncStorage.setItem('@ChillNow:user', JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setToken(token);
    } catch (error) {
      console.error('Error in signIn:', error);
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
    await AsyncStorage.removeItem('@ChillNow:token');
    await AsyncStorage.removeItem('@ChillNow:user');

    setUser(null);
    setToken(null);
  };

  const updateUser = (user: User) => {
    setUser(user);
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