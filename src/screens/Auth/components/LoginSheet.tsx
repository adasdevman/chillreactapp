import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { authService } from '../../../services/authService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { AxiosError } from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { User } from '../../../types';
import { fonts } from '../../../theme/fonts';
import { CommonActions } from '@react-navigation/native';

type LoginSheetNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface LoginSheetProps {
  visible: boolean;
  onClose: () => void;
  onRegisterPress: () => void;
  onAnnouncerRegisterPress: () => void;
  initiallyExpanded: boolean;
  onSheetStateChange: (expanded: boolean) => void;
}

export default function LoginSheet({ visible, onClose, onRegisterPress, onAnnouncerRegisterPress, initiallyExpanded, onSheetStateChange }: LoginSheetProps) {
  const navigation = useNavigation<LoginSheetNavigationProp>();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const snapPoints = useMemo(() => ['10%', '60%'], []);
  const initialIndex = initiallyExpanded ? 1 : 0;

  const handleSheetChanges = useCallback((index: number) => {
    const expanded = index === 1;
    setIsExpanded(expanded);
    onSheetStateChange(expanded);
    if (index === 0) {
      setIsExpanded(false);
    }
  }, [onSheetStateChange]);

  const handleRegisterPress = useCallback(() => {
    onClose();
    onRegisterPress();
  }, [onClose, onRegisterPress]);

  const handlePress = useCallback(() => {
    if (isExpanded) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.snapToIndex(1);
    }
  }, [isExpanded]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.email || !formData.password) {
        setError('Veuillez remplir tous les champs');
        return;
      }

      setLoading(true);
      setError('');

      const response = await authService.login(formData.email, formData.password);
      console.log('Login response:', response);

      if (!response || !response.access || !response.user) {
        throw new Error('Réponse invalide du serveur');
      }

      const completeUser: User = {
        id: response.user.id,
        email: response.user.email,
        first_name: response.user.first_name || '',
        last_name: response.user.last_name || '',
        role: response.user.role || 'UTILISATEUR',
        profile_image: response.user.profile_image
      };

      await signIn(response.access, completeUser);
      
      navigation.navigate('Home');

    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.error || 'Email ou mot de passe incorrect';
        setError(errorMessage);
      } else {
        setError('Une erreur inattendue est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    navigation.navigate('Home');
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={initialIndex}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={false}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      style={styles.bottomSheet}
    >
      <TouchableOpacity 
        activeOpacity={1}
        onPress={handlePress}
        style={styles.touchable}
      >
        <View style={styles.handleArea} />
        <BottomSheetView style={styles.container}>
          {isExpanded ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Adresse Email</Text>
                <TextInput
                  style={styles.input}
               
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={formData.email}
                  onChangeText={(value) => handleChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={formData.password}
                    onChangeText={(value) => handleChange('password', value)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={24}
                      color={colors.yellow}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.guestButton}
                onPress={handleGuestLogin}
              >
                <Text style={styles.guestButtonText}>Se connecter en tant qu'invité</Text>
              </TouchableOpacity>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.registerContainer}>
                <TouchableOpacity onPress={handleRegisterPress}>
                  <Text style={styles.registerLink}>Pas encore de compte ?</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptySpace} />
          )}
        </BottomSheetView>
      </TouchableOpacity>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sheetBackground: {
    backgroundColor: 'rgba(51, 51, 51, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 8,
  },
  handleIndicator: {
    backgroundColor: 'white',
    width: 65,
    height: 4,
    borderRadius: 0,
    marginTop: 15,
  },
  touchable: {
    flex: 1,
    width: '100%',
  },
  handleArea: {
    height: 0,
    width: '100%',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    color: colors.yellow,
    fontSize: 24,
    fontFamily: fonts.bold,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: fonts.regular,
  },
  inputContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  input: {
    backgroundColor: '#ffffff20',
    borderRadius: 10,
    padding: 10,
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  submitButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  guestButtonText: {
    color: colors.yellow,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  registerContainer: {
    marginTop: 20,
    gap: 10,
  },
  registerLink: {
    color: 'white',
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  emptySpace: {
    flex: 1,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
    fontFamily: fonts.regular,
  },
}); 