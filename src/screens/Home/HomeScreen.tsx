import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, ScrollView, ActivityIndicator, Alert, Animated } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { TabBar } from './components/TabBar';
import { NotificationIcon } from './components/NotificationIcon';
import { PlaceCard } from '../../components';
import { categoryService, authService, imageService, api } from '../../services/api';
import type { Announcement } from '../../types';
import type { Category, SubCategory } from '../../services/api';
import axios from 'axios';

const getCategoryIcon = (categoryName: string) => {
  switch (categoryName.toUpperCase()) {
    case 'CHILL':
      return <MaterialCommunityIcons name="music-note" size={20} color="white" />;
    case 'EVENT':
      return <FontAwesome5 name="ticket-alt" size={18} color="white" />;
    case 'PLACE TO BE':
      return <Ionicons name="location-sharp" size={20} color="white" />;
    default:
      return null;
  }
};

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCategories();
    loadUserImage();
    loadUnreadNotifications();
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

  useEffect(() => {
    if (selectedCategory) {
      const firstSubCategory = selectedCategory.sous_categories?.[0] || null;
      setSelectedSubCategory(firstSubCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory && selectedSubCategory) {
      loadAnnouncements();
    }
  }, [selectedCategory, selectedSubCategory]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getCategories();
      console.log('Categories response:', response);
      
      if (Array.isArray(response)) {
        setCategories(response);
        if (response.length > 0) {
          setSelectedCategory(response[0]);
        }
      } else {
        console.error('Format de réponse invalide:', response);
        throw new Error('Format de réponse invalide');
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Erreur lors du chargement des catégories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    if (!selectedCategory || !selectedSubCategory) return;
    
    try {
      setLoading(true);
      const params = {
        categorie: selectedCategory.id,
        sous_categorie: selectedSubCategory.id
      };
      
      console.log('Loading announcements with params:', params);
      const data = await categoryService.getAnnouncements(params);
      console.log('Received announcements data:', data);
      
      setAnnouncements(Array.isArray(data) ? data : []);
      
    } catch (error: unknown) {
      console.error('Error loading announcements:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      if (axios.isAxiosError(error)) {
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
      }
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserImage = async () => {
    try {
      console.log('Starting to load user image...');
      const user = await authService.getCurrentUser();
      console.log('User data:', user);
      
      if (user?.profile_image) {
        console.log('Raw profile_image path:', user.profile_image);
        const imageUrl = imageService.getImageUrl(user.profile_image);
        console.log('Constructed image URL:', imageUrl);
        setUserImage(imageUrl);
      } else {
        console.log('No profile image found in user data');
      }
    } catch (error) {
      console.error('Erreur chargement image utilisateur:', error);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const response = await api.get('/api/notifications/');
      const notifications = response.data || [];
      const unreadCount = notifications.filter((notif: any) => !notif.is_read).length;
      setUnreadNotificationsCount(unreadCount);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const getAnnouncementImage = () => {
    // Always return placeholder for now
    return require('../../../assets/images/place1.png');
  };

  const renderAnnouncements = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.yellow} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.announcementsScroll}
        contentContainerStyle={styles.announcementsContainer}
      >
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <PlaceCard
              key={announcement.id}
              announcement={announcement}
            />
          ))
        ) : (
          <Text style={styles.noDataText}>Aucune annonce disponible</Text>
        )}
      </ScrollView>
    );
  };

  if (loading && !selectedCategory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.yellow} />
        <Text style={styles.loadingText}>Chargement des catégories...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, {
      opacity,
      transform: [{ scale }]
    }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image 
              source={userImage ? { uri: userImage } : require('../../../assets/images/logo.png')} 
              style={[styles.logoSmall, userImage ? styles.userImage : undefined]}
              resizeMode={userImage ? "cover" : "contain"}
              onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
            />
          </View>
        </TouchableOpacity>
        <View style={styles.centerLogoContainer}>
          <Image 
            source={require('../../../assets/images/logo.png')} 
            style={styles.logoCenter}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <NotificationIcon count={unreadNotificationsCount} />
        </TouchableOpacity>
      </View>

      <View style={styles.fixedContent}>
        {/* Categories */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.yellow} />
            <Text style={styles.loadingText}>Chargement des catégories...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadCategories}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune catégorie disponible</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory?.id === category.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                {getCategoryIcon(category.nom)}
                <Text style={[
                  styles.categoryText,
                  selectedCategory?.id === category.id && styles.categoryTextActive
                ]}>
                  {category.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* SubCategories */}
        {selectedCategory && selectedCategory.sous_categories && selectedCategory.sous_categories.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.subCategoriesScroll}
            contentContainerStyle={styles.subCategoriesContainer}
          >
            {selectedCategory.sous_categories.map((subCategory: SubCategory) => (
              <TouchableOpacity
                key={subCategory.id}
                style={[
                  styles.subCategoryTab,
                  selectedSubCategory?.id === subCategory.id && styles.subCategoryTabActive
                ]}
                onPress={() => setSelectedSubCategory(subCategory)}
              >
                <Text style={[
                  styles.subCategoryText,
                  selectedSubCategory?.id === subCategory.id && styles.subCategoryTextActive
                ]}>
                  {subCategory.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Announcements List */}
      {renderAnnouncements()}

      <TabBar />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkGrey,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.darkGrey,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: colors.darkGrey,
    zIndex: 1,
  },
  logoContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.darkGrey,
    borderWidth: 1,
    borderColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoSmall: {
    width: '100%',
    height: '100%',
  },
  userImage: {
    borderRadius: 25,
  },
  centerLogoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 40,
    alignItems: 'center',
    zIndex: -1,
  },
  logoCenter: {
    width: 180,
    height: 45,
  },
  notificationButton: {
    padding: 8,
  },
  fixedContent: {
    backgroundColor: colors.darkGrey,
    zIndex: 1,
  },
  categoriesScroll: {
    marginVertical: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  categoryChipActive: {
    borderColor: colors.yellow,
  },
  categoryText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter_18pt-Bold',
  },
  categoryTextActive: {
    color: colors.yellow,
  },
  subCategoriesScroll: {
    marginTop: 10,
    marginBottom: 10,
  },
  subCategoriesContainer: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subCategoryTab: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subCategoryTabActive: {
    borderBottomColor: colors.yellow,
  },
  subCategoryText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Bold',
  },
  subCategoryTextActive: {
    color: colors.yellow,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementsScroll: {
    flex: 1,
  },
  announcementsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  noDataText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    padding: 15,
    backgroundColor: colors.yellow,
    borderRadius: 8,
  },
  retryText: {
    color: colors.darkGrey,
    fontSize: 16,
    fontFamily: 'Inter_18pt-Bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Bold',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Bold',
    marginTop: 20,
  },
}); 