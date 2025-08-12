import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../store/authContext';
import { Colors } from '../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../config/server';

export default function FeedbackDashboardScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const theme = Colors.dark;

    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    if (user?.email !== 'garsh5444@gmail.com') {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>Feedback Dashboard</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={[styles.errorCard, { backgroundColor: theme.card }]}>
                    <MaterialIcons name="error" size={48} color={theme.error} />
                    <Text style={[styles.errorTitle, { color: theme.text }]}>Access Denied</Text>
                    <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
                        You don't have permission to access the feedback dashboard.
                    </Text>
                </View>
            </View>
        );
    }

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/feedback`);
            if (response.ok) {
                const data = await response.json();
                setFeedbacks(data);
            } else {
                throw new Error('Failed to fetch feedbacks');
            }
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
            Alert.alert('Error', 'Failed to load feedbacks');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFeedback = async (feedbackId) => {
        Alert.alert(
            'Delete Feedback',
            'Are you sure you want to delete this feedback?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`, {
                                method: 'DELETE',
                            });

                            if (response.ok) {
                                setFeedbacks(prev => prev.filter(f => f._id !== feedbackId));
                                Alert.alert('Success', 'Feedback deleted successfully');
                            } else {
                                throw new Error('Failed to delete feedback');
                            }
                        } catch (error) {
                            console.error('Error deleting feedback:', error);
                            Alert.alert('Error', 'Failed to delete feedback');
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAllFeedbacks = async () => {
        Alert.alert(
            'Delete All Feedbacks',
            `Are you sure you want to delete all ${feedbacks.length} feedbacks? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            const response = await fetch(`${API_BASE_URL}/feedback`, {
                                method: 'DELETE',
                            });

                            if (response.ok) {
                                setFeedbacks([]);
                                Alert.alert('Success', 'All feedbacks deleted successfully');
                            } else {
                                throw new Error('Failed to delete all feedbacks');
                            }
                        } catch (error) {
                            console.error('Error deleting all feedbacks:', error);
                            Alert.alert('Error', 'Failed to delete all feedbacks');
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    const renderFeedbackItem = ({ item }) => (
        <View style={[styles.feedbackCard, { backgroundColor: theme.card }]}>
            <View style={styles.feedbackHeader}>
                <View style={styles.userInfo}>
                    <View style={[styles.avatar, { backgroundColor: theme.divider }]}>
                        <Text style={[styles.avatarText, { color: theme.text }]}>
                            {item.username?.[0] || 'U'}
                        </Text>
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={[styles.username, { color: theme.text }]}>
                            {item.username || 'Unknown User'}
                        </Text>
                        <Text style={[styles.email, { color: theme.textSecondary }]}>
                            {item.email}
                        </Text>
                        <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
                            {dayjs(item.timestamp).format('MMM D, YYYY h:mm A')}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteFeedback(item._id)}
                >
                    <MaterialIcons name="delete" size={20} color={theme.error} />
                </TouchableOpacity>
            </View>
            <Text style={[styles.feedbackMessage, { color: theme.text }]}>
                {item.message}
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>Feedback Dashboard</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.tint} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                        Loading feedbacks...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Feedback Dashboard</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                    <MaterialIcons name="feedback" size={24} color={theme.tint} />
                    <Text style={[styles.statNumber, { color: theme.text }]}>{feedbacks.length}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Feedbacks</Text>
                </View>
            </View>

            {feedbacks.length > 0 && (
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.deleteAllButton, { backgroundColor: theme.error }]}
                        onPress={handleDeleteAllFeedbacks}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <MaterialIcons name="delete-sweep" size={20} color="#fff" />
                                <Text style={styles.deleteAllText}>Delete All Feedbacks</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {feedbacks.length === 0 ? (
                <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
                    <MaterialIcons name="feedback" size={48} color={theme.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No Feedbacks Yet</Text>
                    <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
                        When users submit feedback, it will appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={feedbacks}
                    renderItem={renderFeedbackItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.feedbackList}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    statsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    statCard: {
        alignItems: 'center',
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 14,
    },
    actionsContainer: {
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    deleteAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    deleteAllText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    feedbackList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    feedbackCard: {
        marginBottom: 15,
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    userDetails: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    email: {
        fontSize: 14,
        marginBottom: 2,
    },
    timestamp: {
        fontSize: 12,
    },
    deleteButton: {
        padding: 8,
    },
    feedbackMessage: {
        fontSize: 16,
        lineHeight: 24,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 20,
        borderRadius: 15,
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    errorCard: {
        margin: 20,
        borderRadius: 15,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
    },
    errorMessage: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
}); 