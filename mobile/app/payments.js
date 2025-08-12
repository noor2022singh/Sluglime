import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

const mockPayments = [
    { id: '1', date: '2024-06-01', amount: 10, status: 'Paid', desc: 'Monthly Subscription' },
    { id: '2', date: '2024-05-01', amount: 10, status: 'Paid', desc: 'Monthly Subscription' },
];

export default function PaymentsScreen() {
    const router = useRouter();
    const theme = Colors.dark;
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.divider }]}>
                    <Text style={[styles.backText, { color: theme.text }]}>← Back</Text>
                </TouchableOpacity>

                <Text style={[styles.title, { color: theme.text }]}>Payments</Text>
            </View>

            <View style={[styles.content, { backgroundColor: theme.card }]}>
                <Text style={[styles.comingSoonText, { color: theme.text }]}>Coming Soon</Text>
                <Text style={[styles.comingSoonSubtext, { color: theme.textSecondary }]}>Payment options and subscription management will be available here</Text>
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
    sectionTitle: { color: '#aaa', fontSize: 18, marginTop: 24, fontWeight: 'bold' },
    subText: { color: '#fff', fontSize: 16, marginTop: 8 },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, backgroundColor: '#222', borderRadius: 8, padding: 10 },
    paymentDesc: { color: '#fff', flex: 1 },
    paymentDate: { color: '#aaa', width: 90 },
    paymentAmount: { color: '#0a7ea4', width: 60, textAlign: 'right' },
    paymentStatus: { color: '#0f0', width: 60, textAlign: 'right' },
}); 