import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../store/authContext';
import { Colors } from '../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { API_BASE_URL } from '../config/server';

export default function HashtagManagementScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = Colors.dark;
  
  const [hashtags, setHashtags] = useState([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user?.email !== 'garsh5444@gmail.com') {
      router.back();
      return;
    }
    fetchHashtags();
  }, []);

  const fetchHashtags = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/hashtags`, {
        headers: {
          'user-email': user.email,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHashtags(data.hashtags || []);
      } else {
        Alert.alert('Error', 'Failed to fetch hashtags');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const addHashtag = async () => {
    if (!newHashtag.trim()) {
      Alert.alert('Error', 'Please enter a hashtag');
      return;
    }

    const cleanTag = newHashtag.trim().toLowerCase();
    if (hashtags.includes(cleanTag)) {
      Alert.alert('Error', 'This hashtag already exists');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/hashtags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-email': user.email,
        },
        body: JSON.stringify({ tag: cleanTag }),
      });

      if (response.ok) {
        const data = await response.json();
        setHashtags(data.hashtags);
        setNewHashtag('');
        Alert.alert('Success', 'Hashtag added successfully');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to add hashtag');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setAdding(false);
    }
  };

  const removeHashtag = async (tag) => {
    Alert.alert(
      'Remove Hashtag',
      `Are you sure you want to remove "#${tag}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/admin/hashtags/${encodeURIComponent(tag)}`, {
                method: 'DELETE',
                headers: {
                  'user-email': user.email,
                },
              });

              if (response.ok) {
                const data = await response.json();
                setHashtags(data.hashtags);
                Alert.alert('Success', 'Hashtag removed successfully');
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.error || 'Failed to remove hashtag');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error');
            }
          },
        },
      ]
    );
  };

  if (user?.email !== 'garsh5444@gmail.com') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Hashtag Management</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.errorCard, { backgroundColor: theme.card }]}>
          <MaterialIcons name="error" size={48} color={theme.error} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>Access Denied</Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
            You don't have permission to access this page.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Hashtag Management</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.addSection, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Add New Hashtag</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.background, 
              color: theme.text, 
              borderColor: theme.divider 
            }]}
            placeholder="Enter hashtag (without #)"
            placeholderTextColor={theme.textSecondary}
            value={newHashtag}
            onChangeText={setNewHashtag}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.tint }]}
            onPress={addHashtag}
            disabled={adding || !newHashtag.trim()}
          >
            {adding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.listSection, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Current Hashtags ({hashtags.length})
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.tint} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading hashtags...
            </Text>
          </View>
        ) : hashtags.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="tag" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No hashtags added yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Add hashtags to enable users to tag their posts
            </Text>
          </View>
        ) : (
          <View style={styles.hashtagList}>
            {hashtags.map((tag, index) => (
              <View
                key={index}
                style={[styles.hashtagItem, { borderBottomColor: theme.divider }]}
              >
                <View style={styles.hashtagInfo}>
                  <Text style={[styles.hashtagText, { color: theme.text }]}>
                    #{tag}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: theme.error }]}
                  onPress={() => removeHashtag(tag)}
                >
                  <MaterialIcons name="delete" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
        <MaterialIcons name="info" size={20} color={theme.tint} />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Hashtags help users categorize their posts and connect with others who share similar interests. 
          Only admin-approved hashtags will be available for users to select when creating posts.
        </Text>
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
  addSection: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listSection: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  hashtagList: {
    marginTop: 10,
  },
  hashtagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  hashtagInfo: {
    flex: 1,
  },
  hashtagText: {
    fontSize: 16,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  infoCard: {
    margin: 20,
    marginTop: 10,
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
