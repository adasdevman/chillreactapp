import React, { useState } from 'react';
import { View, Modal, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface AuthPopupProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  email: string;
  billingInfo?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  isExistingUser: boolean;
}

export default function AuthPopup({ 
  visible, 
  onClose, 
  onSuccess, 
  email, 
  billingInfo,
  isExistingUser 
}: AuthPopupProps) {
  const { signIn } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isExistingUser) {
        const { token, user } = await authService.login(email, password);
        await signIn(token, user);
      } else {
        const { token, user } = await authService.register({
          email,
          password,
          first_name: billingInfo?.firstName || '',
          last_name: billingInfo?.lastName || '',
          phone_number: billingInfo?.phone || '',
          role: 'UTILISATEUR'
        });
        await signIn(token, user);
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur auth:', error);
      setError(isExistingUser 
        ? 'Mot de passe incorrect' 
        : 'Une erreur est survenue lors de l\'inscription'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <>
      <Text style={styles.title}>Connexion</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={email || ''}
        onChangeText={() => {}}  // Email en lecture seule si fourni
        editable={!email}
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
    </>
  );

  const renderEmailVerificationForm = () => (
    <>
      <Text style={styles.title}>{isExistingUser ? 'Se connecter' : 'Créer un compte'}</Text>
      <Text style={styles.email}>{email}</Text>
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {isExistingUser ? renderLoginForm() : renderEmailVerificationForm()}

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity 
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isExistingUser ? 'Se connecter' : 'Créer un compte'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.darkGrey,
    width: '80%',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.yellow,
  },
  title: {
    color: colors.yellow,
    fontSize: 20,
    fontFamily: 'Inter_18pt-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  email: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Regular',
    textAlign: 'center',
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.yellow,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Bold',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter_18pt-Regular',
    textAlign: 'center',
  },
  error: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
}); 