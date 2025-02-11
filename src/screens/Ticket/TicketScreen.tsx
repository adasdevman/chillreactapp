import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, ScrollView, ActivityIndicator, Modal, Image, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TabBar } from '../Home/components/TabBar';
import { PlaceCard } from '../../components';
import { categoryService } from '../../services/api';
import type { Announcement } from '../../types';
import debounce from 'lodash/debounce';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import CustomAlert from '../../components/CustomAlert';
import { CategoryIds } from '../../constants/categories';

type TicketScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SortOrder = 'recent' | 'old';

export default function TicketScreen() {
  const [events, setEvents] = useState<Announcement[]>([]);
  const [searchResults, setSearchResults] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: [] as { text: string; onPress: () => void; style?: 'cancel' | 'default' }[]
  });
  
  const navigation = useNavigation<TicketScreenNavigationProp>();
  const { user } = useAuth();
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadEvents();
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

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        categorie: CategoryIds.EVENT
      };
      
      const eventsData = await categoryService.getAnnouncements(params);
      console.log('Events loaded:', eventsData);
      
      if (Array.isArray(eventsData)) {
        setEvents(sortEvents(eventsData, sortOrder));
      } else {
        setEvents([]);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      setError('Impossible de charger les événements');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const sortEvents = (eventsList: Announcement[], order: SortOrder) => {
    return [...eventsList].sort((a, b) => {
      const dateA = a.date_evenement ? new Date(a.date_evenement).getTime() : 0;
      const dateB = b.date_evenement ? new Date(b.date_evenement).getTime() : 0;
      return order === 'recent' ? dateB - dateA : dateA - dateB;
    });
  };

  const handleSortChange = (order: SortOrder) => {
    setSortOrder(order);
    setShowFilterModal(false);
    
    // Trier les événements actuellement affichés
    if (searchQuery) {
      setSearchResults(sortEvents(searchResults, order));
    } else {
      setEvents(sortEvents(events, order));
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      try {
        setSearching(true);
        setError(null);
        
        const params = {
          search: query.trim(),
          categorie: CategoryIds.EVENT
        };
        
        const results = await categoryService.getAnnouncements(params);
        console.log('Search results (events):', results);
        setSearchResults(Array.isArray(results) ? sortEvents(results, sortOrder) : []);
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        setError('Erreur lors de la recherche');
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500),
    [sortOrder]
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleAction = async () => {
    if (!user) {
      setAlertConfig({
        title: "Connexion requise",
        message: "Vous devez être connecté pour effectuer cette action.",
        buttons: [
          { 
            text: "Annuler", 
            onPress: () => {},
            style: 'cancel'
          },
          { 
            text: "Se connecter",
            onPress: () => navigation.replace('Auth')
          }
        ]
      });
      setAlertVisible(true);
      return;
    }
    // ... rest of the code ...
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={colors.yellow} style={styles.loader} />;
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    if (searching) {
      return <ActivityIndicator size="large" color={colors.yellow} style={styles.loader} />;
    }

    const displayedEvents = searchQuery ? searchResults : events;

    if (displayedEvents.length === 0) {
      return (
        <Text style={styles.emptyText}>
          {searchQuery ? 'Aucun événement trouvé' : 'Aucun événement disponible'}
        </Text>
      );
    }

    return (
      <View style={styles.eventsContainer}>
        {displayedEvents.map((event) => (
          <PlaceCard key={event.id} announcement={event} />
        ))}
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Trier par date</Text>
          
          <TouchableOpacity 
            style={[styles.filterOption, sortOrder === 'recent' && styles.filterOptionSelected]}
            onPress={() => handleSortChange('recent')}
          >
            <Text style={[
              styles.filterOptionText,
              sortOrder === 'recent' && styles.filterOptionTextSelected
            ]}>
              Plus récent
            </Text>
            {sortOrder === 'recent' && (
              <MaterialCommunityIcons name="check" size={20} color={colors.yellow} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterOption, sortOrder === 'old' && styles.filterOptionSelected]}
            onPress={() => handleSortChange('old')}
          >
            <Text style={[
              styles.filterOptionText,
              sortOrder === 'old' && styles.filterOptionTextSelected
            ]}>
              Plus ancien
            </Text>
            {sortOrder === 'old' && (
              <MaterialCommunityIcons name="check" size={20} color={colors.yellow} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <Animated.View style={[styles.container, {
      opacity,
      transform: [{ scale }]
    }]}>
      <View style={styles.header}>
        <Text style={styles.title}>E-TICKET</Text>
        <Text style={styles.subtitle}>Votre billeterie</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un événement..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Image 
            source={require('../../../assets/images/icone filter.png')}
            style={styles.filterIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      {renderFilterModal()}
      <TabBar />

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
  container: {
    flex: 1,
    backgroundColor: colors.darkGrey,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    color: colors.yellow,
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'Inter_18pt-Bold',
  },
  subtitle: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Inter_18pt-Regular',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 8,
    color: 'white',
    paddingHorizontal: 15,
    backgroundColor: 'transparent',
    fontFamily: 'Inter_18pt-Regular',
  },
  filterButton: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  eventsContainer: {
    gap: 15,
  },
  loader: {
    marginTop: 20,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter_18pt-Regular',
    marginTop: 20,
  },
  errorText: {
    color: colors.yellow,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter_18pt-Regular',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.darkGrey,
    borderRadius: 15,
    padding: 20,
    width: '80%',
    borderWidth: 1,
    borderColor: colors.yellow,
  },
  modalTitle: {
    color: colors.yellow,
    fontSize: 18,
    fontFamily: 'Inter_18pt-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterOptionSelected: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  filterOptionText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Regular',
  },
  filterOptionTextSelected: {
    color: colors.yellow,
    fontFamily: 'Inter_18pt-Bold',
  },
  filterIcon: {
    width: 24,
    height: 24,
    tintColor: 'white'
  },
});