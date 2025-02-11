import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Swipeable } from 'react-native-gesture-handler';
import { PlaceCardHorizontal } from '../../components/PlaceCardHorizontal';
import { api } from '../../services/api';
import type { Announcement } from '../../types';
import CustomConfirmAlert from '../../components/CustomConfirmAlert';

type AnnouncementsListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AnnouncementsListScreen() {
  const navigation = useNavigation<AnnouncementsListScreenNavigationProp>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState({
    visible: false,
    announcementId: null as number | null,
  });

  const loadAnnouncements = async (pageNumber: number, refresh = false) => {
    if (!hasMore && !refresh) return;
    
    try {
      setLoadingMore(true);
      const response = await api.get(`/api/annonces/mes-annonces/?page=${pageNumber}`);
      const newAnnouncements = Array.isArray(response.data) ? response.data : response.data.results;
      
      if (refresh) {
        setAnnouncements(newAnnouncements);
      } else {
        setAnnouncements(prev => [...prev, ...newAnnouncements]);
      }
      
      if (response.data.next !== undefined) {
        setHasMore(!!response.data.next);
      } else {
        setHasMore(false);
      }
      setPage(pageNumber);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnnouncements(1, true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    loadAnnouncements(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadAnnouncements(page + 1);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.yellow} />
      </View>
    );
  };

  const renderItem = ({ item: announcement }: { item: Announcement }) => (
    <Swipeable
      key={announcement.id}
      renderRightActions={() => renderRightActions(announcement.id)}
      overshootRight={false}
    >
      <PlaceCardHorizontal
        title={announcement.titre}
        category={announcement.categorie_nom}
        subCategory={announcement.sous_categorie_nom}
        imageUrl={announcement.photos?.[0]?.image || ''}
        onPress={() => navigation.navigate('AnnouncementDetail', { announcement })}
      />
    </Swipeable>
  );

  const handleDelete = async (id: number) => {
    setDeleteAlert({
      visible: true,
      announcementId: id,
    });
  };

  const confirmDelete = async () => {
    if (deleteAlert.announcementId) {
      try {
        await api.delete(`/api/annonces/${deleteAlert.announcementId}/`);
        setAnnouncements(prev => prev.filter(a => a.id !== deleteAlert.announcementId));
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
    setDeleteAlert({ visible: false, announcementId: null });
  };

  const renderRightActions = (announcementId: number) => {
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditAnnouncement', { id: announcementId })}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(announcementId)}
        >
          <MaterialCommunityIcons name="delete" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
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
        <Text style={styles.title}>Vos Annonces</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateAnnouncement')}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.yellow} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.yellow} style={styles.loader} />
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Aucune annonce</Text>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.flatList}
        />
      )}

      <CustomConfirmAlert
        visible={deleteAlert.visible}
        title="Confirmation"
        message="Êtes-vous sûr de vouloir supprimer cette annonce ?"
        onCancel={() => setDeleteAlert({ visible: false, announcementId: null })}
        onConfirm={confirmDelete}
      />
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  cardsContainer: {
    gap: 15,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
  },
  actionButton: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
   
  },
  deleteButton: {
    
  },
  announcementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 120,
  },
  announcementImage: {
    width: 120,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  announcementContent: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  announcementTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: fonts.bold,
    marginBottom: 5,
  },
  announcementCategory: {
    color: colors.yellow,
    fontSize: 14,
    fontFamily: fonts.medium,
    marginBottom: 2,
  },
  announcementSubCategory: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  separator: {
    height: 15,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  flatList: {
    flex: 1,
  },
}); 