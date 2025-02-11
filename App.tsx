/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { colors } from './src/theme/colors';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts } from 'expo-font';
import { AuthProvider } from './src/contexts/AuthContext';

export default function App(): JSX.Element {
  const [fontsLoaded] = useFonts({
    'Inter_18pt-Bold': require('./assets/fonts/Inter_18pt-Bold.ttf'),
    'Inter_18pt-Regular': require('./assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter_18pt-Medium': require('./assets/fonts/Inter_18pt-Medium.ttf'),
    'Inter_18pt-Light': require('./assets/fonts/Inter_18pt-Light.ttf'),
    'Inter_18pt-ExtraLight': require('./assets/fonts/Inter_18pt-ExtraLight.ttf'),
    'Inter_18pt-Thin': require('./assets/fonts/Inter_18pt-Thin.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.darkGrey }}>
        <ActivityIndicator size="large" color={colors.yellow} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
