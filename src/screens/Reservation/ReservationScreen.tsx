import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { RootStackParamList, StackNavigationProp } from '../../types';

type ReservationScreenRouteProp = RouteProp<RootStackParamList, 'Reservation'>;

export default function ReservationScreen() {
  const navigation = useNavigation<StackNavigationProp>();
  const route = useRoute<ReservationScreenRouteProp>();
  const { placeName } = route.params;

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [numberOfPeople, setNumberOfPeople] = useState('2');
  const [specialRequests, setSpecialRequests] = useState('');

  const handleReservation = async () => {
    try {
      // TODO: Envoyer la réservation à l'API
      // Pour l'instant, simulons une réservation réussie
      navigation.navigate('ReservationSuccess');
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (selectedTime) {
      setTime(selectedTime);
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
        <Text style={styles.title}>Réservation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>{placeName}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Date</Text>
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />

          <Text style={styles.label}>Heure</Text>
          <DateTimePicker
            value={time}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />

          <Text style={styles.label}>Nombre de personnes</Text>
          <View style={styles.peopleSelector}>
            <TouchableOpacity 
              style={styles.peopleButton}
              onPress={() => setNumberOfPeople(Math.max(1, parseInt(numberOfPeople) - 1).toString())}
            >
              <MaterialCommunityIcons name="minus" size={24} color={colors.yellow} />
            </TouchableOpacity>
            <Text style={styles.peopleCount}>{numberOfPeople}</Text>
            <TouchableOpacity 
              style={styles.peopleButton}
              onPress={() => setNumberOfPeople((parseInt(numberOfPeople) + 1).toString())}
            >
              <MaterialCommunityIcons name="plus" size={24} color={colors.yellow} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Demandes spéciales</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ex: Table en terrasse, allergies..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Résumé</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Établissement</Text>
            <Text style={styles.summaryValue}>{placeName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>
              {date.toLocaleDateString('fr-FR', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Heure</Text>
            <Text style={styles.summaryValue}>
              {time.toLocaleTimeString('fr-FR', { 
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Personnes</Text>
            <Text style={styles.summaryValue}>{numberOfPeople}</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.reserveButton}
        onPress={handleReservation}
      >
        <Text style={styles.reserveButtonText}>Réserver</Text>
      </TouchableOpacity>
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
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  placeInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  placeName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: 'white',
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  peopleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  peopleButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peopleCount: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
  },
  summary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
  },
  summaryTitle: {
    color: colors.yellow,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  summaryValue: {
    color: 'white',
    fontSize: 14,
  },
  reserveButton: {
    backgroundColor: colors.yellow,
    margin: 20,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveButtonText: {
    color: colors.darkGrey,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 