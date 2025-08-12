import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../store/authContext';
import { Colors } from '../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';

export default function SettingsScreen() {
    const { user, logout, refreshUserData } = useAuth();
    const router = useRouter();
    const theme = Colors.dark;

    useEffect(() => {
        refreshUserData();
    }, []); 

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: logout }
            ]
        );
    };

    const settingsOptions = [
        { label: 'Account', icon: '👤', route: '/account' },
        { label: 'Display', icon: '🎨', route: '/display' },
        { label: 'Notifications', icon: '🔔', route: '/notifications' },
        { label: 'Payments', icon: '💳', route: '/payments' },
        { label: 'Manage Interests', icon: '⭐', route: '/interests' },
        { label: 'Privacy & Safety', icon: '🔒', route: '/privacy' },
        { label: 'Feedback', icon: '💬', route: '/feedback' },
        { label: 'Support', icon: '🆘', route: '/support' },
        { label: 'Creator Stats', icon: '📊', route: '/creator-stats' },
    ];

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: 32 }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backArrow, { color: theme.text }]}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
            </View>

            <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.divider }]}>
                <View style={styles.profileInfo}>
                    <View style={[styles.avatar, { backgroundColor: theme.divider }]}>
                        <Text style={[styles.avatarText, { color: theme.text }]}>{user?.name?.[0] || 'U'}</Text>
                    </View>
                    <View style={styles.profileDetails}>
                        <Text style={[styles.name, { color: theme.text }]}>{user?.name}</Text>
                        <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={{ width: '100%' }}
                    onPress={() => router.push('/profile')}
                >
                    <GradientBackground style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </GradientBackground>
                </TouchableOpacity>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.divider }]}>
                {settingsOptions.map((opt, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.optionRow, { borderBottomColor: theme.divider }]}
                        onPress={() => router.push(opt.route)}
                    >
                        <Text style={[styles.optionIcon, { color: theme.icon }]}>{opt.icon}</Text>
                        <Text style={[styles.optionLabel, { color: theme.text }]}>{opt.label}</Text>
                        <Text style={[styles.rightArrow, { color: theme.icon }]}>{'>'}</Text>
                    </TouchableOpacity>
                ))}

                {user?.email === 'garsh5444@gmail.com' && (
                    <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/admin-dashboard')}>
                        <Text style={styles.optionIcon}>🛡️</Text>
                        <Text style={styles.optionLabel}>Admin</Text>
                        <Text style={styles.rightArrow}>{'>'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                style={[styles.signOutRow, { backgroundColor: theme.card, borderColor: theme.divider }]}
                onPress={handleSignOut}
            >
                <MaterialIcons name="logout" size={22} color={theme.error} style={styles.signOutIcon} />
                <Text style={[styles.signOutLabel, { color: theme.error }]}>Sign Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 18,
        marginLeft: 8,
        marginBottom: 2,
    },
    backButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: {
        fontSize: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginLeft: 20,
        marginBottom: 18,
    },
    profileCard: {
        flexDirection: 'column',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 18,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 12,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    profileDetails: {
        marginLeft: 16,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    email: {
        fontSize: 15,
    },
    editButton: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    editButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statsCard: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: 16,
        marginBottom: 18,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
    },
    sectionCard: {
        marginHorizontal: 16,
        marginBottom: 18,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    optionIcon: {
        fontSize: 22,
        marginRight: 16,
    },
    optionLabel: {
        fontSize: 16,
        flex: 1,
    },
    rightArrow: {
        fontSize: 24,
        marginLeft: 8,
    },
    signOutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 12,
        marginHorizontal: 16,
    },
    signOutIcon: {
        marginRight: 16,
    },
    signOutLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    version: {
        color: '#aaa',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 16,
    },
    link: {
        color: '#4a90e2',
        fontSize: 14,
        textAlign: 'center',
        textDecorationLine: 'underline',
        marginTop: 4,
    },
}); 