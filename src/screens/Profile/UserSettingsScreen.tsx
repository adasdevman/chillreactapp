import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Image, Platform, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { userService } from '../../services/api';
import { AxiosError } from 'axios';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AlertCard } from '../../components/AlertCard';
import { API_URL } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { fonts } from '../../theme/fonts';
import { api } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileData {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    address: string;
    city: string;
    current_password: string;
    new_password: string;
    confirm_password: string;
    profile_image: string | null;
}

export default function UserSettingsScreen() {
    const navigation = useNavigation();
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
        visible: boolean;
    }>({
        type: 'success',
        message: '',
        visible: false
    });
    const [profileData, setProfileData] = useState<ProfileData>({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        address: '',
        city: '',
        current_password: '',
        new_password: '',
        confirm_password: '',
        profile_image: null
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadProfileData = async () => {
            try {
                const token = await AsyncStorage.getItem('@ChillNow:token');
                if (!token) {
                    throw new Error('Non authentifié');
                }

                const response = await api.get('/api/profile/', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                const userData = response.data;
                console.log('Profile data loaded:', userData);
                
                setProfileData(prev => ({
                    ...prev,
                    first_name: userData.first_name || '',
                    last_name: userData.last_name || '',
                    email: userData.email || '',
                    phone_number: userData.phone_number || '',
                    address: userData.address || '',
                    city: userData.city || '',
                    profile_image: userData.profile_image || null
                }));
            } catch (error) {
                console.error('Error loading profile:', error);
                Alert.alert('Erreur', 'Impossible de charger les informations du profil');
            }
        };

        loadProfileData();
    }, []);

    const showAlert = (type: 'success' | 'error', message: string) => {
        setAlert({
            type,
            message,
            visible: true
        });
        setTimeout(() => {
            setAlert(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

    const handleChange = (field: string, value: string) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('@ChillNow:token');
            if (!token) {
                throw new Error('Non authentifié');
            }

            const updateData = {
                first_name: profileData.first_name || '',
                last_name: profileData.last_name || '',
                phone_number: profileData.phone_number || '',
                address: profileData.address || '',
                city: profileData.city || '',
                email: profileData.email
            };

            console.log('Sending update data:', updateData);

            const response = await api.put('/api/profile/', updateData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log('Update response:', response.data);

            if (response.data) {
                const updatedUser = {
                    ...user,
                    ...updateData,
                    id: user?.id || 0,
                    role: user?.role || 'UTILISATEUR'
                };

                await updateUser(updatedUser);
                
                setProfileData(prev => ({
                    ...prev,
                    ...updateData
                }));

                await AsyncStorage.setItem('@ChillNow:user', JSON.stringify(updatedUser));

                setAlert({
                    type: 'success',
                    message: 'Profil mis à jour avec succès',
                    visible: true
                });

                await new Promise(resolve => setTimeout(resolve, 1500));
                navigation.goBack();
            }
        } catch (err: any) {
            console.error('Error updating profile:', err);
            let errorMessage = 'Une erreur est survenue lors de la mise à jour';
            
            if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message === 'Non authentifié') {
                errorMessage = 'Veuillez vous reconnecter';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setAlert({
                type: 'error',
                message: errorMessage,
                visible: true
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (profileData.new_password !== profileData.confirm_password) {
            showAlert('error', 'Les mots de passe ne correspondent pas');
            return;
        }

        try {
            setUpdating(true);
            await userService.updatePassword({
                current_password: profileData.current_password,
                new_password: profileData.new_password
            });
            showAlert('success', 'Mot de passe mis à jour avec succès');
            setProfileData(prev => ({
                ...prev,
                current_password: '',
                new_password: '',
                confirm_password: ''
            }));
        } catch (error) {
            if (error instanceof AxiosError) {
                showAlert('error', error.response?.data?.error || 'Erreur lors de la mise à jour du mot de passe');
            } else {
                showAlert('error', 'Une erreur est survenue');
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled) {
                const uriParts = result.assets[0].uri.split('.');
                const fileType = uriParts[uriParts.length - 1];

                const formData = new FormData();
                formData.append('profile_image', {
                    uri: Platform.OS === 'ios' ? result.assets[0].uri.replace('file://', '') : result.assets[0].uri,
                    type: `image/${fileType}`,
                    name: `profile_${Date.now()}.${fileType}`
                } as any);

                console.log('Sending image data:', formData);

                setUpdating(true);
                const updatedProfile = await userService.updateProfile(formData, true);
                console.log('Profile updated:', updatedProfile);
                
                const profileImage = updatedProfile.profile_image;
                if (profileImage) {
                    setProfileData(prev => ({
                        ...prev,
                        profile_image: profileImage.startsWith('/media') 
                            ? profileImage.substring(1) 
                            : profileImage
                    }));
                }
                
                showAlert('success', 'Photo de profil mise à jour');
            }
        } catch (error) {
            console.error('Error updating image:', error);
            showAlert('error', 'Erreur lors de la mise à jour de la photo');
        } finally {
            setUpdating(false);
        }
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons 
                        name="arrow-left" 
                        size={24} 
                        color={colors.yellow}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>Paramètres</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.formContainer}>
                {alert.visible && (
                    <AlertCard
                        type={alert.type}
                        message={alert.message}
                        visible={alert.visible}
                        duration={3000}
                        showIcon={true}
                        showCloseButton={true}
                        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
                    />
                )}

                <View style={styles.profileImageContainer}>
                    <View style={styles.imageContainer}>
                        {profileData.profile_image ? (
                            <Image
                                source={{ uri: `${API_URL}${profileData.profile_image}` }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <MaterialIcons name="account-circle" size={100} color={colors.yellow} />
                        )}
                        <TouchableOpacity style={styles.cameraButton} onPress={handleImagePick}>
                            <MaterialIcons name="camera-alt" size={24} color={colors.yellow} />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.title}>Informations personnelles</Text>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Prénom</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.first_name}
                            onChangeText={(text) => handleChange('first_name', text)}
                            placeholder="Votre prénom"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.last_name}
                            onChangeText={(text) => handleChange('last_name', text)}
                            placeholder="Votre nom"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.inputDisabled]}
                            value={profileData.email}
                            editable={false}
                            placeholder="Votre email"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Téléphone</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.phone_number}
                            onChangeText={(text) => handleChange('phone_number', text)}
                            placeholder="Votre numéro de téléphone"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Adresse</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.address}
                            onChangeText={(text) => handleChange('address', text)}
                            placeholder="Votre adresse"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ville</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.city}
                            onChangeText={(text) => handleChange('city', text)}
                            placeholder="Votre ville"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        />
                    </View>

                    <TouchableOpacity 
                        style={[
                            styles.saveButton,
                            loading && styles.saveButtonDisabled
                        ]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.saveButtonText}>
                                Enregistrer les modifications
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={[styles.title, { marginTop: 30 }]}>Changer le mot de passe</Text>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mot de passe actuel</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.current_password}
                            onChangeText={(text) => handleChange('current_password', text)}
                            placeholder="Votre mot de passe actuel"
                            placeholderTextColor="#666"
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nouveau mot de passe</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.new_password}
                            onChangeText={(text) => handleChange('new_password', text)}
                            placeholder="Votre nouveau mot de passe"
                            placeholderTextColor="#666"
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirmer le mot de passe</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.confirm_password}
                            onChangeText={(text) => handleChange('confirm_password', text)}
                            placeholder="Confirmez votre nouveau mot de passe"
                            placeholderTextColor="#666"
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleUpdatePassword}
                        disabled={updating}
                    >
                        <Text style={styles.buttonText}>
                            {updating ? 'Mise à jour...' : 'Changer le mot de passe'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.darkGrey,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        flex: 1,
        color: colors.yellow,
        fontSize: 20,
        fontFamily: fonts.bold,
        textAlign: 'center',
    },
    placeholder: {
        width: 40,
    },
    formContainer: {
        padding: 0,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: 'white',
        fontSize: 16,
        fontFamily: fonts.medium,
        marginBottom: 5,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        padding: 15,
        color: 'white',
        fontSize: 16,
        fontFamily: fonts.regular,
    },
    inputDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    saveButton: {
        backgroundColor: 'black',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 0,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: fonts.bold,
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    cameraButton: {
        position: 'absolute',
        bottom: -10,
        right: -10,
        backgroundColor: colors.darkGrey,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.yellow,
    },
    form: {
        padding: 20,
        borderRadius: 10,
        marginBottom: 25,
    },
    button: {
        backgroundColor: '#000000',
        height: 50,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter_18pt-Bold',
    },
    errorText: {
        color: '#ff4444',
        marginTop: 10,
        textAlign: 'center',
        fontFamily: 'Inter_18pt-Bold',
    },
    alertContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        padding: 15,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1000,
    },
    alertSuccess: {
        backgroundColor: colors.yellow,
    },
    alertError: {
        backgroundColor: '#ff4444',
    },
    alertIcon: {
        marginRight: 10,
    },
    alertText: {
        color: colors.darkGrey,
        fontSize: 16,
        fontFamily: fonts.medium,
        flex: 1,
    },
}); 