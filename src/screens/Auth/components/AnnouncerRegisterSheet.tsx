import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { colors } from '../../../theme/colors';
import { fonts } from '../../../theme/fonts';
import { authService } from '../../../services/authService';

interface AnnouncerRegisterSheetProps {
  visible: boolean;
  onClose: () => void;
  onLoginPress: () => void;
  onSheetStateChange: (expanded: boolean) => void;
}

export const AnnouncerRegisterSheet = ({ 
  visible, 
  onClose, 
  onLoginPress,
  onSheetStateChange 
}: AnnouncerRegisterSheetProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError('');
      await authService.register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: 'announcer' // Définir le rôle comme annonceur
      });
    } catch (err) {
      setError('Une erreur est survenue lors de l\'inscription');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      snapPoints={['85%']}
      index={0}
      backgroundStyle={{ backgroundColor: colors.darkGrey }}
      onChange={(index) => onSheetStateChange(index === 1)}
      onClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Inscription Annonceur</Text>
        
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Prénom"
          placeholderTextColor={colors.lightGrey}
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          style={styles.input}
          placeholder="Nom"
          placeholderTextColor={colors.lightGrey}
          value={lastName}
          onChangeText={setLastName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.lightGrey}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={colors.lightGrey}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.darkGrey} />
          ) : (
            <Text style={styles.buttonText}>S'inscrire</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onLoginPress}>
          <Text style={styles.loginLink}>J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.grey,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    color: colors.white,
    fontFamily: fonts.regular,
  },
  button: {
    backgroundColor: colors.yellow,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: colors.darkGrey,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  error: {
    color: colors.red,
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  loginLink: {
    color: colors.yellow,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: fonts.regular,
  },
}); 