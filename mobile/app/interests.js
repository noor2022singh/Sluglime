import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../store/authContext";
import { Colors } from "../constants/Colors";
import { API_BASE_URL } from "../config/server";

let allTopics = [];

export default function InterestsSettings() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [topics, setTopics] = useState([]);
  const theme = Colors.dark;

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;

      setLoading(true);
      try {
        const hashtagsRes = await fetch(`${API_BASE_URL}/posts/hashtags`);
        const hashtagsData = await hashtagsRes.json();
        
        if (hashtagsRes.ok) {
          setTopics(hashtagsData.hashtags || []);
        }

        const userRes = await fetch(`${API_BASE_URL}/users/${user._id}`);
        const userData = await userRes.json();

        if (userRes.ok && userData.interests) {
          setSelected(userData.interests);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        Alert.alert("Error", "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const toggleTopic = (topic) => {
    setSelected((sel) =>
      sel.includes(topic) ? sel.filter((t) => t !== topic) : [...sel, topic]
    );
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      Alert.alert(
        "No Interests Selected",
        "Please select at least one interest to receive relevant notifications."
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save interests");

      const updatedUser = { ...user, interests: selected };
      await updateUser(updatedUser);

      Alert.alert(
        "Success",
        "Your interests have been saved! You will now receive notifications about relevant posts."
      );
      router.back();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to save interests");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6600" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Interests</Text>
      </View>

      <Text style={styles.description}>
        <Text style={{ color: theme.text }}>
          Select hashtags you're interested in to receive notifications about
          relevant posts. Only admin-approved hashtags are available.
        </Text>
      </Text>

      {selected.length > 0 && (
        <View
          style={[
            styles.selectedInterestsContainer,
            { backgroundColor: theme.card },
          ]}
        >
          <Text style={styles.selectedInterestsTitle}>
            Your Selected Interests:
          </Text>
          <View style={styles.selectedInterestsList}>
            {selected.map((interest) => (
              <View key={interest} style={styles.selectedInterestItem}>
                <Text style={styles.selectedInterestText}>#{interest}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => toggleTopic(interest)}
                >
                  <Text
                    style={[styles.removeButtonText, { color: theme.tint }]}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.topicsContainer}>
        <Text style={styles.sectionTitle}>Select Your Interests (Hashtags)</Text>
        <View style={styles.topicsGrid}>
          {topics.length === 0 ? (
            <View style={styles.noTopicsContainer}>
              <Text style={[styles.noTopicsText, { color: theme.textSecondary }]}>
                No hashtags available yet.
              </Text>
              <Text style={[styles.noTopicsSubtext, { color: theme.textSecondary }]}>
                Contact the admin to add hashtags for interests.
              </Text>
            </View>
          ) : (
            topics.map((topic) => (
            <TouchableOpacity
              key={topic}
              style={[
                styles.topicButton,
                {
                  backgroundColor: selected.includes(topic)
                    ? theme.tint
                    : theme.card,
                  borderColor: selected.includes(topic)
                    ? theme.tint
                    : theme.divider,
                },
              ]}
              onPress={() => toggleTopic(topic)}
            >
                              <Text
                  style={[
                    styles.topicText,
                    { color: selected.includes(topic) ? "#fff" : theme.text },
                  ]}
                >
                  #{topic}
                </Text>
                          </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          <Text style={{ color: theme.textSecondary }}>
            {selected.length} interest{selected.length !== 1 ? "s" : ""}{" "}
            selected
          </Text>
        </Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor:
                selected.length === 0 ? theme.divider : theme.tint,
            },
          ]}
          onPress={handleSave}
          disabled={selected.length === 0 || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Interests</Text>
          )}
        </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  backButton: {
    marginRight: 15,
  },
  backArrow: {
    fontSize: 24,
    color: "#ff6600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 30,
  },
  topicsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  topicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  topicButton: {
    backgroundColor: Colors.dark.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
    minWidth: "48%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.divider,
  },
  selectedTopicButton: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  topicText: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: "500",
  },
  selectedTopicText: {
    color: "#fff",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  selectedCount: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: Colors.dark.divider,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  selectedInterestsContainer: {
    backgroundColor: Colors.dark.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  selectedInterestsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  selectedInterestsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedInterestItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  selectedInterestText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  removeButton: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  removeButtonText: {
    fontSize: 18,
    color: "#ff6600",
    fontWeight: "bold",
  },
  noTopicsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  noTopicsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  noTopicsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
