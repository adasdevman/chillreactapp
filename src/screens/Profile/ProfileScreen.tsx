import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { TabBar } from '../Home/components/TabBar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NotificationIcon } from '../Home/components/NotificationIcon';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { authService } from '../../services/api';
import { API_URL } from '../../services/api';
import { fonts } from '../../theme/fonts';
import { PlaceCardHorizontal } from '../../components/PlaceCardHorizontal';
import { Swipeable } from 'react-native-gesture-handler';
import type { Announcement } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import CustomConfirmAlert from '../../components/CustomConfirmAlert';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserData {
  first_name: string;
  last_name: string;
  profile_image: string;
  email: string;
  role: string;
  phone: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    first_name: '',
    last_name: '',
    profile_image: '',
    email: '',
    role: '',
    phone: ''
  });
  const [myAnnouncements, setMyAnnouncements] = useState<Announcement[]>([]);
  const [myTickets, setMyTickets] = useState<Announcement[]>([]);
  const [myChills, setMyChills] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteAlert, setDeleteAlert] = useState({
    visible: false,
    announcementId: null as number | null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, announcementsRes, ticketsRes, chillsRes] = await Promise.all([
          api.get('/api/profile/'),
          api.get('/api/annonces/mes-annonces/'),
          api.get('/api/annonces/mes-tickets/'),
          api.get('/api/annonces/mes-chills/')
        ]);

        // Mettre à jour les données du profil
        const profileData = profileRes.data;
        setUserData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          profile_image: profileData.profile_image || '',
          email: profileData.email || '',
          role: profileData.role || '',
          phone: profileData.phone_number || ''
        });

        // Mettre à jour les annonces et réservations
        setMyAnnouncements(announcementsRes.data || []);
        setMyTickets(ticketsRes.data || []);
        setMyChills(chillsRes.data || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const handleDeleteAnnouncement = (id: number) => {
    setDeleteAlert({
      visible: true,
      announcementId: id,
    });
  };

  const confirmDelete = async () => {
    if (deleteAlert.announcementId) {
      try {
        await api.delete(`/api/annonces/${deleteAlert.announcementId}/`);
        setMyAnnouncements(prev => prev.filter(a => a.id !== deleteAlert.announcementId));
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
    setDeleteAlert({ visible: false, announcementId: null });
  };

  const handleSettingsPress = () => {
    navigation.navigate('UserSettings');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigation.replace('Auth');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const getFullName = (): string => {
    return `${userData.first_name} ${userData.last_name}`.trim() || 'Utilisateur';
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
          onPress={() => handleDeleteAnnouncement(announcementId)}
        >
          <MaterialCommunityIcons name="delete" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAnnouncementsSection = () => {
    // Ne montrer la section que pour les ANNONCEUR et ADMIN
    if (userData.role !== 'ANNONCEUR' && userData.role !== 'ADMIN') return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes annonces</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => navigation.navigate('AnnouncementsList')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateAnnouncement')}
            >
              <MaterialCommunityIcons name="plus" size={24} color={colors.yellow} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.announcementsContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : myAnnouncements.length === 0 ? (
            <Text style={styles.emptyText}>Aucune annonce</Text>
          ) : (
            myAnnouncements.slice(0, 2).map((announcement) => (
              <Swipeable
                key={announcement.id}
                renderRightActions={() => renderRightActions(announcement.id)}
              >
                <PlaceCardHorizontal
                  title={announcement.titre}
                  category={announcement.categorie_nom}
                  subCategory={announcement.sous_categorie_nom}
                  imageUrl={announcement.photos?.[0]?.image || ''}
                  onPress={() => navigation.navigate('AnnouncementDetail', { announcement })}
                />
              </Swipeable>
            ))
          )}
        </View>
      </View>
    );
  };

  const renderChillsSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Chills</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ChillsList')}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardsContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : myChills.length === 0 ? (
            <Text style={styles.emptyText}>Aucun chill</Text>
          ) : (
            myChills.slice(0, 2).map((chill) => (
              <PlaceCardHorizontal
                key={chill.id}
                title={chill.titre}
                category={chill.categorie_nom}
                subCategory={chill.sous_categorie_nom}
                imageUrl={chill.photos?.[0]?.image || ''}
                onPress={() => navigation.navigate('AnnouncementDetail', { announcement: chill })}
              />
            ))
          )}
        </View>
      </View>
    );
  };

  const renderTicketsSection = () => {
    return (
      <View style={[styles.section, styles.lastSection]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Tickets</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TicketsList')}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardsContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : myTickets.length === 0 ? (
            <Text style={styles.emptyText}>Aucun ticket</Text>
          ) : (
            myTickets.slice(0, 2).map((ticket) => (
              <PlaceCardHorizontal
                key={ticket.id}
                title={ticket.titre}
                category={ticket.categorie_nom}
                subCategory={ticket.sous_categorie_nom}
                imageUrl={ticket.photos?.[0]?.image || ''}
                onPress={() => navigation.navigate('AnnouncementDetail', { announcement: ticket })}
              />
            ))
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSettingsPress}>
          <MaterialCommunityIcons name="account-cog" size={32} color={colors.yellow} />
        </TouchableOpacity>
        <TouchableOpacity>
          <NotificationIcon count={4} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            {userData.profile_image ? (
              <Image
                source={{ uri: `${API_URL}${userData.profile_image}` }}
                style={styles.avatarImage}
              />
            ) : (
              <MaterialCommunityIcons name="account" size={60} color={colors.yellow} />
            )}
            <TouchableOpacity style={styles.cameraButton}>
              <MaterialCommunityIcons name="camera" size={24} color={colors.yellow} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.name}>{getFullName()}</Text>
        <Text style={styles.email}>{userData.email}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentSection}>
        {renderAnnouncementsSection()}
        {renderChillsSection()}
        {renderTicketsSection()}
      </ScrollView>

      <TabBar />

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 46,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: colors.darkGrey,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraButton: {
    position: 'absolute',
    bottom: -3,
    right: -5,
  },
  name: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  email: {
    color: colors.yellow,
    fontSize: 16,
    fontFamily: fonts.regular,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 40,
    paddingBottom: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  seeAllText: {
    color: colors.yellow,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 15,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 120,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.yellow,
  },
  announcementsContainer: {
    marginTop: 10,
  },
  announcementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginVertical: 20,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginVertical: 20,
  },
  lastSection: {
    marginBottom: 50,
  },
}); 