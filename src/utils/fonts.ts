import * as Font from 'expo-font';

// Pour l'instant, on n'utilise pas de polices personnalisées
export const loadFonts = async () => {
  await Font.loadAsync({
    'Inter_18pt-Bold': require('../../assets/fonts/Inter_18pt-Bold.ttf'),
    'Inter_18pt-Regular': require('../../assets/fonts/Inter_18pt-Regular.ttf'),
  });
}; 