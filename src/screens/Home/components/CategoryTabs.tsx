import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

export function CategoryTabs() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.tab, styles.inactiveTab]}>
        <MaterialCommunityIcons name="music-note" size={18} color="white" />
        <Text style={styles.tabText}>CHILL</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, styles.inactiveTab]}>
        <MaterialCommunityIcons name="ticket" size={18} color="white" />
        <Text style={styles.tabText}>EVENT</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, styles.activeTab]}>
        <MaterialCommunityIcons name="map-marker" size={18} color={colors.yellow} />
        <Text style={[styles.tabText, styles.activeText]}>PLACE TO BE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
  },
  activeTab: {
    backgroundColor: 'black',
    borderColor: colors.yellow,
  },
  inactiveTab: {
    backgroundColor: '#ffffff20',
    borderColor: 'transparent',
  },
  tabText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '400',
  },
  activeText: {
    color: colors.yellow,
  },
}); 