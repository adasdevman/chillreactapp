import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../services/api';
import WebView from 'react-native-webview';
import AuthPopup from '../../components/AuthPopup';
import { useAuth } from '../../contexts/AuthContext';
import { fonts } from '../../theme/fonts';
import type { Announcement, BillingInfo } from '../../types';
import type { User as ExtendedUser } from '../../types';
import { API_CONFIG, handleApiError } from '../../config';

interface PaymentResponse {
  montant_total: number;
  taux_avance: number;
  montant_avance: number;
  id: string | null;
}

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PaymentScreenProps {
  announcement: Announcement;
  paymentType: 'ticket' | 'reservation';
}

const CINETPAY_SCRIPT = `
  <script src="https://cdn.cinetpay.com/seamless/main.js" type="text/javascript"></script>
`;

const PAYMENT_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${CINETPAY_SCRIPT}
</head>
<body>
  <div id="payment-container"></div>
  <script>
    function initPayment(data) {
      CinetPay.setConfig({
        apikey: '12912847765bc0db748fdd44.77597603',  // Clé API de test
        site_id: '445160',  // ID de site de test
        mode: 'SANDBOX', // SANDBOX pour les tests, PRODUCTION pour la production
        notify_url: 'http://10.0.2.2:8000/api/webhook/cinetpay/'  // Pour Android Emulator
        // notify_url: 'http://localhost:8000/api/webhook/cinetpay/'  // Pour iOS Simulator
      });

      CinetPay.getCheckout({
        transaction_id: data.paymentId,
        amount: data.amount,
        currency: 'XOF',
        channels: 'ALL',
        description: data.description,
        // Informations client (optionnelles mais recommandées)
        customer_name: data.customerName || '',
        customer_surname: data.customerSurname || '',
        customer_email: data.customerEmail || '',
        customer_phone_number: data.customerPhone || '',
        customer_address: data.customerAddress || '',
        customer_city: data.customerCity || '',
        customer_country: 'CI',  // Code pays (CI pour Côte d'Ivoire)
        customer_state: 'CI',
        customer_zip_code: '00225'
      });

      CinetPay.waitResponse(function(data) {
        if (data.status == "REFUSED") {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_failed',
            data: data
          }));
        } else if (data.status == "ACCEPTED") {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_success',
            data: data
          }));
        }
      });

      CinetPay.onClose(function(data) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'payment_closed',
          data: data
        }));
      });
    }
  </script>
</body>
</html>
`;

export default function PaymentScreen() {
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const route = useRoute<PaymentScreenRouteProp>();
  const { announcement, paymentType } = route.params;
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<number | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  });
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const { user, token } = useAuth();
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentResponse | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [error, setError] = useState('');
  const [paymentScript, setPaymentScript] = useState<string>('');

  const formulas = announcement?.tarifs?.length > 0 
    ? announcement.tarifs 
    : paymentType === 'ticket' 
      ? [
          { id: 1, nom: 'Standard', prix: 5000 },
          { id: 2, nom: 'VIP', prix: 10000 },
          { id: 3, nom: 'Premium', prix: 15000 }
        ]
      : [
          { id: 4, nom: 'Table 2 personnes', prix: 20000 },
          { id: 5, nom: 'Table 4 personnes', prix: 35000 },
          { id: 6, nom: 'Table 6 personnes', prix: 50000 }
        ];

  const getMinPrice = () => {
    if (!formulas?.length) return 0;
    return Math.min(...formulas.map(f => f.prix));
  };

  useEffect(() => {
    if (user) {
      const loadBillingInfo = async () => {
        try {
          const response = await api.get('/api/profile/');
          const userData = response.data;
          console.log('Profile data:', userData);
          
          const newBillingInfo: BillingInfo = {
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone_number || '',
            address: userData.address || '',
            city: userData.city || '',
          };
          
          console.log('New billing info:', newBillingInfo);
          setBillingInfo(newBillingInfo);
        } catch (error) {
          console.error('Error loading billing info:', error);
        }
      };

      loadBillingInfo();
    }
  }, [user]);

  useEffect(() => {
    // Add CinetPay SDK script
    const script = `
      <script src="https://cdn.cinetpay.com/seamless/main.js" type="text/javascript"></script>
    `;
    setPaymentScript(script);
  }, []);

  const handleFormulaSelect = (formulaId: number) => {
    setSelectedFormula(formulaId);
    if (formulaId) {
      const selectedTarif = formulas.find(f => f.id === formulaId);
      if (selectedTarif) {
        const isEvent = announcement.categorie.nom === 'EVENT';
        const tauxAvance = isEvent ? 100 : (announcement.annonceur?.taux_avance || 50);
        setPaymentDetails({
          montant_total: selectedTarif.prix,
          taux_avance: tauxAvance,
          montant_avance: isEvent ? selectedTarif.prix : Math.round(selectedTarif.prix * (tauxAvance / 100)),
          id: null
        });
      }
    }
  };

  const handleBillingSubmit = async () => {
    try {
      if (!selectedFormula) {
        setError('Veuillez sélectionner une formule');
        return;
      }

      if (!paymentDetails) {
        setError('Une erreur est survenue avec les détails du paiement');
        return;
      }

      setCreatingPayment(true);
      setError('');

      // Créer le paiement au moment du clic sur le bouton
      const response = await api.post<PaymentResponse>('/api/payments/create/', {
        annonce: announcement.id,
        payment_type: paymentType,
        tarif: selectedFormula
      });

      setPaymentDetails(response.data);
      setShowPayment(true);
    } catch (error) {
      console.error('Payment error:', error);
      setError('Une erreur est survenue lors de l\'initialisation du paiement');
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleLoginPress = () => {
    if (!user) {
      setIsExistingUser(true);
      setShowAuthPopup(true);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthPopup(false);
    if (user) {
      const extendedUser = user as unknown as ExtendedUser;
      setBillingInfo(prev => ({
        ...prev,
        firstName: extendedUser.first_name || '',
        lastName: extendedUser.last_name || '',
        email: extendedUser.email || '',
        phone: extendedUser.phone_number || prev.phone || '',
        address: prev.address,
        city: prev.city
      }));
    }
  };

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Payment response:', data);
      
      switch (data.type) {
        case 'SUCCESS':
          // Envoyer la confirmation au backend
          try {
            await api.post('/api/payments/confirm/', {
              transaction_id: data.data.transaction_id,
              payment_id: paymentDetails?.id,
              status: 'SUCCESS'
          });
          navigation.navigate('PaymentSuccess');
          } catch (error) {
            console.error('Error confirming payment:', error);
            setError('Le paiement a réussi mais nous n\'avons pas pu confirmer la transaction');
            setShowPayment(false);
          }
          break;

        case 'ERROR':
          console.error('Payment error:', data.error);
          setError('Une erreur est survenue lors du paiement');
          setShowPayment(false);
          navigation.navigate('AnnouncementDetail', { announcement });
          break;

        case 'CLOSE':
          setShowPayment(false);
          navigation.navigate('AnnouncementDetail', { announcement });
          break;
      }
    } catch (error) {
      console.error('Error handling payment message:', error);
      setError('Une erreur est survenue lors du traitement de la réponse de paiement');
      setShowPayment(false);
      navigation.navigate('AnnouncementDetail', { announcement });
    }
  };

  const renderPaymentDetails = () => {
    if (!paymentDetails) return null;

    const isEvent = announcement.categorie.nom === 'EVENT';

    return (
      <View style={styles.paymentDetails}>
        <Text style={styles.paymentTitle}>Détails du paiement</Text>
        
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Montant total</Text>
          <Text style={styles.paymentAmount}>{paymentDetails.montant_total} FCFA</Text>
        </View>

        {!isEvent && (
          <>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Taux d'avance</Text>
              <Text style={styles.paymentAmount}>{paymentDetails.taux_avance}%</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>À payer maintenant</Text>
              <Text style={styles.paymentAmount}>{paymentDetails.montant_avance} FCFA</Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderBillingForm = () => (
    <ScrollView style={styles.content}>
      <View style={styles.eventDetailsContainer}>
        <Text style={styles.eventTitle}>{announcement?.titre || 'Événement'}</Text>
        <Text style={styles.eventPrice}>
          À partir de {getMinPrice().toLocaleString()} FCFA
        </Text>
        {paymentType === 'ticket' ? (
          <Text style={styles.eventType}>Billet d'événement</Text>
        ) : (
          <Text style={styles.eventType}>Réservation de table</Text>
        )}
      </View>

      <View style={styles.formulasContainer}>
        <Text style={styles.sectionTitle}>
          {paymentType === 'ticket' ? 'Sélectionnez votre billet' : 'Sélectionnez votre table'}
        </Text>
        <View style={styles.formulaGrid}>
          {formulas.map((tarif) => (
            <TouchableOpacity
              key={tarif.id}
              style={[
                styles.formulaCard,
                selectedFormula === tarif.id && styles.formulaCardSelected
              ]}
              onPress={() => handleFormulaSelect(tarif.id)}
            >
              <Text style={styles.formulaName}>{tarif.nom}</Text>
              <Text style={styles.formulaPrice}>{tarif.prix.toLocaleString()} FCFA</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!user && (
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.loginLinkText}>
              Déjà un compte ? Connectez-vous pour récupérer vos informations
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput
          style={[styles.input, user && styles.inputDisabled]}
          value={billingInfo.firstName}
          onChangeText={(text) => setBillingInfo(prev => ({ ...prev, firstName: text }))}
          placeholder="Votre prénom"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          editable={!user}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={[styles.input, user && styles.inputDisabled]}
          value={billingInfo.lastName}
          onChangeText={(text) => setBillingInfo(prev => ({ ...prev, lastName: text }))}
          placeholder="Votre nom"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          editable={!user}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, user && styles.inputDisabled]}
          value={billingInfo.email}
          onChangeText={(text) => setBillingInfo(prev => ({ ...prev, email: text }))}
          placeholder="Votre email"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!user}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={[styles.input, user && styles.inputDisabled]}
          value={billingInfo.phone}
          onChangeText={(text) => setBillingInfo(prev => ({ ...prev, phone: text }))}
          placeholder="Votre numéro de téléphone"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          keyboardType="phone-pad"
          editable={!user}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Adresse</Text>
        <TextInput
          style={[styles.input, user && styles.inputDisabled]}
          value={billingInfo.address}
          onChangeText={(text) => setBillingInfo(prev => ({ ...prev, address: text }))}
          placeholder="Votre adresse"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          editable={!user}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ville</Text>
        <TextInput
          style={[styles.input, user && styles.inputDisabled]}
          value={billingInfo.city}
          onChangeText={(text) => setBillingInfo(prev => ({ ...prev, city: text }))}
          placeholder="Votre ville"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          editable={!user}
        />
      </View>

      {renderPaymentDetails()}

      <TouchableOpacity 
        style={styles.submitButton}
        onPress={handleBillingSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Chargement...' : 'Procéder au paiement'}
          </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.yellow} />
        </TouchableOpacity>
        <Text style={styles.title}>Paiement</Text>
        <View style={styles.placeholder} />
      </View>

      {showPayment ? (
        <WebView
          source={{ html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://cdn.cinetpay.com/seamless/main.js"></script>
              <style>
                body { margin: 0; padding: 0; background: transparent; }
                #payment-container { width: 100%; height: 100%; }
              </style>
            </head>
            <body>
              <div id="payment-container"></div>
              <script>
                // Initialize CinetPay
                CinetPay.setConfig({
                  apikey: '1624598232678e5f63333183.41181912',
                  site_id: '105886168',
                  notify_url: 'https://chillbackend.onrender.com/api/payment/notify/',
                  mode: 'PRODUCTION',
                  close_after_response: false,
                });

                // Générer un transaction_id unique
                const transactionId = 'CN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

                // Start payment
                CinetPay.getCheckout({
                  transaction_id: transactionId,
                  amount: ${paymentDetails?.montant_avance || 0},
                  currency: 'XOF',
                  channels: 'ALL',
                  description: 'Paiement pour ${announcement.titre}',
                  customer_name: "${billingInfo.lastName}",
                  customer_surname: "${billingInfo.firstName}",
                  customer_email: "${billingInfo.email}",
                  customer_phone_number: "${billingInfo.phone}",
                  customer_address: "${billingInfo.address}",
                  customer_city: "${billingInfo.city}",
                  // Ajouter les callbacks
                  onClose: () => {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CLOSE' }));
                  },
                  onError: (error) => {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', error }));
                  },
                  onSuccess: (data) => {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                      type: 'SUCCESS', 
                      data: { ...data, transaction_id: transactionId }
                    }));
                  },
                });
              </script>
            </body>
            </html>
          `}}
          onMessage={handleMessage}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      ) : (
        renderBillingForm()
      )}

      <AuthPopup
        visible={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        onSuccess={handleAuthSuccess}
        email={billingInfo.email}
        billingInfo={billingInfo}
        isExistingUser={isExistingUser}
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerImage: {
    width: 150,
    height: 150,
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
  webview: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  content: {
    padding: 20,
  },
  formTitle: {
    color: colors.yellow,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  sectionTitle: {
    color: colors.yellow,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  formulasContainer: {
    marginBottom: 30,
  },
  formulaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  formulaCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  formulaCardSelected: {
    borderColor: colors.yellow,
    borderWidth:2,
  },
  formulaName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  formulaPrice: {
    color: colors.yellow,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  inputDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  submitButton: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 50,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Bold',
  },
  eventDetailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  eventTitle: {
    color: colors.yellow,
    fontSize: 24,
    fontFamily: 'Inter_18pt-Bold',
    marginBottom: 10,
  },
  eventPrice: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter_18pt-Regular',
    marginBottom: 5,
  },
  eventType: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Regular',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: colors.yellow,
    fontSize: 16,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  paymentDetails: {
    backgroundColor: colors.lightGrey,
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
  },
  paymentTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: 'white',
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  paymentLabel: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: 'white',
  },
  paymentAmount: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.yellow,
  },
}); 