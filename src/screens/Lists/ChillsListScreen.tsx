import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { PlaceCardHorizontal } from '../../components/PlaceCardHorizontal';
import { api } from '../../services/api';
import type { Announcement } from '../../types';

type ChillsListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ChillsListScreen() {
  const navigation = useNavigation<ChillsListScreenNavigationProp>();
  const [chills, setChills] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChills();
  }, []);

  const loadChills = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/annonces/mes-chills/');
      console.log('API Response for mes-chills:', response.data);
      
      // S'assurer que les données contiennent les images et sont valides
      const chillsWithImages = response.data
        .filter((chill: any) => {
          console.log('Validating chill data:', {
            id: chill.id,
            titre: chill.titre,
            categorie: chill.categorie,
            categorie_nom: chill.categorie_nom,
            sous_categorie: chill.sous_categorie,
            sous_categorie_nom: chill.sous_categorie_nom
          });
          
          if (!chill || !chill.id || !chill.titre) {
            console.log('Invalid chill data - missing required fields:', chill);
            return false;
          }
          
          // La catégorie peut être soit un ID soit un objet
          const hasValidCategorie = (
            (typeof chill.categorie === 'number' && chill.categorie_nom) ||
            (typeof chill.categorie === 'object' && chill.categorie?.nom)
          );
          
          if (!hasValidCategorie) {
            console.log('Invalid category data:', { categorie: chill.categorie, categorie_nom: chill.categorie_nom });
            return false;
          }
          
          return true;
        })
        .map((chill: Announcement) => {
          // Construire l'objet catégorie
          const categorieData = typeof chill.categorie === 'object' 
            ? chill.categorie 
            : {
                id: chill.categorie,
                nom: chill.categorie_nom,
                description: ''
              };
          
          // Construire l'objet sous-catégorie
          const sousCategorieData = typeof chill.sous_categorie === 'object'
            ? chill.sous_categorie
            : {
                id: chill.sous_categorie || 0,
                nom: chill.sous_categorie_nom || 'Non catégorisé',
                description: ''
              };
          
          console.log('Processing chill with categories:', {
            id: chill.id,
            titre: chill.titre,
            categorie: categorieData,
            sous_categorie: sousCategorieData
          });
          
          return {
            ...chill,
            photos: chill.photos || [],
            categorie: categorieData,
            sous_categorie: sousCategorieData,
            categorie_nom: categorieData.nom,
            sous_categorie_nom: sousCategorieData.nom
          };
        });
      
      console.log('Final processed chills:', chillsWithImages);
      setChills(chillsWithImages);
    } catch (error) {
      console.error('Error loading chills:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChillCard = (chill: Announcement) => {
    console.log('Rendering chill card with data:', {
      id: chill.id,
      titre: chill.titre,
      categorie: chill.categorie,
      sous_categorie: chill.sous_categorie,
      photos: chill.photos
    });

    const imageUrl = chill.photos?.[0]?.image || '';
    
    // Créer une copie propre de l'annonce avec toutes les propriétés requises
    const cleanAnnouncement: Announcement = {
      id: chill.id,
      titre: chill.titre,
      description: chill.description || '',
      categorie: chill.categorie,
      sous_categorie: chill.sous_categorie,
      photos: chill.photos || [],
      localisation: chill.localisation || '',
      date_evenement: chill.date_evenement,
      est_actif: chill.est_actif || false,
      categorie_nom: chill.categorie.nom,
      sous_categorie_nom: chill.sous_categorie.nom,
      created: chill.created || new Date().toISOString(),
      modified: chill.modified || new Date().toISOString(),
      horaires: chill.horaires || [],
      tarifs: chill.tarifs || []
    };
    
    return (
      <PlaceCardHorizontal
        key={chill.id}
        title={cleanAnnouncement.titre}
        category={cleanAnnouncement.categorie_nom}
        subCategory={cleanAnnouncement.sous_categorie_nom}
        imageUrl={imageUrl}
        onPress={() => {
          navigation.navigate('AnnouncementDetail', { 
            announcement: cleanAnnouncement 
          });
        }}
      />
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
        <Text style={styles.title}>Vos Chills</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.yellow} style={styles.loader} />
        ) : chills.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={50} color={colors.yellow} />
            <Text style={styles.emptyText}>Vous n'avez pas encore de chills</Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.exploreButtonText}>Explorer les chills</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {chills.map(renderChillCard)}
          </View>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  exploreButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.yellow,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: colors.darkGrey,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  cardsContainer: {
    gap: 15,
  },
  loader: {
    marginTop: 50,
  },
}); 