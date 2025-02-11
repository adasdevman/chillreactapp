import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { announcementService } from '../../services/api';

interface FormData {
  titre: string;
  description: string;
  localisation: string;
  categorie: string;
  sous_categorie: string;
  date_evenement?: string;
  horaires?: string;
  images: string[];
}

export default function CreateAnnouncementScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<FormData>({
    titre: '',
    description: '',
    localisation: '',
    categorie: '',
    sous_categorie: '',
    images: []
  });
  const [loading, setLoading] = useState(false);

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
      
      // Ajouter les images
      formData.images.forEach((image, index) => {
        formDataToSend.append('images', {
          uri: image,
          type: 'image/jpeg',
          name: `image${index}.jpg`
        } as any);
      });

      await announcementService.createAnnouncement(formDataToSend);
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
              placeholder="Adresse de l'événement"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
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
                <Image
                  key={index}
                  source={{ uri }}
                  style={styles.imagePreview}
                />
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
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
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