import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type NotificationsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

// Données de test
const mockNotifications: Notification[] = [
  {
    id: 1,
    title: "Nouvelle annonce",
    message: "Une nouvelle soirée a été ajoutée près de chez vous !",
    date: "2024-01-24T18:53:00",
    isRead: false
  },
  {
    id: 2,
    title: "Réservation confirmée",
    message: "Votre réservation pour l'Eco-Friendly Tour a été confirmée.",
    date: "2024-01-23T15:30:00",
    isRead: true
  },
  {
    id: 3,
    title: "Rappel événement",
    message: "Night Fever Party commence dans 2 heures !",
    date: "2024-01-22T20:00:00",
    isRead: true
  }
];

export default function NotificationsScreen() {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons 
            name="close" 
            size={24} 
            color={colors.yellow}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Liste des notifications */}
      <ScrollView style={styles.content}>
        {mockNotifications.map(notification => (
          <TouchableOpacity 
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.isRead && styles.unreadNotification
            ]}
          >
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationDate}>
                {formatDate(notification.date)}
              </Text>
            </View>
            {!notification.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkGrey,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: colors.darkGrey,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.yellow,
    fontSize: 20,
    fontFamily: 'Inter_18pt-Bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  unreadNotification: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Bold',
    marginBottom: 5,
  },
  notificationMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: 'Inter_18pt-Regular',
    marginBottom: 8,
  },
  notificationDate: {
    color: colors.yellow,
    fontSize: 12,
    fontFamily: 'Inter_18pt-Regular',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.yellow,
    marginLeft: 10,
  },
}); 