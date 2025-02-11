import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { colors } from '../theme/colors';
import { api } from '../services/api';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Formula = {
  id: number;
  name: string;
  price: number;
};

type RouteParams = {
  annonceId: number;
  annonceImage: string;
  annonceTitle: string;
};

type RootStackParamList = {
  BillingInfo: {
    annonceId: number;
    formulaId: number;
    amount: number;
    annonceTitle: string;
    annonceImage: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BillingInfo'>;

export const PaymentScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { annonceId, annonceImage, annonceTitle } = route.params;
  
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFormulas();
  }, []);

  const loadFormulas = async () => {
    try {
      const response = await api.get(`/annonces/${annonceId}/tarifs/`);
      setFormulas(response.data);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des formules');
      setLoading(false);
    }
  };

  const handleContinuePayment = () => {
    if (selectedFormula) {
      navigation.navigate('BillingInfo', {
        annonceId,
        annonceTitle,
        annonceImage,
        formulaId: selectedFormula.id,
        amount: selectedFormula.price
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.yellow} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: annonceImage }} 
            style={styles.image}
            resizeMode="cover"
          />
          <Text style={styles.title}>{annonceTitle}</Text>
        </View>

        <View style={styles.formulasContainer}>
          <Text style={styles.sectionTitle}>Sélectionnez votre formule</Text>
          {formulas.map((formula) => (
            <TouchableOpacity
              key={formula.id}
              style={[
                styles.formulaCard,
                selectedFormula?.id === formula.id && styles.selectedFormula
              ]}
              onPress={() => setSelectedFormula(formula)}
            >
              <Text style={styles.formulaName}>{formula.name}</Text>
              <Text style={styles.formulaPrice}>{formula.price} €</Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        
        {/* Ajout d'un espace en bas pour le scroll */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Conteneur fixe pour le bouton en bas */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[
            styles.button,
            { opacity: selectedFormula ? 1 : 0.5 }
          ]} 
          onPress={handleContinuePayment}
          disabled={!selectedFormula}
        >
          <Text style={styles.buttonText}>
            Continuer vers le paiement
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkGrey,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.darkGrey,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: colors.yellow,
    fontSize: 20,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  formulasContainer: {
    padding: 15,
  },
  sectionTitle: {
    color: colors.yellow,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  formulaCard: {
    backgroundColor: colors.lightGrey,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedFormula: {
    borderColor: colors.yellow,
    borderWidth: 2,
  },
  formulaName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  formulaPrice: {
    color: colors.yellow,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomContainer: {
    backgroundColor: colors.darkGrey,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
  },
  button: {
    backgroundColor: colors.yellow,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.darkGrey,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
}); 