import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { API_BASE_URL } from '../config/server';
import { useAuth } from '../store/authContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const theme = Colors.dark;

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications?userId=${user._id}`);
            const data = await response.json();
            if (response.ok) {
                setNotifications(data);
            } else {
                console.error('Error fetching notifications:', data.error);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const clearAllNotifications = async () => {
        Alert.alert(
            'Clear All Notifications',
            'Are you sure you want to delete all notifications?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_BASE_URL}/notifications/clear-all`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: user._id })
                            });
                            const data = await response.json();
                            if (response.ok) {
                                setNotifications([]);
                                Alert.alert('Success', 'All notifications cleared');
                            } else {
                                Alert.alert('Error', data.error || 'Failed to clear notifications');
                            }
                        } catch (error) {
                            console.error('Error clearing notifications:', error);
                            Alert.alert('Error', 'Failed to clear notifications');
                        }
                    }
                }
            ]
        );
    };

    const markAsRead = async () => {
        try {
            await fetch(`${API_BASE_URL}/notifications/mark-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id })
            });
            setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const handleNotificationPress = (notification) => {
        if (!notification.read) {
            markAsRead();
        }

        if (notification.type === 'community_request' && notification.metadata?.communityId) {
            // Navigate to community and show pending requests
            router.push(`/community/${notification.metadata.communityId}`);
        } else if (notification.postId) {
            router.push(`/posts/${notification.postId}`);
        } else if (notification.fromUser) {
            router.push(`/user/${notification.fromUser._id}`);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like':
                return 'favorite';
            case 'comment':
                return 'comment';
            case 'reply':
                return 'reply';
            case 'follow':
                return 'person-add';
            case 'mention':
                return 'alternate-email';
            case 'community_request':
                return 'group-add';
            case 'community_approved':
                return 'check-circle';
            case 'community_rejected':
                return 'cancel';
            case 'whistle_pending':
                return 'hourglass-empty';
            case 'whistle_review':
                return 'rate-review';
            case 'whistle_approved':
                return 'verified';
            case 'whistle_rejected':
                return 'block';
            case 'interest_match':
                return 'local-offer';
            default:
                return 'notifications';
        }
    };

    const getNotificationColor = (type, read) => {
        if (read) return theme.textSecondary;
        switch (type) {
            case 'like':
                return '#ff4444';
            case 'comment':
            case 'reply':
                return '#4CAF50';
            case 'follow':
                return '#2196F3';
            case 'community_request':
                return '#FF9800';
            case 'community_approved':
                return '#4CAF50';
            case 'community_rejected':
                return '#f44336';
            case 'whistle_pending':
                return '#FFB300';
            case 'whistle_review':
                return '#9E9E9E';
            case 'whistle_approved':
                return '#4CAF50';
            case 'whistle_rejected':
                return '#f44336';
            case 'interest_match':
                return theme.tint;
            default:
                return theme.tint;
        }
    };

    const renderNotification = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                { backgroundColor: item.read ? 'transparent' : theme.card, borderColor: theme.divider }
            ]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={styles.notificationHeader}>
                <MaterialIcons
                    name={getNotificationIcon(item.type)}
                    size={24}
                    color={getNotificationColor(item.type, item.read)}
                />
                {!item.read && (
                    <View style={[styles.unreadDot, { backgroundColor: theme.tint }]} />
                )}
            </View>
            <View style={styles.notificationContent}>
                <Text style={[
                    styles.notificationText,
                    { color: item.read ? theme.textSecondary : theme.text },
                    !item.read && { fontWeight: 'bold' }
                ]}>
                    {item.message}
                </Text>
                <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
                    {dayjs(item.createdAt).fromNow()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    useEffect(() => {
        if (user?._id) {
            fetchNotifications();
        }
    }, [user?._id]);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.divider }]}>
                        <Text style={[styles.backText, { color: theme.text }]}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.divider }]}>
                    <Text style={[styles.backText, { color: theme.text }]}>← Back</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={clearAllNotifications} style={[styles.clearAllButton, { backgroundColor: theme.error }]}>
                        <Text style={[styles.clearAllText, { color: '#fff' }]}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {notifications.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                    <MaterialIcons name="notifications-none" size={64} color={theme.textSecondary} />
                    <Text style={[styles.emptyText, { color: theme.text }]}>No notifications yet</Text>
                    <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                        You'll see notifications here when someone interacts with your content
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id}
                    renderItem={renderNotification}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        fetchNotifications();
                    }}
                    contentContainerStyle={styles.notificationsList}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.divider,
    },
    backButton: {
        backgroundColor: Colors.dark.divider,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    backText: {
        color: Colors.dark.text,
        fontSize: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
        flex: 1,
        textAlign: 'center',
    },
    clearAllButton: {
        backgroundColor: '#ff4444',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    clearAllText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        margin: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    notificationsList: {
        padding: 20,
    },
    notificationCard: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.divider,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    notificationHeader: {
        marginRight: 12,
        position: 'relative',
    },
    unreadDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.dark.tint,
    },
    notificationContent: {
        flex: 1,
    },
    notificationText: {
        fontSize: 16,
        color: Colors.dark.text,
        lineHeight: 22,
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
}); 