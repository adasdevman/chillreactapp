import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, Image, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';

interface FormData {
  titre: string;
  description: string;
  localisation: string;
  categorie: string;
  sous_categorie: string;
  date_evenement?: string;
  est_actif: boolean;
  images: string[];
  horaires: Array<{
    jour: string;
    heure_ouverture: string;
    heure_fermeture: string;
  }>;
  tarifs: Array<{
    nom: string;
    prix: string;
  }>;
}

export default function CreateAnnouncementScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<FormData>({
    titre: '',
    description: '',
    localisation: '',
    categorie: '',
    sous_categorie: '',
    date_evenement: undefined,
    est_actif: true,
    images: [],
    horaires: [],
    tarifs: []
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{id: number, nom: string}>>([]);
  const [sousCategories, setSousCategories] = useState<Array<{id: number, nom: string}>>([]);
  const [isEventCategory, setIsEventCategory] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/api/categories/');
      setCategories(response.data);
      // Trouver la catégorie EVENT
      const eventCategory = response.data.find((cat: any) => cat.nom.toUpperCase() === 'EVENT');
      if (eventCategory) {
        setIsEventCategory(formData.categorie === eventCategory.id.toString());
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSousCategories = async (categorieId: string | number) => {
    try {
      // Get all sous-categories and filter by category
      const response = await api.get('/api/categories/');
      const selectedCategory = response.data.find((cat: any) => cat.id.toString() === categorieId.toString());
      setSousCategories(selectedCategory?.sous_categories || []);
    } catch (error) {
      console.error('Error loading sub-categories:', error);
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri]
      }));
    }
  };

  const addHoraire = () => {
    setFormData(prev => ({
      ...prev,
      horaires: [...prev.horaires, { jour: '', heure_ouverture: '', heure_fermeture: '' }]
    }));
  };

  const updateHoraire = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      horaires: prev.horaires.map((horaire, i) => 
        i === index ? { ...horaire, [field]: value } : horaire
      )
    }));
  };

  const removeHoraire = (index: number) => {
    setFormData(prev => ({
      ...prev,
      horaires: prev.horaires.filter((_, i) => i !== index)
    }));
  };

  const addTarif = () => {
    setFormData(prev => ({
      ...prev,
      tarifs: [...prev.tarifs, { nom: '', prix: '' }]
    }));
  };

  const updateTarif = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      tarifs: prev.tarifs.map((tarif, i) => 
        i === index ? { ...tarif, [field]: value } : tarif
      )
    }));
  };

  const removeTarif = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tarifs: prev.tarifs.filter((_, i) => i !== index)
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        date_evenement: formattedDate
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      
      // Ajouter les champs texte
      formDataToSend.append('titre', formData.titre);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('localisation', formData.localisation);
      formDataToSend.append('categorie', formData.categorie);
      formDataToSend.append('sous_categorie', formData.sous_categorie);
      formDataToSend.append('est_actif', String(formData.est_actif));
      
      if (formData.date_evenement) {
        formDataToSend.append('date_evenement', formData.date_evenement);
      }
      
      // Ajouter les images
      formData.images.forEach((image, index) => {
        formDataToSend.append('images', {
          uri: image,
          type: 'image/jpeg',
          name: `image${index}.jpg`
        } as any);
      });

      // Ajouter les horaires
      formData.horaires.forEach((horaire, index) => {
        formDataToSend.append(`horaires[${index}][jour]`, horaire.jour);
        formDataToSend.append(`horaires[${index}][heure_ouverture]`, horaire.heure_ouverture);
        formDataToSend.append(`horaires[${index}][heure_fermeture]`, horaire.heure_fermeture);
      });

      // Ajouter les tarifs
      formData.tarifs.forEach((tarif, index) => {
        formDataToSend.append(`tarifs[${index}][nom]`, tarif.nom);
        formDataToSend.append(`tarifs[${index}][prix]`, tarif.prix);
      });

      await api.post('/api/annonces/', formDataToSend);
      navigation.goBack();
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={colors.yellow}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Créer une annonce</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Titre</Text>
            <TextInput
              style={styles.input}
              value={formData.titre}
              onChangeText={(text) => setFormData(prev => ({ ...prev, titre: text }))}
              placeholder="Titre de l'annonce"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Description de l'annonce"
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Localisation</Text>
            <TextInput
              style={styles.input}
              value={formData.localisation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, localisation: text }))}
              placeholder="Adresse de l'établissement"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Catégorie</Text>
            <Picker
              selectedValue={formData.categorie}
              onValueChange={(itemValue: string) => {
                setFormData(prev => ({ ...prev, categorie: itemValue, sous_categorie: '' }));
                if (itemValue) {
                  loadSousCategories(itemValue);
                  // Vérifier si c'est la catégorie EVENT
                  const eventCategory = categories.find((cat: any) => cat.nom.toUpperCase() === 'EVENT');
                  setIsEventCategory(eventCategory?.id.toString() === itemValue);
                }
              }}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner une catégorie" value="" />
              {categories.map(cat => (
                <Picker.Item key={cat.id} label={cat.nom} value={cat.id.toString()} />
              ))}
            </Picker>
          </View>

          {isEventCategory && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date de l'événement</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formData.date_evenement 
                    ? new Date(formData.date_evenement).toLocaleDateString('fr-FR')
                    : "Sélectionner une date"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.date_evenement ? new Date(formData.date_evenement) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  themeVariant="dark"
                  textColor="white"
                  accentColor={colors.yellow}
                  style={{ backgroundColor: colors.darkGrey }}
                />
              )}
            </View>
          )}

          {!isEventCategory && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Horaires</Text>
              {formData.horaires.map((horaire, index) => (
                <View key={index} style={styles.horaireContainer}>
                  <Picker
                    selectedValue={horaire.jour}
                    onValueChange={(value: string) => updateHoraire(index, 'jour', value)}
                    style={styles.dayPicker}
                  >
                    <Picker.Item label="Jour" value="" />
                    <Picker.Item label="Lundi" value="Lundi" />
                    <Picker.Item label="Mardi" value="Mardi" />
                    <Picker.Item label="Mercredi" value="Mercredi" />
                    <Picker.Item label="Jeudi" value="Jeudi" />
                    <Picker.Item label="Vendredi" value="Vendredi" />
                    <Picker.Item label="Samedi" value="Samedi" />
                    <Picker.Item label="Dimanche" value="Dimanche" />
                  </Picker>
                  <TextInput
                    style={styles.timeInput}
                    value={horaire.heure_ouverture}
                    onChangeText={(value) => updateHoraire(index, 'heure_ouverture', value)}
                    placeholder="Ouverture"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                  <TextInput
                    style={styles.timeInput}
                    value={horaire.heure_fermeture}
                    onChangeText={(value) => updateHoraire(index, 'heure_fermeture', value)}
                    placeholder="Fermeture"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeHoraire(index)}
                  >
                    <MaterialCommunityIcons name="close" size={24} color={colors.yellow} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={addHoraire}
              >
                <Text style={styles.addButtonText}>Ajouter un horaire</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tarifs</Text>
            {formData.tarifs.map((tarif, index) => (
              <View key={index} style={styles.tarifContainer}>
                <TextInput
                  style={styles.tarifInput}
                  value={tarif.nom}
                  onChangeText={(value) => updateTarif(index, 'nom', value)}
                  placeholder="Nom du tarif"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
                <TextInput
                  style={styles.tarifInput}
                  value={tarif.prix}
                  onChangeText={(value) => updateTarif(index, 'prix', value)}
                  placeholder="Prix"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeTarif(index)}
                >
                  <MaterialCommunityIcons name="close" size={24} color={colors.yellow} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addButton}
              onPress={addTarif}
            >
              <Text style={styles.addButtonText}>Ajouter un tarif</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.imagePickerButton}
            onPress={handleImagePick}
          >
            <MaterialCommunityIcons name="image-plus" size={24} color={colors.yellow} />
            <Text style={styles.imagePickerText}>Ajouter des photos</Text>
          </TouchableOpacity>

          {formData.images.length > 0 && (
            <ScrollView horizontal style={styles.imagePreviewContainer}>
              {formData.images.map((uri, index) => (
                <View key={index} style={styles.imagePreviewWrapper}>
                  <Image
                    source={{ uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setFormData(prev => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index)
                      }));
                    }}
                  >
                    <MaterialCommunityIcons name="close-circle" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Création...' : 'Créer l\'annonce'}
            </Text>
          </TouchableOpacity>
        </View>
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
    flex: 1,
    color: colors.yellow,
    fontSize: 20,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.medium,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  picker: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    height: 50,
    marginTop: 8,
  },
  dateButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 8,
    marginTop: 8,
  },
  dateButtonText: {
    color: 'white',
    fontSize: 16,
  },
  horaireContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayPicker: {
    flex: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    height: 50,
  },
  timeInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    marginHorizontal: 5,
  },
  removeButton: {
    padding: 5,
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: colors.yellow,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  tarifContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tarifInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    marginRight: 5,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  imagePickerText: {
    color: colors.yellow,
    fontSize: 16,
    fontFamily: fonts.medium,
    marginLeft: 8,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: colors.yellow,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.darkGrey,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
}); 