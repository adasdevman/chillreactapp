import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Image, ScrollView, TouchableOpacity, Dimensions, Animated, Alert, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Announcement, Horaire, Categorie } from '../../types';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import { API_URL } from '../../services/api';

type AnnouncementDetailRouteProp = RouteProp<RootStackParamList, 'AnnouncementDetail'>;
type AnnouncementDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  route: AnnouncementDetailRouteProp;
}

// Enum pour les IDs de catégories
enum CategoryIds {
  CHILL = 1,
  PLACE_TO_BE = 2,
  EVENT = 3
}

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
};

export default function AnnouncementDetailScreen({ route }: Props) {
  const { announcement } = route.params;
  const isEventType = announcement.categorie.id === CategoryIds.EVENT;
  const navigation = useNavigation<AnnouncementDetailNavigationProp>();
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: [] as { text: string; onPress: () => void; style?: 'cancel' | 'default' }[]
  });
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      navigation.goBack();
    });
  };

  const handleAction = async () => {
    try {
      console.log('Début de la création du paiement');
      const paymentType = isEventType ? 'ticket' : 'table';

      if (!announcement) {
        throw new Error('Annonce non disponible');
      }

      console.log('Annonce passée au paiement:', announcement);
      navigation.navigate('Payment', {
        announcement,
        paymentType
      });
    } catch (error) {
      console.error('Erreur lors de la navigation vers le paiement:', error);
      setAlertConfig({
        title: "Erreur",
        message: "Une erreur s'est produite. Veuillez réessayer.",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
      setAlertVisible(true);
    }
  };

  const handleItineraire = () => {
    const address = encodeURIComponent(announcement.localisation);
    const browserUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
    Linking.openURL(browserUrl);
  };

  const closeButtonOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const formatHoraires = (horaires: Horaire[]) => {
    // Créer un dictionnaire des horaires par plage horaire
    const horairesByTime: { [key: string]: string[] } = {};
    
    // Dictionnaire de conversion des jours (ajout de plus de formats possibles)
    const joursFr: { [key: string]: string } = {
      // Format anglais majuscule
      'MONDAY': 'Lundi',
      'TUESDAY': 'Mardi',
      'WEDNESDAY': 'Mercredi',
      'THURSDAY': 'Jeudi',
      'FRIDAY': 'Vendredi',
      'SATURDAY': 'Samedi',
      'SUNDAY': 'Dimanche',
      // Format anglais minuscule
      'monday': 'Lundi',
      'tuesday': 'Mardi',
      'wednesday': 'Mercredi',
      'thursday': 'Jeudi',
      'friday': 'Vendredi',
      'saturday': 'Samedi',
      'sunday': 'Dimanche',
      // Format français
      'Lundi': 'Lundi',
      'Mardi': 'Mardi',
      'Mercredi': 'Mercredi',
      'Jeudi': 'Jeudi',
      'Vendredi': 'Vendredi',
      'Samedi': 'Samedi',
      'Dimanche': 'Dimanche',
      // Format court
      'LUN': 'Lundi',
      'MAR': 'Mardi',
      'MER': 'Mercredi',
      'JEU': 'Jeudi',
      'VEN': 'Vendredi',
      'SAM': 'Samedi',
      'DIM': 'Dimanche'
    };

    const joursOrdre = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    horaires.forEach(horaire => {
      const timeRange = `${horaire.heure_ouverture} - ${horaire.heure_fermeture}`;
      if (!horairesByTime[timeRange]) {
        horairesByTime[timeRange] = [];
      }
      // Conversion du jour avec vérification
      const jourFr = joursFr[horaire.jour] || horaire.jour;
      if (!horairesByTime[timeRange].includes(jourFr)) {
        horairesByTime[timeRange].push(jourFr);
      }
    });

    // Debug
    console.log('Jours reçus:', horaires.map(h => h.jour));
    console.log('Horaires par plage:', horairesByTime);

    return Object.entries(horairesByTime).map(([timeRange, jours]) => {
      // Trier les jours selon l'ordre de la semaine
      const joursTries = jours.sort((a, b) => joursOrdre.indexOf(a) - joursOrdre.indexOf(b));

      // Grouper les jours consécutifs
      const joursGroupes = joursTries.reduce((acc: string[], jour, i, arr) => {
        if (i === 0 || joursOrdre.indexOf(arr[i]) !== joursOrdre.indexOf(arr[i-1]) + 1) {
          acc.push(jour);
        } else if (i === arr.length - 1 || joursOrdre.indexOf(arr[i+1]) !== joursOrdre.indexOf(arr[i]) + 1) {
          acc[acc.length - 1] = `${acc[acc.length - 1]} - ${jour}`;
        }
        return acc;
      }, []);

      return {
        jours: joursGroupes.join(', '),
        horaires: timeRange
      };
    });
  };

  const renderSchedule = () => {
    console.log('Horaires:', announcement.horaires);

    if (isEventType) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons name="calendar" size={24} color={colors.yellow} />
            <Text style={styles.dateText}>
              {new Date(announcement.date_evenement!).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={[styles.dateContainer, { marginTop: 10 }]}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={colors.yellow} />
            <Text style={styles.dateText}>
              {new Date(announcement.date_evenement!).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      );
    }

    const horairesGroupes = announcement.horaires ? formatHoraires(announcement.horaires) : [];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Horaires</Text>
        <View style={styles.scheduleContainer}>
          {horairesGroupes.length > 0 ? (
            horairesGroupes.map((groupe, index) => (
              <View key={index} style={styles.horaireItem}>
                <Text style={styles.jour}>{groupe.jours}</Text>
                <Text style={styles.heures}>{groupe.horaires}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noScheduleText}>Aucun horaire disponible</Text>
          )}
        </View>
      </View>
    );
  };

  const getCategoryColor = (categorie: Categorie) => {
    switch (categorie.id) {
      case CategoryIds.CHILL:
        return colors.yellow;
      case CategoryIds.PLACE_TO_BE:
        return colors.darkGrey;
      case CategoryIds.EVENT:
        return colors.yellow;
      default:
        return colors.yellow;
    }
  };

  // Fonctions helpers pour les comparaisons de catégories
  const isChill = (categorie: Categorie) => categorie.id === CategoryIds.CHILL;
  const isEvent = (categorie: Categorie) => categorie.id === CategoryIds.EVENT;
  const isPlaceToBe = (categorie: Categorie) => categorie.id === CategoryIds.PLACE_TO_BE;

  return (
    <Animated.View style={[styles.backgroundContainer, {
      opacity
    }]}>
      <Animated.View style={[styles.container, { 
        transform: [{ scale }],
      }]}>
        <Animated.View style={[styles.closeButton, { opacity: closeButtonOpacity }]}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: getImageUrl(announcement.photos?.[0]?.image || '') }}
              style={styles.coverImage}
            />
            <Image
              source={require('../../../assets/images/gradient-overlay.png')}
              style={styles.imageOverlay}
              resizeMode="stretch"
            />
          </View>

          {/* Contenu */}
          <View style={[styles.content, { marginTop: -40 }]}>
            {/* Titre et catégorie */}
            <Text style={styles.title}>{announcement.titre}</Text>
            <View style={styles.categoryContainer}>
              <Text style={styles.category}>{announcement.sous_categorie_nom}</Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.description}>{announcement.description}</Text>
            </View>

            {/* Horaires ou Date */}
            {renderSchedule()}

            {/* Localisation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Localisation</Text>
              <View style={styles.locationContainer}>
                <Text style={styles.locationText}>{announcement.localisation}</Text>
                <TouchableOpacity 
                  style={styles.itineraireButton}
                  onPress={handleItineraire}
                >
                  <MaterialCommunityIcons name="directions" size={24} color={colors.yellow} />
                  <Text style={styles.itineraireText}>Itinéraire</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.ScrollView>

        {/* Bouton d'action */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleAction}
          >
            <Text style={styles.actionButtonText}>
              {isEventType ? 'Acheter' : 'Réserver'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertVisible(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(34, 34, 30, 0.95)',
  },
  imageContainer: {
    height: 550,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 380,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Regular',
  },
  content: {
    padding: 20,
    backgroundColor: 'rgba(34, 34, 34, 0.95)',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'Inter_18pt-Bold',
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  category: {
    color: colors.yellow,
    fontSize: 16,
    fontFamily: 'Inter_18pt-Bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter_18pt-Bold',
    marginBottom: 15,
  },
  description: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Regular',
    lineHeight: 24,
  },
  scheduleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  horaireItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  jour: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Bold',
  },
  heures: {
    color: colors.yellow,
    fontSize: 16,
    fontFamily: 'Inter_18pt-Bold',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  dateText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Bold',
    marginLeft: 10,
  },
  locationContainer: {
    marginTop: 10,
    backgroundColor: colors.darkGrey,
    borderRadius: 8,
    padding: 15,
  },
  locationText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Regular',
    marginBottom: 15,
  },
  itineraireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    borderRadius: 8,
    padding: 12,
  },
  itineraireText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter_18pt-Medium',
  },
  actionButtonContainer: {
    padding: 20,
    backgroundColor: 'rgba(34, 34, 34, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter_18pt-Bold',
  },
  noScheduleText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Regular',
    textAlign: 'center',
  },
}); 