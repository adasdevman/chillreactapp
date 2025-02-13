import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, Alert, Modal } from 'react-native';
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
import type { Announcement, Payment } from '../../types';
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
  const [completedChills, setCompletedChills] = useState<Payment[]>([]);
  const [completedTickets, setCompletedTickets] = useState<Payment[]>([]);
  const [receivedBookings, setReceivedBookings] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteAlert, setDeleteAlert] = useState({
    visible: false,
    announcementId: null as number | null,
  });
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<string>('');
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [soldTickets, setSoldTickets] = useState<{ [key: string]: Payment[] }>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Début du chargement des données...');
        console.log('User:', user);
        
        const [profileRes, announcementsRes, paymentsRes, notificationsRes, receivedBookingsRes, soldTicketsRes] = await Promise.all([
          api.get('/api/profile/'),
          api.get('/api/annonces/mes-annonces/'),
          api.get('/api/payments/history/'),
          api.get('/api/notifications/'),
          userData.role === 'ANNONCEUR' || userData.role === 'ADMIN' 
            ? api.get('/api/payments/received-bookings/') 
            : Promise.resolve({ data: [] }),
          userData.role === 'ANNONCEUR' || userData.role === 'ADMIN'
            ? api.get('/api/payments/sold-tickets/')
            : Promise.resolve({ data: [] })
        ]);

        // Mettre à jour le compteur de notifications non lues
        const notifications = notificationsRes.data || [];
        const unreadCount = notifications.filter((notif: any) => !notif.is_read).length;
        setUnreadNotificationsCount(unreadCount);

        console.log('Réponse de l\'API payments:', paymentsRes);
        console.log('Status de la réponse:', paymentsRes.status);
        console.log('Headers:', paymentsRes.headers);

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

        // Mettre à jour les annonces
        setMyAnnouncements(announcementsRes.data || []);

        // Traiter les paiements
        const payments = paymentsRes.data || [];
        console.log('Paiements reçus:', payments);
        
        // Normaliser et filtrer les paiements complétés
        const completedPayments = payments.filter((p: Payment) => 
          p.status?.toLowerCase() === 'completed'
        );
        console.log('Paiements complétés:', completedPayments);
        
        // Récupérer les détails des annonces pour les paiements complétés
        const paymentsWithAnnouncements = await Promise.all(
          completedPayments.map(async (payment: Payment) => {
            try {
              const annonceRes = await api.get(`/api/annonces/${payment.annonce}/`);
              return {
                ...payment,
                status: payment.status?.toLowerCase(),
                payment_type: payment.payment_type?.toLowerCase(),
                annonce: annonceRes.data
              };
            } catch (error) {
              console.error(`Erreur lors de la récupération de l'annonce ${payment.annonce}:`, error);
              return {
                ...payment,
                status: payment.status?.toLowerCase(),
                payment_type: payment.payment_type?.toLowerCase()
              };
            }
          })
        );
        
        console.log('Paiements avec détails des annonces:', paymentsWithAnnouncements);
        
        // Séparer les paiements par catégorie
        const reservations = paymentsWithAnnouncements.filter((p: Payment) => {
          if (!p.annonce?.categorie_nom) return false;
          const category = p.annonce.categorie_nom.toUpperCase();
          return category === 'CHILL' || category === 'PLACE TO BE';
        });
        
        const tickets = paymentsWithAnnouncements.filter((p: Payment) => {
          if (!p.annonce?.categorie_nom) return false;
          const category = p.annonce.categorie_nom.toUpperCase();
          return category === 'EVENT';
        });
        
        console.log('Réservations (Chill & Place to Be):', reservations);
        console.log('Tickets (Event):', tickets);
        
        setCompletedChills(reservations);
        setCompletedTickets(tickets);

        // Mettre à jour les réservations reçues pour les annonceurs
        if (userData.role === 'ANNONCEUR' || userData.role === 'ADMIN') {
          const normalizedBookings = (receivedBookingsRes.data || []).map((booking: Payment) => ({
            ...booking,
            status: booking.status?.toLowerCase(),
            payment_type: booking.payment_type?.toLowerCase()
          }));
          setReceivedBookings(normalizedBookings);

          // Traiter les tickets vendus
          const normalizedSoldTickets = (soldTicketsRes.data || []).map((ticket: Payment) => ({
            ...ticket,
            status: ticket.status?.toLowerCase(),
            payment_type: ticket.payment_type?.toLowerCase()
          }));

          const ticketsByEvent = normalizedSoldTickets.reduce((acc: { [key: string]: Payment[] }, payment: Payment) => {
            if (payment.annonce?.titre) {
              if (!acc[payment.annonce.titre]) {
                acc[payment.annonce.titre] = [];
              }
              acc[payment.annonce.titre].push(payment);
            }
            return acc;
          }, {});
          setSoldTickets(ticketsByEvent);
        }

      } catch (error: any) {
        console.error('Error loading data:', error);
        if (error.response) {
          console.error('Erreur API:', error.response.status, error.response.data);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    } else {
      console.log('Pas d\'utilisateur connecté');
    }
  }, [user, userData.role]);

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

  const renderPaymentCard = (payment: Payment) => {
    if (!payment) return null;

    const formattedDate = new Date(payment.created).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const status = payment.status?.toLowerCase() || 'pending';
    const paymentType = payment.payment_type?.toLowerCase() || 'reservation';
    const amount = Number(payment.amount || 0).toLocaleString();

    return (
      <TouchableOpacity 
        key={payment.id} 
        style={styles.paymentCard}
        onPress={() => showPaymentDetails(payment)}
      >
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle} numberOfLines={1}>
            {payment.transaction_id || `Transaction #${payment.id}`}
          </Text>
          {payment.annonce && (
            <>
              <Text style={styles.paymentSubtitle} numberOfLines={1}>
                {payment.annonce.titre || 'Établissement non spécifié'}
              </Text>
              {payment.annonce.categorie_nom && (
                <Text style={styles.paymentType}>
                  {payment.annonce.categorie_nom}
                  {payment.annonce.sous_categorie_nom ? ` - ${payment.annonce.sous_categorie_nom}` : ''}
                </Text>
              )}
            </>
          )}
          <Text style={styles.paymentDate}>{formattedDate}</Text>
          <Text style={styles.paymentAmount}>
            {amount} FCFA
          </Text>
          <View style={styles.statusContainer}>
            <Text style={[
              styles.paymentStatus,
              status === 'completed' ? styles.statusCompleted : styles.statusPending
            ]}>
              {status === 'completed' ? 'Payé' : 'En attente'}
            </Text>
            <Text style={styles.paymentType}>
              {paymentType === 'ticket' ? 'Ticket' : 'Réservation'}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={24} 
          color={colors.yellow} 
        />
      </TouchableOpacity>
    );
  };

  const showPaymentDetails = (payment: Payment) => {
    if (!payment) return;

    const formattedDate = new Date(payment.created).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const tarif = payment.annonce?.tarifs?.find(t => t.id === payment.tarif);
    const isEvent = payment.annonce?.categorie_nom?.toUpperCase() === 'EVENT';
    const status = payment.status?.toLowerCase() || 'pending';
    const paymentType = payment.payment_type?.toLowerCase() || 'reservation';
    const amount = Number(payment.amount || 0);
    
    let message = '';

    // Informations de base
    message += `ID Transaction: ${payment.transaction_id || payment.id}\n`;
    message += `Date: ${formattedDate}\n\n`;
    
    // Informations de l'établissement
    if (payment.annonce) {
      message += `Établissement: ${payment.annonce.titre || 'Non spécifié'}\n`;
      if (payment.annonce.categorie_nom) {
        message += `Catégorie: ${payment.annonce.categorie_nom}\n`;
        if (payment.annonce.sous_categorie_nom) {
          message += `Sous-catégorie: ${payment.annonce.sous_categorie_nom}\n`;
        }
      }
    }

    // Informations de paiement
    message += '\nDétails du paiement:\n';
    if (tarif) {
      message += `Formule: ${tarif.nom}\n`;
      message += `Prix total: ${tarif.prix.toLocaleString()} FCFA\n`;
      if (!isEvent && tarif.prix > 0) {
        const tauxAvance = Math.round((amount / tarif.prix) * 100);
        message += `Montant d'avance: ${amount.toLocaleString()} FCFA\n`;
        message += `Taux d'avance: ${tauxAvance}%\n`;
      }
    } else {
      message += `Montant: ${amount.toLocaleString()} FCFA\n`;
    }

    // Type et statut
    message += `\nType: ${paymentType === 'ticket' ? 'Ticket' : 'Réservation'}\n`;
    message += `Statut: ${status === 'completed' ? 'Payé' : 'En attente'}\n`;

    // Description si disponible
    if (payment.description) {
      message += `\nDescription: ${payment.description}\n`;
    }

    Alert.alert(
      'Détails du paiement',
      message,
      [{ text: 'Fermer', style: 'cancel' }]
    );
  };

  const renderReceivedBookingCard = (payment: Payment) => {
    return (
        <TouchableOpacity 
        key={payment.id} 
        style={styles.paymentCard}
        onPress={() => showReceivedBookingDetails(payment)}
      >
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle} numberOfLines={1}>
            {payment.annonce?.titre || 'Réservation'}
          </Text>
          <Text style={styles.clientInfo}>
            Client: {payment.user?.first_name} {payment.user?.last_name}
          </Text>
          <Text style={styles.clientInfo}>
            Email: {payment.user?.email}
          </Text>
          <Text style={styles.clientInfo}>
            Tél: {payment.user?.phone_number || 'Non renseigné'}
          </Text>
          <Text style={styles.paymentDate}>
            {new Date(payment.created).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          <Text style={styles.paymentAmount}>
            {payment.amount} FCFA
          </Text>
        </View>
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={24} 
          color={colors.yellow} 
        />
        </TouchableOpacity>
    );
  };

  const showReceivedBookingDetails = (payment: Payment) => {
    const annonce = payment.annonce;
    const tarif = annonce?.tarifs?.find((t: any) => t.id === payment.tarif);
    const isEvent = annonce?.categorie_nom?.toUpperCase() === 'EVENT';
    const dateOptions: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    const formattedDate = new Date(payment.created).toLocaleString('fr-FR', dateOptions);

    const montantTotal = tarif ? Number(tarif.prix) : Number(payment.amount);
    const montantAvance = Number(payment.amount);
    const tauxAvance = Math.round((montantAvance / montantTotal) * 100);

    const detailsMessage = `Informations de la réservation:
------------------------
ID Transaction: ${payment.id}
Date: ${formattedDate}
Status: ${payment.status}

Informations du client:
------------------------
Nom: ${payment.user?.first_name} ${payment.user?.last_name}
Email: ${payment.user?.email}
Téléphone: ${payment.user?.phone_number || 'Non renseigné'}
Adresse: ${payment.user?.address || 'Non renseignée'}
Ville: ${payment.user?.city || 'Non renseignée'}

Détails de la réservation:
-------------------------
${tarif ? `Formule: ${tarif.nom}
Prix total: ${tarif.prix} FCFA` : `Montant total: ${payment.amount} FCFA`}
${!isEvent ? `Montant d'avance payé: ${payment.amount} FCFA
Taux d'avance: ${tauxAvance}%` : ''}

${payment.description ? `\nDescription supplémentaire:\n${payment.description}` : ''}`;

    setSelectedPaymentDetails(detailsMessage);
    setPaymentModalVisible(true);
  };

  const renderAnnouncementsSection = () => {
    if (!userData || userData.role !== 'ANNONCEUR') return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes annonces</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('AnnouncementsList' as never)}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
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
                renderRightActions={() => (
                  <View style={styles.rightActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => navigation.navigate('EditAnnouncement', { id: announcement.id })}
                    >
                      <MaterialCommunityIcons name="pencil" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteAnnouncement(announcement.id)}
                    >
                      <MaterialCommunityIcons name="delete" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
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

  const renderReceivedBookingsSection = () => {
    if (!userData || userData.role !== 'ANNONCEUR') return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Réservations reçues</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('ChillsList', { showReceivedBookings: true } as const)}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.paymentsContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : receivedBookings.length === 0 ? (
            <Text style={styles.emptyText}>Aucune réservation reçue</Text>
          ) : (
            receivedBookings.slice(0, 3).map(payment => renderReceivedBookingCard(payment))
          )}
        </View>
      </View>
    );
  };

  const renderSoldTicketsSection = () => {
    if (!userData || userData.role !== 'ANNONCEUR') return null;

    const ticketsCount = Object.keys(soldTickets).length;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tickets vendus</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('ChillsList', { showSoldTickets: true })}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.paymentsContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : ticketsCount === 0 ? (
            <Text style={styles.emptyText}>Aucun ticket vendu</Text>
          ) : (
            Object.entries(soldTickets).slice(0, 3).map(([eventTitle, tickets]) => (
              <TouchableOpacity 
                key={eventTitle}
                style={styles.eventTicketsCard}
                onPress={() => showEventTicketsDetails(eventTitle, tickets)}
              >
                <View style={styles.eventTicketsInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{eventTitle}</Text>
                  <Text style={styles.ticketCount}>{tickets.length} ticket{tickets.length > 1 ? 's' : ''} vendu{tickets.length > 1 ? 's' : ''}</Text>
                  <Text style={styles.totalAmount}>
                    {tickets.reduce((sum, ticket) => sum + Number(ticket.amount), 0).toLocaleString()} FCFA
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.yellow} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    );
  };

  const showEventTicketsDetails = (eventTitle: string, tickets: Payment[]) => {
    const totalAmount = tickets.reduce((sum, ticket) => sum + Number(ticket.amount), 0);
    const detailsMessage = `Événement: ${eventTitle}\n\n` +
      `Nombre total de tickets: ${tickets.length}\n` +
      `Montant total: ${totalAmount.toLocaleString()} FCFA\n\n` +
      `Détails des ventes:\n` +
      tickets.map(ticket => 
        `- ${new Date(ticket.created).toLocaleDateString('fr-FR')} : ` +
        `${ticket.user?.first_name} ${ticket.user?.last_name} - ${Number(ticket.amount).toLocaleString()} FCFA`
      ).join('\n');

    Alert.alert(
      'Détails des tickets vendus',
      detailsMessage,
      [{ text: 'Fermer', style: 'cancel' }]
    );
  };

  const renderChillsSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes réservations</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('ChillsList' as never)}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.paymentsContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : completedChills.length === 0 ? (
            <Text style={styles.emptyText}>Aucune réservation</Text>
          ) : (
            completedChills.slice(0, 3).map(payment => renderPaymentCard(payment))
          )}
        </View>
      </View>
    );
  };

  const renderTicketsSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes tickets</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('ChillsList', { showTickets: true })}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.paymentsContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : completedTickets.length === 0 ? (
            <Text style={styles.emptyText}>Aucun ticket</Text>
          ) : (
            completedTickets.slice(0, 3).map(payment => renderPaymentCard(payment))
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
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <NotificationIcon count={unreadNotificationsCount} />
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

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {renderAnnouncementsSection()}
        {renderReceivedBookingsSection()}
        {renderSoldTicketsSection()}
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Détails du paiement</Text>
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalText}>{selectedPaymentDetails}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setPaymentModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  seeAllText: {
    color: colors.yellow,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  paymentsContainer: {
    marginTop: 10,
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
  paymentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentInfo: {
    flex: 1,
    marginRight: 10,
  },
  paymentTitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  paymentSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 4,
  },
  paymentDate: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 2,
  },
  paymentAmount: {
    color: colors.yellow,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  paymentType: {
    color: colors.yellow,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  paymentStatus: {
    fontSize: 14,
    fontFamily: fonts.medium,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    color: 'white',
  },
  statusCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#FFA000',
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
    backgroundColor: colors.yellow,
  },
  deleteButton: {
    backgroundColor: 'red',
  },
  announcementsContainer: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.darkGrey,
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    color: colors.yellow,
    fontSize: 20,
    fontFamily: fonts.bold,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalScrollView: {
    marginBottom: 15,
  },
  modalText: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.regular,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.yellow,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  clientInfo: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 2,
  },
  eventTicketsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTicketsInfo: {
    flex: 1,
    marginRight: 10,
  },
  eventTitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  ticketCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 2,
  },
  totalAmount: {
    color: colors.yellow,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
}); 