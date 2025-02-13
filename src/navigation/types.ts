import type { Announcement } from '../types';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Home: undefined;
  Search: undefined;
  Ticket: undefined;
  Profile: undefined;
  Notifications: undefined;
  Payment: {
    announcement: Announcement;
    paymentType: 'ticket' | 'table';
  };
  PaymentSuccess: undefined;
  ReservationSuccess: undefined;
  UserSettings: undefined;
  AnnouncementDetail: {
    announcement: Announcement;
  };
  CreateAnnouncement: undefined;
  EditAnnouncement: {
    id: number;
  };
  Login: undefined;
  Register: undefined;
  Reservation: { placeName: string };
  BillingInfo: {
    annonceId: number;
    formulaId: number;
    amount: number;
    annonceTitle: string;
    annonceImage: string;
  };
  ChillsList: {
    showReceivedBookings?: boolean;
    showTickets?: boolean;
    showSoldTickets?: boolean;
  };
  TicketsList: undefined;
  AnnouncementsList: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  TicketTab: undefined;
  ProfileTab: undefined;
}; 