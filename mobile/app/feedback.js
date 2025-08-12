import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../store/authContext';
import { Colors } from '../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { API_BASE_URL } from '../config/server';

export default function FeedbackScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const theme = Colors.dark;

    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmitFeedback = async () => {
        if (!message.trim()) {
            Alert.alert('Error', 'Please enter your feedback message.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/feedback/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user._id,
                    message: message.trim()
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert(
                    'Success',
                    'Thank you for your feedback! We appreciate your input.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setMessage('');
                                router.back();
                            }
                        }
                    ]
                );
            } else {
                throw new Error(data.error || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
            Alert.alert('Error', 'Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Feedback</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.feedbackHeader}>
                    <MaterialIcons name="feedback" size={32} color={theme.tint} />
                    <Text style={[styles.feedbackTitle, { color: theme.text }]}>Share Your Feedback</Text>
                    <Text style={[styles.feedbackSubtitle, { color: theme.textSecondary }]}>
                        Help us improve SlugLime by sharing your thoughts, suggestions, or reporting issues.
                    </Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={[styles.label, { color: theme.text }]}>Your Message</Text>
                    <TextInput
                        style={[styles.textInput, {
                            backgroundColor: theme.inputBackground,
                            borderColor: theme.inputBorder,
                            color: theme.text
                        }]}
                        placeholder="Tell us what you think..."
                        placeholderTextColor={theme.textSecondary}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        maxLength={1000}
                    />
                    <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                        {message.length}/1000 characters
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        {
                            backgroundColor: submitting ? theme.divider : theme.tint,
                            opacity: submitting ? 0.7 : 1
                        }
                    ]}
                    onPress={handleSubmitFeedback}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Feedback</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
                <MaterialIcons name="info" size={20} color={theme.tint} />
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                    Your feedback will be reviewed by our team. We typically respond within 24-48 hours.
                </Text>
            </View>

            <View style={[styles.contactCard, { backgroundColor: theme.card }]}>
                <MaterialIcons name="phone" size={20} color={theme.tint} />
                <View style={styles.contactInfo}>
                    <Text style={[styles.contactTitle, { color: theme.text }]}>Need Immediate Help?</Text>
                    <Text style={[styles.contactText, { color: theme.textSecondary }]}>
                        Contact us directly at:
                    </Text>
                    <TouchableOpacity style={styles.phoneButton}>
                        <Text style={[styles.phoneNumber, { color: theme.tint }]}>+91 7087159779</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 34,
    },
    card: {
        margin: 20,
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    feedbackHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    feedbackTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
    },
    feedbackSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    formSection: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        minHeight: 120,
    },
    charCount: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 5,
    },
    submitButton: {
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoCard: {
        margin: 20,
        marginTop: 0,
        borderRadius: 10,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoText: {
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
        lineHeight: 20,
    },
    contactCard: {
        margin: 20,
        marginTop: 0,
        borderRadius: 10,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    contactInfo: {
        marginLeft: 10,
        flex: 1,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    contactText: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    phoneButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(108, 160, 220, 0.1)',
        alignSelf: 'flex-start',
    },
    phoneNumber: {
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 