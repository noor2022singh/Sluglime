import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/server';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(0);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error loading stored auth:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (userData, authToken) => {
        try {
            setUser(userData);
            setToken(authToken);
            await AsyncStorage.setItem('token', authToken);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
            console.error('Error storing auth data:', error);
        }
    };

    const logout = async () => {
        try {
            setUser(null);
            setToken(null);
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
    };

    const refreshUserData = async () => {
        if (!token || !user?._id) return;

        const now = Date.now();
        if (now - lastRefresh < 5000) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/${user._id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                setLastRefresh(now);
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    };

    const updateUser = (updatedUserData) => {
        setUser(updatedUserData);
        AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        refreshUserData,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 