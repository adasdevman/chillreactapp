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
import type { Announcement } from '../../types';

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PaymentScreenProps {
  announcement: Announcement;
  paymentType: 'ticket' | 'reservation';
}

interface BillingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

interface PaymentResponse {
  id: string;
  montant_total: number;
  montant_avance: number;
  taux_avance: number;
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

  const handleBillingSubmit = async () => {
    if (!selectedFormula) {
      Alert.alert(
        'Sélection requise',
        paymentType === 'ticket' 
          ? 'Veuillez sélectionner un type de billet'
          : 'Veuillez sélectionner une table',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Vérifier si tous les champs du formulaire sont remplis
    const requiredFields = {
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      address: 'Adresse',
      city: 'Ville'
    };

    const emptyFields = Object.entries(requiredFields).filter(
      ([key]) => !billingInfo[key as keyof typeof billingInfo]?.trim()
    );

    if (emptyFields.length > 0) {
      Alert.alert(
        'Champs requis',
        `Veuillez remplir les champs suivants : \n${emptyFields.map(([_, label]) => `- ${label}`).join('\n')}`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (!user) {
      try {
        const response = await api.post('api/auth/check-email/', {
          email: billingInfo.email
        });
        setIsExistingUser(response.data.exists);
        setShowAuthPopup(true);
      } catch (error) {
        Alert.alert('Erreur', 'Une erreur est survenue');
      }
      return;
    }

    try {
      setCreatingPayment(true);
      setError('');

      const response = await api.post('/api/payment/create/', {
        annonce: announcement.id,
        payment_type: paymentType,
        tarif: selectedFormula
      });

      setPaymentDetails(response.data);
      setPaymentId(response.data.id);
      
      // Injecter le script de paiement avec le montant d'avance
      const injectPaymentData = `
        initPayment({
          paymentId: '${response.data.id}',
          amount: ${response.data.montant_avance}, // Utiliser le montant d'avance
          description: '${announcement?.titre || 'Paiement'} - Avance de ${response.data.taux_avance}%',
          customerName: '${billingInfo.firstName}',
          customerSurname: '${billingInfo.lastName}',
          customerEmail: '${billingInfo.email}',
          customerPhone: '${billingInfo.phone}',
          customerAddress: '${billingInfo.address}',
          customerCity: '${billingInfo.city}'
        });
      `;

      setShowPayment(true);
    } catch (error) {
      console.error('Payment creation error:', error);
      setError('Une erreur est survenue lors de la création du paiement');
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
      setBillingInfo(prev => ({
        ...prev,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone_number || prev.phone || '',
        address: prev.address,
        city: prev.city
      }));
    }
  };

  const handleMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'payment_success':
          await api.patch(`api/payments/${paymentId}/update/`, {
            status: 'completed',
            transaction_data: message.data
          });
          navigation.navigate('PaymentSuccess');
          break;

        case 'payment_failed':
          Alert.alert(
            'Erreur',
            'Le paiement a échoué. Veuillez réessayer.'
          );
          break;

        case 'payment_closed':
          if (message.data.status !== "ACCEPTED") {
            navigation.goBack();
          }
          break;
      }
    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors du traitement du paiement.'
      );
    }
  };

  const renderBillingForm = () => (
    <ScrollView style={styles.formContainer}>
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
              onPress={() => setSelectedFormula(tarif.id)}
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

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Résumé du paiement</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Montant total:</Text>
          <Text style={styles.summaryValue}>
            {paymentDetails ? paymentDetails.montant_total.toLocaleString() : (selectedFormula ? formulas.find(t => t.id === selectedFormula)?.prix.toLocaleString() : 'N/A')} FCFA
          </Text>
        </View>
        {paymentDetails && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taux d'avance:</Text>
              <Text style={styles.summaryValue}>{paymentDetails.taux_avance}%</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Montant à payer maintenant:</Text>
              <Text style={styles.summaryValue}>{paymentDetails.montant_avance.toLocaleString()} FCFA</Text>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, creatingPayment && styles.submitButtonDisabled]}
        onPress={handleBillingSubmit}
        disabled={creatingPayment}
      >
        {creatingPayment ? (
          <ActivityIndicator color={colors.darkGrey} />
        ) : (
          <Text style={styles.submitButtonText}>Procéder au paiement</Text>
        )}
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

      {!showPayment ? renderBillingForm() : (
        <WebView
          source={{ html: PAYMENT_HTML }}
          injectedJavaScript={injectPaymentData}
          onMessage={handleMessage}
          style={styles.webview}
        />
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
  formContainer: {
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
  summaryContainer: {
    backgroundColor: colors.lightGrey,
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: 'white',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: 'white',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.yellow,
  },
}); 