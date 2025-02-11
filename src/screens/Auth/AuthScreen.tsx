import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import LoginSheet from './components/LoginSheet';
import RegisterSheet from './components/RegisterSheet';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

export default function AuthScreen() {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const [activeSheet, setActiveSheet] = useState<'login' | 'register' | 'announcer'>('login');
  const [loginSheetExpanded, setLoginSheetExpanded] = useState(false);
  const [isAnySheetExpanded, setIsAnySheetExpanded] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsAnySheetExpanded(true);
      fadeIn();
    });
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleSheetClose = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
    setActiveSheet('login');
    setLoginSheetExpanded(false);
  };

  const handleSheetStateChange = (expanded: boolean) => {
    Animated.spring(scale, {
      toValue: expanded ? 1.2 : 1,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();

    if (expanded !== isAnySheetExpanded) {
      if (expanded) {
        fadeOut();
      } else {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsAnySheetExpanded(false);
          fadeIn();
        });
      }
    }
    
    setIsAnySheetExpanded(expanded);
  };

  const handleRegisterPress = () => {
    setActiveSheet('login');
    setTimeout(() => {
      setActiveSheet('register');
    }, 300);
  };

  const handleLoginPress = () => {
    setLoginSheetExpanded(true);
    setActiveSheet('login');
    setTimeout(() => {
      setActiveSheet('login');
    }, 300);
  };

  const handleChillsPress = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../../assets/images/03.png')}
        style={[styles.backgroundImage, { transform: [{ scale }] }]}
      />
      
      <Animated.View 
        style={[
          styles.mainContent,
          isAnySheetExpanded ? styles.mainContentExpanded : styles.mainContentCollapsed,
          { opacity: fadeAnim }
        ]}
      >
        {isAnySheetExpanded ? (
          <>
            <Text style={styles.mainTitle}>BIENVENUE</Text>
            <Text style={styles.mainText}>commencez votre</Text>
            <Text style={styles.mainText}>inscription</Text>
          </>
        ) : (
          <>
            <Text style={styles.mainTitle}>Inscrivez</Text>
            <Text style={styles.mainText}>vous pour chiller</Text>
            <Text style={styles.mainText}>aux meilleurs endroits</Text>
          </>
        )}
      </Animated.View>

      

      {activeSheet === 'login' && (
        <LoginSheet 
          visible={true}
          onClose={handleSheetClose}
          onRegisterPress={() => setActiveSheet('register')}
          onAnnouncerRegisterPress={() => setActiveSheet('announcer')}
          initiallyExpanded={loginSheetExpanded}
          onSheetStateChange={handleSheetStateChange}
        />
      )}

      {activeSheet === 'register' && (
        <RegisterSheet 
          visible={true}
          onClose={handleSheetClose}
          onLoginPress={() => setActiveSheet('login')}
          onAnnouncerPress={() => setActiveSheet('announcer')}
          onSheetStateChange={handleSheetStateChange}
        />
      )}

      {activeSheet === 'announcer' && (
        <RegisterSheet 
          visible={true}
          onClose={handleSheetClose}
          onLoginPress={() => setActiveSheet('login')}
          onAnnouncerPress={() => setActiveSheet('register')}
          onSheetStateChange={handleSheetStateChange}
          isAnnouncer={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkGrey,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  mainContent: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  mainContentExpanded: {
    top: 50,
  },
  mainContentCollapsed: {
    bottom: 100,
  },
  mainTitle: {
    color: colors.yellow,
    fontSize: 35,
    fontFamily: 'Inter_18pt-Bold',
  },
  mainText: {
    color: 'white',
    fontSize: 30,
  }
}); 