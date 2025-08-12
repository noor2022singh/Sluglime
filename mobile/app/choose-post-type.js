import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function ChoosePostType() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Choose Post Type</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push('/create-post')}
            >
                <Text style={styles.buttonText}>Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, styles.whistleButton]}
                onPress={() => router.push('/whistle-blow')}
            >
                <Text style={styles.buttonText}>Whistle Blowing</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 40,
        color: Colors.light.text,
    },
    button: {
        width: '80%',
        padding: 20,
        borderRadius: 16,
        backgroundColor: Colors.light.tint,
        alignItems: 'center',
        marginBottom: 24,
    },
    whistleButton: {
        backgroundColor: '#ff4444',
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
}); 