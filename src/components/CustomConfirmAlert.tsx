import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

interface CustomConfirmAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const CustomConfirmAlert: React.FC<CustomConfirmAlertProps> = ({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: Dimensions.get('window').width * 0.85,
    backgroundColor: colors.darkGrey,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.yellow,
  },
  title: {
    color: colors.yellow,
    fontSize: 20,
    fontFamily: fonts.bold,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.regular,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    backgroundColor: '#FF4444',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});

export default CustomConfirmAlert; 