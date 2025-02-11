import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import type { TabNavigationProp } from '../../../types';

interface NotificationIconProps {
  count?: number;
}

export function NotificationIcon({ count }: NotificationIconProps) {
  const navigation = useNavigation<TabNavigationProp>();

  const handlePress = () => {
    navigation.navigate('Notifications');
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.container}>
        <View style={styles.square} />
        {count && count > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 32,
    height: 32,
    position: 'relative',
  },
  square: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: colors.yellow,
    borderRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.yellow,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.darkGrey,
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 