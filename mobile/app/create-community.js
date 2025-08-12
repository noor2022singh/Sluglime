import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../store/authContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { API_BASE_URL } from "../config/server";
import * as ImagePicker from "expo-image-picker";

export default function CreateCommunityScreen() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "other",
    privacy: "public",
    tags: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const categories = [
    { value: "tech", label: "Technology" },
    { value: "sports", label: "Sports" },
    { value: "politics", label: "Politics" },
    { value: "culture", label: "Culture" },
    { value: "news", label: "News" },
    { value: "other", label: "Other" },
  ];

  const privacyOptions = [
    {
      value: "public",
      label: "Public",
      description: "Anyone can join and see posts",
    },
    {
      value: "private",
      label: "Private",
      description: "Only members can see posts",
    },
  ];

  const pickImage = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "avatar" ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        if (type === "avatar") {
          setAvatar(result.assets[0]);
        } else {
          setBanner(result.assets[0]);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Community name is required");
      return;
    }

    if (formData.name.length < 3) {
      Alert.alert("Error", "Community name must be at least 3 characters long");
      return;
    }

    if (formData.name.length > 50) {
      Alert.alert("Error", "Community name must be less than 50 characters");
      return;
    }

    if (formData.description.length > 500) {
      Alert.alert("Error", "Description must be less than 500 characters");
      return;
    }

    try {
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("category", formData.category);
      formDataToSend.append("privacy", formData.privacy);
      formDataToSend.append("creatorId", user._id);

      if (formData.tags.trim()) {
        const tags = formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
        formDataToSend.append("tags", JSON.stringify(tags));
      }

      if (avatar) {
        formDataToSend.append("avatar", {
          uri: avatar.uri,
          type: "image/jpeg",
          name: "avatar.jpg",
        });
      }

      if (banner) {
        formDataToSend.append("banner", {
          uri: banner.uri,
          type: "image/jpeg",
          name: "banner.jpg",
        });
      }

      const response = await fetch(`${API_BASE_URL}/communities`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert("Success", "Community created successfully!", [
          {
            text: "OK",
            onPress: () => router.push(`/community/${result._id}`),
          },
        ]);
      } else {
        const error = await response.json();
        Alert.alert("Error", error.message || "Failed to create community");
      }
    } catch (error) {
      console.error("Error creating community:", error);
      Alert.alert("Error", "Failed to create community");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Community</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Community Images</Text>

          <View style={styles.imageSection}>
            <TouchableOpacity
              style={styles.imageUpload}
              onPress={() => pickImage("avatar")}
            >
              {avatar ? (
                <Image
                  source={{ uri: avatar.uri }}
                  style={styles.uploadedImage}
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <MaterialIcons name="add-a-photo" size={32} color="#666" />
                  <Text style={styles.uploadText}>Add Avatar</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageUpload}
              onPress={() => pickImage("banner")}
            >
              {banner ? (
                <Image
                  source={{ uri: banner.uri }}
                  style={styles.uploadedBanner}
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <MaterialIcons name="add-a-photo" size={32} color="#666" />
                  <Text style={styles.uploadText}>Add Banner</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Community Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter community name"
              placeholderTextColor="#666"
              maxLength={50}
            />
            <Text style={styles.characterCount}>{formData.name.length}/50</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Describe your community..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {formData.description.length}/500
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryButton,
                  formData.category === category.value &&
                    styles.selectedCategory,
                ]}
                onPress={() =>
                  setFormData({ ...formData, category: category.value })
                }
              >
                <Text
                  style={[
                    styles.categoryText,
                    formData.category === category.value &&
                      styles.selectedCategoryText,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.privacyContainer}>
            {privacyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.privacyOption,
                  formData.privacy === option.value && styles.selectedPrivacy,
                ]}
                onPress={() =>
                  setFormData({ ...formData, privacy: option.value })
                }
              >
                <View style={styles.privacyHeader}>
                  <MaterialIcons
                    name={option.value === "public" ? "public" : "lock"}
                    size={20}
                    color={formData.privacy === option.value ? "#fff" : "#666"}
                  />
                  <Text
                    style={[
                      styles.privacyLabel,
                      formData.privacy === option.value &&
                        styles.selectedPrivacyText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.privacyDescription,
                    formData.privacy === option.value &&
                      styles.selectedPrivacyText,
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Tags (Optional)</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              value={formData.tags}
              onChangeText={(text) => setFormData({ ...formData, tags: text })}
              placeholder="Enter tags separated by commas (e.g., tech, programming, coding)"
              placeholderTextColor="#666"
            />
            <Text style={styles.helperText}>
              Tags help others discover your community
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Community</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    marginTop: 20,
  },
  imageSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  imageUpload: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  uploadedBanner: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  uploadPlaceholder: {
    alignItems: "center",
  },
  uploadText: {
    color: "#666",
    fontSize: 12,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryButton: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedCategory: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  categoryText: {
    color: "#fff",
    fontSize: 14,
  },
  selectedCategoryText: {
    color: "#fff",
  },
  privacyContainer: {
    gap: 12,
  },
  privacyOption: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedPrivacy: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  privacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  privacyLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  selectedPrivacyText: {
    color: "#fff",
  },
  privacyDescription: {
    color: "#666",
    fontSize: 14,
    marginLeft: 28,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#333",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
