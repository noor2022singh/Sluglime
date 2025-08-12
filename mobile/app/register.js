import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, Image, Dimensions, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../store/authContext';
import { Colors } from '../constants/Colors';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { API_BASE_URL } from '../config/server';
import * as ImagePicker from "expo-image-picker";

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatar, setAvatar] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const { login: authLogin, loading: authLoading } = useAuth();

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedImage(result.assets[0]);
                setAvatar(result.assets[0].uri);
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const handleRegister = async () => {
        if (!username || !name || !email || !password) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
            
            if (selectedImage) {
                formData.append('avatar', {
                    uri: selectedImage.uri,
                    type: 'image/jpeg',
                    name: 'avatar.jpg'
                });
            }

            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');

            Alert.alert(
                'Registration Successful!',
                'Please check your email to verify your account before logging in.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/login')
                    }
                ]
            );
        } catch (err) {
            Alert.alert('Registration Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <View style={[styles.container, { backgroundColor: '#000000' }]}>
                <ActivityIndicator size="large" color={Colors.dark.tint} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../assets/images/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.appName}>SlugLime</Text>
                        <Text style={styles.tagline}>Join the community</Text>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join SlugLime today</Text>

                        <View style={styles.inputContainer}>
                            <MaterialIcons name="person" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                placeholderTextColor={Colors.dark.textSecondary}
                                autoCapitalize="none"
                                value={username}
                                onChangeText={setUsername}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialIcons name="badge" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor={Colors.dark.textSecondary}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialIcons name="email" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor={Colors.dark.textSecondary}
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialIcons name="lock" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={Colors.dark.textSecondary}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                style={styles.passwordToggle}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <MaterialIcons
                                    name={showPassword ? "visibility" : "visibility-off"}
                                    size={20}
                                    color={Colors.dark.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialIcons name="lock" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                placeholderTextColor={Colors.dark.textSecondary}
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <TouchableOpacity
                                style={styles.passwordToggle}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <MaterialIcons
                                    name={showConfirmPassword ? "visibility" : "visibility-off"}
                                    size={20}
                                    color={Colors.dark.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialIcons name="image" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                            <TouchableOpacity
                                style={styles.imagePickerButton}
                                onPress={pickImage}
                            >
                                {selectedImage ? (
                                    <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                                ) : (
                                    <View style={styles.imagePickerPlaceholder}>
                                        <MaterialIcons name="add-a-photo" size={24} color={Colors.dark.textSecondary} />
                                        <Text style={[styles.imagePickerText, { color: Colors.dark.textSecondary }]}>
                                            {avatar ? "Change Avatar" : "Select Avatar (optional)"}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.registerButton, { backgroundColor: loading ? Colors.dark.divider : Colors.dark.tint }]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.registerButtonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <Link href="/login" asChild>
                            <TouchableOpacity style={styles.loginButton}>
                                <Text style={styles.loginButtonText}>Already have an account? Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 500,
        padding: 20,
        backgroundColor: Colors.dark.card,
        borderRadius: 15,
        shadowColor: Colors.dark.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.dark.tint,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 20,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 5,
    },
    tagline: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
    },
    formSection: {
        width: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        marginBottom: 25,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Colors.dark.inputBorder,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.dark.text,
        paddingVertical: 12,
    },
    passwordToggle: {
        padding: 8,
    },
    registerButton: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 25,
        width: '100%',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.dark.divider,
    },
    dividerText: {
        marginHorizontal: 10,
        color: Colors.dark.textSecondary,
        fontSize: 16,
    },
    loginButton: {
        alignItems: 'center',
        marginTop: 15,
    },
    loginButtonText: {
        color: Colors.dark.tint,
        fontSize: 16,
        fontWeight: 'bold',
    },
    imagePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
        backgroundColor: Colors.dark.inputBackground,
        borderWidth: 1,
        borderColor: Colors.dark.inputBorder,
    },
    imagePickerPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    imagePickerText: {
        marginTop: 5,
        fontSize: 14,
    },
    selectedImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
}); 