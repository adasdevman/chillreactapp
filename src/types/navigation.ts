import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Profile: undefined;
  UserSettings: undefined;
};

export type NavigationProp = StackNavigationProp<RootStackParamList>; 