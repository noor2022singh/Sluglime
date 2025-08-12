import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, Image, Dimensions, Modal } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../store/authContext';
import { Colors } from '../constants/Colors';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { API_BASE_URL } from '../config/server';
import GradientBackground from '../components/GradientBackground';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const router = useRouter();
    const { login: authLogin, loading: authLoading } = useAuth();

    const handleLogin = async () => {
        if (!emailOrUsername || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrUsername, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            await authLogin(data.user, data.token);
            Alert.alert('Success', 'Logged in!');
            router.replace('/');
        } catch (err) {
            Alert.alert('Login Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!forgotEmail.trim()) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }

        setForgotLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: forgotEmail.trim()
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert(
                    'Reset Email Sent!',
                    'Please check your email and click the reset link to change your password.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setShowForgotPassword(false);
                                setForgotEmail('');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Error', data.error || 'Failed to send reset email.');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setForgotLoading(false);
        }
    };

    if (authLoading) {
        return (
            <View style={[styles.container, { backgroundColor: Colors.dark.background }]}>
                <ActivityIndicator size="large" color={Colors.dark.tint} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.dark.background }]}>
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
                    <Text style={styles.tagline}>Share your voice, anonymously</Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>

                    <View style={styles.inputContainer}>
                        <MaterialIcons name="email" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email or Username"
                            placeholderTextColor={Colors.dark.textSecondary}
                            autoCapitalize="none"
                            value={emailOrUsername}
                            onChangeText={setEmailOrUsername}
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

                    <TouchableOpacity
                        style={styles.forgotPasswordLink}
                        onPress={() => setShowForgotPassword(true)}
                    >
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <GradientBackground 
                            style={[styles.loginButtonGradient, { opacity: loading ? 0.5 : 1 }]}
                            colors={loading ? [Colors.dark.divider, Colors.dark.divider] : undefined}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.loginButtonText}>Sign In</Text>
                            )}
                        </GradientBackground>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <Link href="/register" asChild>
                        <TouchableOpacity style={styles.registerButton}>
                            <GradientBackground style={styles.registerButtonGradient}>
                                <Text style={styles.registerButtonText}>Create New Account</Text>
                            </GradientBackground>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>

            <Modal visible={showForgotPassword} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: Colors.dark.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: Colors.dark.text }]}>Reset Password</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowForgotPassword(false);
                                    setForgotEmail('');
                                }}
                                style={styles.closeButton}
                            >
                                <MaterialIcons name="close" size={24} color={Colors.dark.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalSubtitle, { color: Colors.dark.textSecondary }]}>
                            Enter your email address and we'll send you a link to reset your password.
                        </Text>

                        <View style={styles.inputContainer}>
                            <MaterialIcons name="email" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={Colors.dark.textSecondary}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={forgotEmail}
                                onChangeText={setForgotEmail}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={handleForgotPassword}
                            disabled={forgotLoading}
                        >
                            <GradientBackground 
                                style={[styles.resetButtonGradient, { opacity: forgotLoading ? 0.5 : 1 }]}
                                colors={forgotLoading ? [Colors.dark.divider, Colors.dark.divider] : undefined}
                            >
                                {forgotLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.resetButtonText}>Send Reset Link</Text>
                                )}
                            </GradientBackground>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
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
        overflow: 'hidden',
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
        backgroundColor: Colors.dark.card,
        borderRadius: 15,
        padding: 25,
        shadowColor: Colors.dark.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
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
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.dark.text,
        paddingVertical: 10,
    },
    passwordToggle: {
        padding: 5,
    },
    loginButton: {
        borderRadius: 10,
        marginBottom: 15,
        overflow: 'hidden',
    },
    loginButtonGradient: {
        paddingVertical: 15,
        alignItems: 'center',
        borderRadius: 10,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
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
    registerButton: {
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        overflow: 'hidden',
    },
    registerButtonGradient: {
        paddingVertical: 15,
        alignItems: 'center',
        borderRadius: 10,
        width: '100%',
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    forgotPasswordLink: {
        alignSelf: 'flex-end',
        marginBottom: 15,
    },
    forgotPasswordText: {
        color: Colors.dark.tint,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
    modalSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    resetButton: {
        borderRadius: 10,
        width: '100%',
        overflow: 'hidden',
    },
    resetButtonGradient: {
        paddingVertical: 15,
        alignItems: 'center',
        borderRadius: 10,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
}); 