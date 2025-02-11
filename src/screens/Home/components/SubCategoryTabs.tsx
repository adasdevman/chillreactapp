import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../../theme/colors';

export function SubCategoryTabs() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.tab, styles.activeTab]}>
        <Text style={[styles.tabText, styles.activeText]}>EXCURSION</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab}>
        <Text style={styles.tabText}>DECOUVERTE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 20,
  },
  tab: {
    paddingBottom: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.yellow,
  },
  tabText: {
    color: 'white',
    fontSize: 14,
  },
  activeText: {
    color: colors.yellow,
  },
}); 