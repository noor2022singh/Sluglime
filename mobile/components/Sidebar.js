import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
import { useAuth } from '../store/authContext';
import { useRouter } from 'expo-router';
import GradientBackground from './GradientBackground';

export default function Sidebar({ visible, onClose }) {
    const { user, refreshUserData } = useAuth();
    const router = useRouter();
    const slideAnim = useRef(new Animated.Value(-280)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -280,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose} />
            <Animated.View 
                style={[
                    styles.drawer,
                    {
                        transform: [{ translateX: slideAnim }]
                    }
                ]}
            >
                <GradientBackground style={styles.drawerGradient}>
                    <View style={styles.profileSection}>
                        {user?.avatar ? (
                            <View style={styles.avatarContainer}>
                                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                            </View>
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <GradientBackground style={styles.avatarGradient}>
                                    <Text style={styles.avatarInitial}>{user?.name?.[0] || user?.username?.[0]}</Text>
                                </GradientBackground>
                            </View>
                        )}
                        <Text style={styles.name}>{user?.name}</Text>
                        <TouchableOpacity onPress={() => { onClose(); router.push('/profile'); }} style={styles.viewProfileBtn}>
                            <Text style={styles.viewProfile}>View Profile</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.menuSection}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); router.push('/settings'); }}>
                            <View style={styles.menuIconContainer}>
                                <Text style={styles.menuIconBox}>⚙️</Text>
                            </View>
                            <Text style={styles.menuText}>Settings</Text>
                        </TouchableOpacity>
                    </View>
                </GradientBackground>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    drawer: {
        position: 'absolute',
        top: 0, 
        left: 0, 
        bottom: 0,
        width: 250,
        zIndex: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 15,
        shadowOffset: { width: 3, height: 0 },
    },
    drawerGradient: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 40,
        paddingVertical: 20,
    },
    avatarContainer: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        borderRadius: 40,
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarPlaceholder: {
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        borderRadius: 40,
    },
    avatarGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 32,
        fontSize: 32,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    name: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    viewProfileBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    viewProfile: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    menuSection: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    menuIconContainer: {
        width: 32,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    menuIconBox: {
        fontSize: 16,
    },
    menuText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
}); 