import { NavigationProp, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_image?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  username?: string;
  taux_avance?: number;
}

export interface Category {
  id: number;
  nom: string;
  description: string;
  ordre: number;
}

export interface Horaire {
  id: number;
  jour: string;
  heure_ouverture: string;
  heure_fermeture: string;
}

export interface Tarif {
  id: number;
  type: string;
  nom: string;
  prix: number;
  description?: string;
}

export interface Photo {
  id: number;
  image: string;
}

export interface Categorie {
  id: number;
  nom: string;
  description: string;
  ordre: number;
}

export interface SousCategorie {
  id: number;
  nom: string;
  description: string;
  ordre: number;
  categorie: number;
}

export interface Announcement {
  id: number;
  titre: string;
  description: string;
  categorie: {
    id: number;
    nom: string;
  };
  sous_categorie: {
    id: number;
    nom: string;
  };
  photos: Array<{
    id: number;
    image: string;
  }>;
  localisation: string;
  date_evenement?: string;
  est_actif: boolean;
  categorie_nom: string;
  sous_categorie_nom: string;
  horaires: Horaire[];
  tarifs: Tarif[];
  created: string;
  modified: string;
  utilisateur?: number;
  annonceur?: User;
  latitude?: number;
  longitude?: number;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    username: string;
    profile_image?: string;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role?: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  profile_image?: string;
}

export interface BillingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

export interface PaymentResponse {
  id: string;
  montant_total: number;
  montant_avance: number;
  taux_avance: number;
}

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Search: undefined;
  Notifications: undefined;
  Profile: undefined;
  Ticket: undefined;
  AnnouncementDetail: {
    announcement: Announcement;
  };
  Payment: {
    amount: number;
    eventName: string;
  };
  PaymentSuccess: undefined;
  Reservation: {
    placeName: string;
  };
  ReservationSuccess: undefined;
  UserSettings: undefined;
  CreateAnnouncement: undefined;
  EditAnnouncement: {
    id: number;
  };
  AnnouncementsList: undefined;
  ChillsList: undefined;
  TicketsList: undefined;
};

export type TabNavigationProp = BottomTabNavigationProp<RootStackParamList>;

export type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;
export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
export type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Search'>;
export type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>; 