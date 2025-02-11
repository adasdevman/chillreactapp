import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';

// Screens
import AuthScreen from '../screens/Auth/AuthScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import TicketScreen from '../screens/Ticket/TicketScreen';
import AnnouncementDetailScreen from '../screens/AnnouncementDetail/AnnouncementDetailScreen';
import PaymentScreen from '../screens/Payment/PaymentScreen';
import PaymentSuccessScreen from '../screens/Payment/PaymentSuccessScreen';
import ReservationScreen from '../screens/Reservation/ReservationScreen';
import ReservationSuccessScreen from '../screens/Reservation/ReservationSuccessScreen';
import UserSettingsScreen from '../screens/Profile/UserSettingsScreen';
import CreateAnnouncementScreen from '../screens/Announcements/CreateAnnouncementScreen';
import EditAnnouncementScreen from '../screens/Announcements/EditAnnouncementScreen';
import AnnouncementsListScreen from '../screens/Lists/AnnouncementsListScreen';
import ChillsListScreen from '../screens/Lists/ChillsListScreen';
import TicketsListScreen from '../screens/Lists/TicketsListScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.darkGrey }}>
        <ActivityIndicator size="large" color={colors.yellow} />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colors.darkGrey },
        animation: 'fade',
      }}
      initialRouteName={user ? 'Home' : 'Auth'}
    >
      <Stack.Screen 
        name="Auth" 
        component={AuthScreen}
        options={{
          gestureEnabled: false
        }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          gestureEnabled: false
        }}
      />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Ticket" component={TicketScreen} />
      <Stack.Screen 
        name="AnnouncementDetail" 
        component={AnnouncementDetailScreen}
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          contentStyle: { 
            backgroundColor: 'transparent',
          },
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="Reservation" component={ReservationScreen} />
      <Stack.Screen name="ReservationSuccess" component={ReservationSuccessScreen} />
      <Stack.Screen name="UserSettings" component={UserSettingsScreen} />
      <Stack.Screen name="CreateAnnouncement" component={CreateAnnouncementScreen} />
      <Stack.Screen name="EditAnnouncement" component={EditAnnouncementScreen} />
      <Stack.Screen name="AnnouncementsList" component={AnnouncementsListScreen} />
      <Stack.Screen name="ChillsList" component={ChillsListScreen} />
      <Stack.Screen name="TicketsList" component={TicketsListScreen} />
    </Stack.Navigator>
  );
} 