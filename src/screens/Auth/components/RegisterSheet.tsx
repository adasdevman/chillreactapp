import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { authService } from '../../../services/api';
import { useNavigation } from '@react-navigation/native';
import { AuthScreenNavigationProp } from '../../../types';
import { AxiosError } from 'axios';
import { fonts } from '../../../theme/fonts';
import { CommonActions } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';

interface RegisterSheetProps {
  visible: boolean;
  onClose: () => void;
  onLoginPress: () => void;
  onAnnouncerPress: () => void;
  onSheetStateChange: (expanded: boolean) => void;
  isAnnouncer?: boolean;
}

interface FormData {
  email: string;
  password: string;
  phone: string;
  first_name: string;
  last_name: string;
  company_name?: string;
}

const validateForm = (data: FormData): string | null => {
  if (!data.email || !data.password || !data.phone || !data.first_name || !data.last_name) {
    return 'Veuillez remplir tous les champs';
  }

  if (data.isAnnouncer && !data.company_name) {
    return 'Veuillez entrer le nom de votre entreprise';
  }

  if (!data.email.includes('@')) {
    return 'Veuillez entrer une adresse email valide';
  }

  if (data.password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères';
  }

  return null;
};

export default function RegisterSheet({ visible, onClose, onLoginPress, onAnnouncerPress, onSheetStateChange, isAnnouncer }: RegisterSheetProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    phone: '',
    first_name: '',
    last_name: '',
    company_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const { signIn } = useAuth();

  const snapPoints = useMemo(() => ['10%', '75%'], []);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLoginPress = useCallback(() => {
    onClose();
    onLoginPress();
  }, [onClose, onLoginPress]);

  const handleSheetChanges = useCallback((index: number) => {
    const expanded = index === 1;
    setIsExpanded(expanded);
    onSheetStateChange(expanded);
  }, [onSheetStateChange]);

  const handlePress = useCallback(() => {
    if (isExpanded) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.snapToIndex(1);
    }
  }, [isExpanded]);

  const handleSubmit = async () => {
    try {
      const validationError = validateForm(formData);
      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);
      setError('');
      
      console.log('Submitting registration data:', formData);
      
      const registerData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone,
        role: isAnnouncer ? 'ANNONCEUR' : 'UTILISATEUR'
      };

      const response = await authService.register(registerData);
      console.log('Registration successful:', response);

      if (response.access && response.user) {
        await signIn(response.access, response.user);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          })
        );
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Une erreur inattendue est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 1 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.form}>
          <Text style={styles.title}>
            {isAnnouncer ? 'Inscription Annonceur' : 'Inscription'}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              value={formData.last_name}
              onChangeText={(value) => handleChange('last_name', value)}
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Prénoms</Text>
            <TextInput
              style={styles.input}
              value={formData.first_name}
              onChangeText={(value) => handleChange('first_name', value)}
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          {isAnnouncer && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom de l'entreprise</Text>
              <TextInput
                style={styles.input}
                value={formData.company_name}
                onChangeText={(value) => handleChange('company_name', value)}
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Adresse Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleChange('phone', value)}
              keyboardType="phone-pad"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                secureTextEntry={!showPassword}
                placeholderTextColor="rgba(255,255,255,0.5)"
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
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Inscription...' : isAnnouncer ? 'S\'inscrire comme annonceur' : 'S\'inscrire'}
            </Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={handleLoginPress}>
              <Text style={styles.link}>J'ai déjà un compte</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAnnouncerPress}>
              <Text style={styles.link}>
                {isAnnouncer ? "S'inscrire comme utilisateur" : "Devenir annonceur"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: 'rgba(51, 51, 51, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  handleIndicator: {
    backgroundColor: 'white',
    width: 65,
    height: 4,
    borderRadius: 0,
    marginTop: 15,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    color: colors.yellow,
    fontSize: 24,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 0,
  },
  form: {
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.medium,
    marginBottom: 8,
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
  button: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  loginText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  touchable: {
    flex: 1,
    width: '100%',
  },
  handleArea: {
    height: 0,
    width: '100%',
  },
  emptySpace: {
    flex: 1,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  linkContainer: {
    marginTop: 20,
    gap: 10,
  },
  link: {
    color: 'white',
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
}); 