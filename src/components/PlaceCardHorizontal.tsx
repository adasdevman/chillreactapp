import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../config';

interface PlaceCardHorizontalProps {
  title: string;
  category: string;
  subCategory: string;
  imageUrl: string;
  onPress: () => void;
}

export const PlaceCardHorizontal: React.FC<PlaceCardHorizontalProps> = ({
  title,
  category,
  subCategory,
  imageUrl,
  onPress,
}) => {
  const getImageUrl = (url: string) => {
    if (!url) {
      console.log('No image URL provided');
      return null;
    }

    if (url.startsWith('http')) {
      console.log('Using full URL:', url);
      return url;
    }

    const finalUrl = `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    console.log('Constructed URL:', finalUrl);
    return finalUrl;
  };

  const renderImage = () => {
    const finalImageUrl = getImageUrl(imageUrl);
    console.log('Final image URL:', finalImageUrl);
    
    if (!finalImageUrl) {
      return (
        <View style={[styles.image, styles.placeholderContainer]}>
          <MaterialCommunityIcons name="image-off" size={30} color={colors.yellow} />
        </View>
      );
    }

    return (
      <Image 
        source={{ uri: finalImageUrl }}
        style={styles.image}
        resizeMode="cover"
        onError={(error) => {
          console.log('Error loading image:', finalImageUrl, error);
        }}
      />
    );
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      {renderImage()}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.categories}>
          <Text style={styles.category}>{category}</Text>
          <Text style={styles.subCategory}>{subCategory}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
    height: 80,
  },
  image: {
    width: 80,
    height: '100%',
  },
  placeholderContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontSize: 16,
    color: 'white',
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  categories: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: colors.yellow,
    marginRight: 8,
    fontFamily: fonts.medium,
  },
  subCategory: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: fonts.regular,
  },
}); 