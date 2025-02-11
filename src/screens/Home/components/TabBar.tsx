import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TabNavigationProp } from '../../../types';
import { authService } from '../../../services/api';

export function TabBar() {
  const navigation = useNavigation<TabNavigationProp>();
  const route = useRoute();

  const handleProfilePress = async () => {
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      navigation.navigate('Auth');
      return;
    }
    navigation.navigate('Profile');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => navigation.navigate('Home')}
        >
          <MaterialCommunityIcons 
            name="television" 
            size={24} 
            color={route.name === 'Home' ? colors.yellow : 'white'}
          />
          <Text style={route.name === 'Home' ? styles.activeText : styles.text}>Accueil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => navigation.navigate('Search')}
        >
          <MaterialCommunityIcons 
            name="magnify" 
            size={24} 
            color={route.name === 'Search' ? colors.yellow : 'white'}
          />
          <Text style={route.name === 'Search' ? styles.activeText : styles.text}>Rechercher</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => navigation.navigate('Ticket')}
        >
          <MaterialCommunityIcons 
            name="ticket-outline" 
            size={24} 
            color={route.name === 'Ticket' ? colors.yellow : 'white'}
          />
          <Text style={route.name === 'Ticket' ? styles.activeText : styles.text}>E-ticket</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tab}
          onPress={handleProfilePress}
        >
          <MaterialCommunityIcons 
            name="account" 
            size={24} 
            color={route.name === 'Profile' ? colors.yellow : 'white'}
          />
          <Text style={route.name === 'Profile' ? styles.activeText : styles.text}>Compte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0.8, 0.85)',
  },
  content: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 45,
    justifyContent: 'space-between',
  },
  tab: {
    alignItems: 'center',
    gap: 4,
  },
  text: {
    color: 'white',
    fontSize: 11,
  },
  activeText: {
    color: colors.yellow,
    fontSize: 11,
  },
}); 