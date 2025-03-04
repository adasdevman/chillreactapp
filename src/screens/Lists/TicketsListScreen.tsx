import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { PlaceCardHorizontal } from '../../components/PlaceCardHorizontal';
import { api } from '../../services/api';
import type { Announcement } from '../../types';

type TicketsListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TicketsListScreen() {
  const navigation = useNavigation<TicketsListScreenNavigationProp>();
  const [tickets, setTickets] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const response = await api.get('/api/annonces/mes-tickets/');
      setTickets(response.data);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.yellow} />
        </TouchableOpacity>
        <Text style={styles.title}>Vos Tickets</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.yellow} style={styles.loader} />
        ) : tickets.length === 0 ? (
          <Text style={styles.emptyText}>Aucun ticket</Text>
        ) : (
          <View style={styles.cardsContainer}>
            {tickets.map((ticket) => (
              <PlaceCardHorizontal
                key={ticket.id}
                title={ticket.titre}
                category={ticket.categorie_nom}
                subCategory={ticket.sous_categorie_nom}
                imageUrl={ticket.photos?.[0]?.image || ''}
                onPress={() => navigation.navigate('AnnouncementDetail', { announcement: ticket })}
              />
            ))}
          </View>
        )}
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
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.yellow,
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
}); 