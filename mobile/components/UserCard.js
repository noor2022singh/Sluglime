import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';

export default function UserCard({ user, onPress }) {
    const theme = Colors.dark;
    return (
        <TouchableOpacity style={[styles.container, { backgroundColor: theme.card, borderColor: theme.divider }]} onPress={onPress}>
            <View style={styles.avatarContainer}>
                {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, { backgroundColor: theme.divider }]}>
                        <Text style={styles.avatarText}>{user.name?.[0] || user.username?.[0] || 'U'}</Text>
                    </View>
                )}
            </View>

            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.text }]}>{user.name || user.username || 'Unknown User'}</Text>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.divider,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.dark.divider,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        color: Colors.dark.text,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
}); 