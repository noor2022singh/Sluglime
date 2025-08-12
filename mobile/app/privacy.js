import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

const mockBlocked = [
    { id: '1', name: 'SpamUser1' },
    { id: '2', name: 'TrollGuy' },
];

export default function PrivacyScreen() {
    const router = useRouter();
    const [privateAccount, setPrivateAccount] = useState(false);
    const theme = Colors.dark;
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.divider }]}>
                    <Text style={[styles.backText, { color: theme.text }]}>← Back</Text>
                </TouchableOpacity>

                <Text style={[styles.title, { color: theme.text }]}>Privacy & Safety</Text>
            </View>

            <View style={[styles.content, { backgroundColor: theme.card }]}>
                <Text style={[styles.comingSoonText, { color: theme.text }]}>Coming Soon</Text>
                <Text style={[styles.comingSoonSubtext, { color: theme.textSecondary }]}>Privacy settings and safety controls will be available here</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: Colors.dark.divider,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 16,
    },
    backText: {
        color: Colors.dark.text,
        fontSize: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    content: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    comingSoonText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 12,
    },
    comingSoonSubtext: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
    },
}); 