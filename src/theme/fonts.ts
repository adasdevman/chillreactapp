import * as Font from 'expo-font';

export const loadFonts = async () => {
  await Font.loadAsync({
    'Inter_18pt-Bold': require('../../assets/fonts/Inter_18pt-Bold.ttf'),
    'Inter_18pt-Regular': require('../../assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter_18pt-Medium': require('../../assets/fonts/Inter_18pt-Medium.ttf'),
    'Inter_18pt-Light': require('../../assets/fonts/Inter_18pt-Light.ttf'),
    'Inter_18pt-ExtraLight': require('../../assets/fonts/Inter_18pt-ExtraLight.ttf'),
    'Inter_18pt-Thin': require('../../assets/fonts/Inter_18pt-Thin.ttf'),
  });
};

export const fonts = {
  bold: 'Inter_18pt-Bold',
  regular: 'Inter_18pt-Regular',
  medium: 'Inter_18pt-Medium',
  light: 'Inter_18pt-Light',
  extraLight: 'Inter_18pt-ExtraLight',
  thin: 'Inter_18pt-Thin',
}; 