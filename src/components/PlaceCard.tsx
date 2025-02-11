import React from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList, Announcement } from '../types';
import { MEDIA_URL } from '../config';

interface PlaceCardProps {
  announcement: Announcement;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ announcement }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handlePress = () => {
    navigation.navigate('AnnouncementDetail', { announcement });
  };

  const getImageSource = () => {
    if (announcement.photos && announcement.photos.length > 0) {
      const imageUrl = announcement.photos[0].image;
      // Vérifier si l'URL est absolue ou relative
      const fullUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : `${MEDIA_URL}${imageUrl}`;
      return { uri: fullUrl };
    }
    return require('../../assets/images/place1.png');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Image
        source={getImageSource()}
        style={styles.image}
      />
      <View style={styles.contentContainer}>
        <View style={styles.leftContent}>
          <Text style={styles.title} numberOfLines={1}>
            {announcement.titre}
          </Text>
          <Text style={styles.separator}>|</Text>
          <Text style={styles.subCategory}>{announcement.sous_categorie_nom}</Text>
        </View>
        <View style={styles.tagExcursion}>
          <Text style={styles.tagExcursionText}>{announcement.categorie_nom}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: colors.darkGrey,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  separator: {
    color: colors.yellow,
    fontSize: 18,
    marginHorizontal: 10,
  },
  subCategory: {
    color: colors.yellow,
    fontSize: 15,
  },
  tagExcursion: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 15,
  },
  tagExcursionText: {
    color: colors.darkGrey,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default PlaceCard; 