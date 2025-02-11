import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TextInput, Text, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { TabBar } from '../Home/components/TabBar';
import { PlaceCard } from '../../components';
import { categoryService } from '../../services/api';
import type { Announcement } from '../../types';
import debounce from 'lodash/debounce';

export default function SearchScreen() {
  const [suggestions, setSuggestions] = useState<Announcement[]>([]);
  const [searchResults, setSearchResults] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSuggestions();
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

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        categorie: 1,  // ID de la première catégorie
        sous_categorie: 1  // ID de la première sous-catégorie
      };
      
      const announcements = await categoryService.getAnnouncements(params);
      console.log('Suggestions loaded:', announcements);
      setSuggestions(Array.isArray(announcements) ? announcements.slice(0, 3) : []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des suggestions:', error);
      setError('Impossible de charger les suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
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
          search: query.trim()  // Assurez-vous que la requête est nettoyée
        };
        
        const results = await categoryService.getAnnouncements(params);
        console.log('Search results:', results);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        setError('Erreur lors de la recherche');
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500),
    []
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const renderSearchResults = () => {
    if (searching) {
      return <ActivityIndicator size="large" color={colors.yellow} />;
    }

    if (searchQuery && searchResults.length === 0) {
      return <Text style={styles.emptyText}>Aucun résultat trouvé</Text>;
    }

    if (searchResults.length > 0) {
      return (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.sectionTitle}>Résultats</Text>
          <View style={styles.resultsContainer}>
            {searchResults.map((result) => (
              <PlaceCard key={result.id} announcement={result} />
            ))}
          </View>
        </View>
      );
    }

    return null;
  };

  const renderSuggestions = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={colors.yellow} />;
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    if (suggestions.length === 0) {
      return <Text style={styles.emptyText}>Aucune suggestion disponible</Text>;
    }

    return (
      <View style={styles.suggestionsContainer}>
        {suggestions.map((suggestion) => (
          <PlaceCard key={suggestion.id} announcement={suggestion} />
        ))}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, {
      opacity,
      transform: [{ scale }]
    }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>RECHERCHE</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un lieu, un événement..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {!searchQuery && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggestions</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSearchResults()}
        {!searchQuery && renderSuggestions()}
      </ScrollView>
      
      <TabBar />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkGrey,
  },
  header: {
    paddingTop: 60,
    backgroundColor: colors.darkGrey,
    paddingBottom: 15,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    color: colors.yellow,
    fontFamily: 'Inter_18pt-Bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 8,
    color: 'white',
    paddingHorizontal: 15,
    backgroundColor: 'transparent',
    fontFamily: 'Inter_18pt-Regular',
  },
  sectionHeader: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter_18pt-Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  searchResultsContainer: {
    marginBottom: 30,
  },
  resultsContainer: {
    gap: 15,
  },
  suggestionsContainer: {
    gap: 15,
    marginTop: 15,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter_18pt-Regular',
  },
  errorText: {
    color: colors.yellow,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter_18pt-Regular',
  }
}); 