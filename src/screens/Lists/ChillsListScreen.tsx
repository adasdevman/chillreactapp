import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../services/api';
import type { Payment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

type ChillsListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ChillsListScreen() {
  const navigation = useNavigation<ChillsListScreenNavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [soldTickets, setSoldTickets] = useState<{ [key: string]: Payment[] }>({});
  const [loading, setLoading] = useState(true);
  const showReceivedBookings = (route.params as any)?.showReceivedBookings || false;
  const showTickets = (route.params as any)?.showTickets || false;
  const showSoldTickets = (route.params as any)?.showSoldTickets || false;

  // Fonction pour vérifier si un statut est complété ou en attente
  const isValidStatus = (status: string | undefined) => {
    if (!status) return false;
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus === 'completed' || normalizedStatus === 'pending';
  };

  useEffect(() => {
    const loadPayments = async () => {
    try {
      setLoading(true);
        const response = await api.get('/api/payments/history/');
        const payments = response.data;
        console.log('Paiements reçus bruts:', payments);

        // Récupérer les détails complets pour chaque paiement
        const paymentsWithDetails = await Promise.all(
          payments.map(async (payment: Payment) => {
            try {
              if (payment.annonce?.id) {
                const annonceRes = await api.get(`/api/annonces/${payment.annonce.id}/`);
                return {
                  ...payment,
                  status: payment.status?.toLowerCase(),
                  payment_type: payment.payment_type?.toLowerCase(),
                  annonce: annonceRes.data
                };
              }
              return {
                ...payment,
                status: payment.status?.toLowerCase(),
                payment_type: payment.payment_type?.toLowerCase()
              };
            } catch (error) {
              console.error(`Erreur lors de la récupération de l'annonce ${payment.annonce?.id}:`, error);
              return payment;
            }
          })
        );

        console.log('Paiements avec détails:', paymentsWithDetails);

        if (showSoldTickets) {
          // Filtrer uniquement les tickets vendus
          const tickets = paymentsWithDetails.filter((p: Payment) => {
            const isTicket = p.payment_type === 'ticket';
            const isValidPayment = isValidStatus(p.status);
            return isTicket && isValidPayment;
          });
          
          // Grouper par événement
          const ticketsByEvent = tickets.reduce((acc: { [key: string]: Payment[] }, payment: Payment) => {
            const eventTitle = payment.annonce?.titre || `Événement #${payment.annonce?.id || 'inconnu'}`;
            if (!acc[eventTitle]) {
              acc[eventTitle] = [];
            }
            acc[eventTitle].push(payment);
            return acc;
          }, {});
          
          setSoldTickets(ticketsByEvent);
        } else if (showReceivedBookings) {
          // Filtrer uniquement les réservations reçues
          const reservations = paymentsWithDetails.filter((p: Payment) => {
            const isReservation = p.payment_type === 'table';
            const isValidPayment = isValidStatus(p.status);
            return isReservation && isValidPayment;
          });
          
          setPayments(reservations);
        } else {
          // Filtrer mes paiements selon le type demandé
          const myPayments = paymentsWithDetails.filter((p: Payment) => {
            const isCorrectType = showTickets ? p.payment_type === 'ticket' : p.payment_type === 'table';
            const isValidPayment = isValidStatus(p.status);
            return isCorrectType && isValidPayment;
          });
          
          setPayments(myPayments);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des paiements:', error);
        Alert.alert(
          'Erreur',
          'Une erreur est survenue lors du chargement des paiements. Veuillez réessayer.'
        );
    } finally {
      setLoading(false);
    }
  };

    if (user?.id) {
      loadPayments();
    } else {
      setLoading(false);
    }
  }, [showReceivedBookings, showTickets, showSoldTickets, user?.id]);

  const renderPaymentCard = (payment: Payment) => {
    if (!payment) return null;

    const formattedDate = new Date(payment.created).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <TouchableOpacity 
        key={payment.id} 
        style={styles.paymentCard}
        onPress={() => showPaymentDetails(payment)}
      >
        <View style={styles.paymentInfo}>
          <Text style={styles.transactionId}>
            Transaction ID: {payment.transaction_id || 'Non spécifié'}
          </Text>
          <Text style={styles.paymentTitle}>
            {payment.annonce?.titre || 'Non spécifié'}
          </Text>
          <Text style={styles.paymentDate}>{formattedDate}</Text>
          <View style={styles.statusContainer}>
            <Text style={[
              styles.paymentStatus,
              payment.status === 'completed' ? styles.statusCompleted : styles.statusPending
            ]}>
              {payment.status === 'completed' ? 'Payé' : 'En attente'}
            </Text>
            <Text style={styles.paymentType}>
              {payment.payment_type === 'ticket' ? 'Ticket' : 'Réservation'}
            </Text>
          </View>
          <Text style={styles.paymentAmount}>
            {Number(payment.amount).toLocaleString()} FCFA
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
    const amount = Number(payment.amount);
    let message = '';

    message += `Transaction ID: ${payment.transaction_id || 'Non spécifié'}\n`;
    message += `Date: ${formattedDate}\n\n`;

    if (payment.annonce) {
      message += `Établissement: ${payment.annonce.titre}\n`;
      message += `Catégorie: ${payment.annonce.categorie_nom || 'Non spécifié'}\n`;
      if (payment.annonce.sous_categorie_nom) {
        message += `Sous-catégorie: ${payment.annonce.sous_categorie_nom}\n`;
      }
    }

    message += '\nDétails du paiement:\n';
    if (tarif) {
      message += `Formule: ${tarif.nom}\n`;
      message += `Prix total: ${tarif.prix.toLocaleString()} FCFA\n`;
      if (payment.payment_type !== 'ticket' && tarif.prix > 0) {
        const tauxAvance = Math.round((amount / tarif.prix) * 100);
        message += `Montant d'avance: ${amount.toLocaleString()} FCFA\n`;
        message += `Taux d'avance: ${tauxAvance}%\n`;
      }
    } else {
      message += `Montant: ${amount.toLocaleString()} FCFA\n`;
    }

    message += `\nType: ${payment.payment_type === 'ticket' ? 'Ticket' : 'Réservation'}\n`;
    message += `Statut: ${payment.status === 'completed' ? 'Payé' : 'En attente'}\n`;

    if (payment.description) {
      message += `\nDescription: ${payment.description}\n`;
    }

    Alert.alert(
      'Détails du paiement',
      message,
      [{ text: 'Fermer', style: 'cancel' }]
    );
  };

  const renderSoldTicketsCard = (eventTitle: string, tickets: Payment[]) => {
    return (
      <TouchableOpacity 
        key={eventTitle}
        style={styles.paymentCard}
        onPress={() => showSoldTicketsDetails(eventTitle, tickets)}
      >
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle} numberOfLines={1}>{eventTitle}</Text>
          <Text style={styles.ticketCount}>
            {tickets.length} ticket{tickets.length > 1 ? 's' : ''} vendu{tickets.length > 1 ? 's' : ''}
          </Text>
          <Text style={styles.paymentAmount}>
            {tickets.reduce((sum, ticket) => sum + Number(ticket.amount), 0).toLocaleString()} FCFA
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.yellow} />
      </TouchableOpacity>
    );
  };

  const showSoldTicketsDetails = (eventTitle: string, tickets: Payment[]) => {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.yellow} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {showReceivedBookings ? 'Réservations reçues' : 
           showTickets ? 'Mes Tickets' : 
           showSoldTickets ? 'Tickets vendus' : 
           'Mes Réservations'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.yellow} style={styles.loader} />
        ) : showSoldTickets ? (
          Object.keys(soldTickets).length === 0 ? (
            <Text style={styles.emptyText}>Aucun ticket vendu</Text>
          ) : (
            Object.entries(soldTickets).map(([eventTitle, tickets]) => 
              renderSoldTicketsCard(eventTitle, tickets)
            )
          )
        ) : payments.length === 0 ? (
          <Text style={styles.emptyText}>
            {showReceivedBookings ? 'Aucune réservation reçue' : 
             showTickets ? 'Aucun ticket' : 
             'Aucune réservation'}
          </Text>
        ) : (
          payments.map(payment => renderPaymentCard(payment))
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 50,
  },
  transactionId: {
    color: colors.yellow,
    fontSize: 14,
    fontFamily: fonts.medium,
    marginBottom: 4,
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
    marginTop: 8,
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
  paymentType: {
    color: colors.yellow,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  ticketCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 2,
  },
}); 