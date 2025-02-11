import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme/colors';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: {
    text: string;
    onPress: () => void;
    style?: 'cancel' | 'default';
  }[];
  onDismiss: () => void;
}

export default function CustomAlert({ visible, title, message, buttons, onDismiss }: CustomAlertProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'cancel' ? styles.cancelButton : styles.defaultButton,
                  index > 0 && styles.buttonMargin
                ]}
                onPress={() => {
                  button.onPress();
                  onDismiss();
                }}
              >
                <Text style={[
                  styles.buttonText,
                  button.style === 'cancel' ? styles.cancelButtonText : styles.defaultButtonText
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.8,
    backgroundColor: colors.darkGrey,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: colors.yellow,
    fontSize: 20,
    fontFamily: 'Inter_18pt-Bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_18pt-Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonMargin: {
    marginLeft: 10,
  },
  defaultButton: {
    backgroundColor: colors.yellow,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter_18pt-Bold',
  },
  defaultButtonText: {
    color: colors.darkGrey,
  },
  cancelButtonText: {
    color: 'white',
  },
}); 