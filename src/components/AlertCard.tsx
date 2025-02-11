import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

interface AlertCardProps {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    visible: boolean;
    duration?: number;
    onClose?: () => void;
    showIcon?: boolean;
    showCloseButton?: boolean;
}

export const AlertCard = ({ 
    type = 'info', 
    message, 
    visible, 
    duration = 3000,
    onClose,
    showIcon = true,
    showCloseButton = false
}: AlertCardProps) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 40,
                    friction: 7,
                    useNativeDriver: true,
                })
            ]).start();

            if (duration > 0) {
                const timer = setTimeout(() => {
                    handleClose();
                }, duration);
                return () => clearTimeout(timer);
            }
        }
    }, [visible]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(() => {
            onClose?.();
        });
    };

    if (!visible) return null;

    const getIconName = () => {
        switch (type) {
            case 'success':
                return 'check-circle';
            case 'error':
                return 'error';
            case 'warning':
                return 'warning';
            case 'info':
                return 'info';
            default:
                return 'info';
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return colors.yellow;
            case 'error':
                return '#FF3B30';
            case 'warning':
                return '#FF9500';
            case 'info':
                return '#007AFF';
            default:
                return colors.yellow;
        }
    };

    const getTextColor = () => {
        switch (type) {
            case 'success':
                return colors.darkGrey;
            default:
                return '#FFFFFF';
        }
    };

    return (
        <Animated.View 
            style={[
                styles.container, 
                { 
                    backgroundColor: getBackgroundColor(),
                    opacity: fadeAnim,
                    transform: [{ translateY }]
                }
            ]}
        >
            {showIcon && (
                <MaterialIcons 
                    name={getIconName()} 
                    size={24} 
                    color={getTextColor()} 
                    style={styles.icon}
                />
            )}
            <Text style={[styles.message, { color: getTextColor() }]}>
                {message}
            </Text>
            {showCloseButton && (
                <TouchableOpacity 
                    onPress={handleClose} 
                    style={styles.closeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons 
                        name="close" 
                        size={20} 
                        color={getTextColor()} 
                    />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 20,
        left: width * 0.05,
        right: width * 0.05,
        width: width * 0.9,
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    icon: {
        marginRight: 12,
    },
    message: {
        fontSize: 16,
        fontFamily: fonts.medium,
        flex: 1,
        lineHeight: 20,
    },
    closeButton: {
        marginLeft: 12,
        padding: 4,
    }
}); 