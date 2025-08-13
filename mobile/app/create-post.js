import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../store/authContext";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Colors } from "../constants/Colors";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Modal } from "react-native";
import { TouchableOpacity } from "react-native";
import { API_BASE_URL } from "../config/server";

export default function CreatePostScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isRepost = !!params.repostOf;
  const isCommunityPost = !!params.community;
  const [originalContent] = useState(params.originalContent || "");
  const [originalAuthor] = useState(params.originalAuthor || "");
  const [originalImage] = useState(params.originalImage || null);
  const [originalProofImages] = useState(params.originalProofImages || []);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(
    isRepost ? `Re: ${originalContent}` : ""
  );
  const [category, setCategory] = useState("news");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showHashtagModal, setShowHashtagModal] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [availableHashtags, setAvailableHashtags] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  
  useEffect(() => {
    if (isCommunityPost && params.community) {
      fetch(`${API_BASE_URL}/communities/${params.community}/categories`)
        .then((res) => res.json())
        .then((data) => {
          setCategoryOptions(data.map((cat) => cat.name));
          if (data.length > 0) setCategory(data[0].name);
        })
        .catch(() => setCategoryOptions([]));
    } else {
      setCategoryOptions(["news", "culture"]);
    }

    fetch(`${API_BASE_URL}/posts/hashtags`)
      .then((res) => res.json())
      .then((data) => {
        setAvailableHashtags(data.hashtags || []);
      })
      .catch(() => setAvailableHashtags([]));
  }, [isCommunityPost, params.community]);

  const pickImage = async () => {
    if (isRepost) {
      Alert.alert("Info", "Reposts automatically include the original post's images.");
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: false,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Please add your comment/content.");
      return;
    }
    if (!title.trim() && !isRepost) {
      Alert.alert("Error", "Please add a title.");
      return;
    }
    setLoading(true);
    try {
      let formData = new FormData();
      const finalTitle = isRepost && !title ? `Repost: ${originalContent.substring(0, 50)}${originalContent.length > 50 ? '...' : ''}` : title;
      formData.append("title", finalTitle);
      formData.append("content", content);
      formData.append("category", category);
      formData.append("author", user._id.toString());
              if (isRepost) {
          formData.append("repostOf", params.repostOf);
          if (originalImage) {
            const imageUrl = typeof originalImage === 'string' ? originalImage : originalImage.url;
            if (imageUrl) {
              formData.append("originalImageUrl", imageUrl);
              if (originalImage.publicId) {
                formData.append("originalImagePublicId", originalImage.publicId);
              }
            }
          }
          if (originalProofImages && originalProofImages.length > 0) {
            const proofUrls = originalProofImages.map(img => {
              if (typeof img === 'string') return img;
              return img.url || img;
            }).filter(Boolean);
            if (proofUrls.length > 0) {
              formData.append("originalProofImageUrls", JSON.stringify(proofUrls));
            }
          }
        }
      if (isCommunityPost) {
        formData.append("community", params.community);
        formData.append("visibility", "community");
      }
      if (selectedHashtags.length > 0) {
        formData.append("selectedHashtags", selectedHashtags.join(','));
      }
      if (image && !isRepost) {
        formData.append("image", {
          uri: image.uri,
          name: "photo.jpg",
          type: image.mimeType || "image/jpeg",
        });
      }

      const res = await fetch(`${API_BASE_URL}/posts`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create post");
      Alert.alert("Success", "Post created!");

      if (isCommunityPost) {
        router.replace(`/community/${params.community}`);
      } else {
        router.replace("/");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: Colors.dark.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: Colors.dark.divider }]}
        >
          <Text style={[styles.backText, { color: Colors.dark.text }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: Colors.dark.text }]}>
          {isRepost ? "Repost" : isCommunityPost ? "Create Community Post" : "Create Post"}
        </Text>

        <TouchableOpacity
          style={[
            styles.postButton,
            {
              backgroundColor: content.trim()
                ? Colors.dark.tint
                : Colors.dark.divider,
            },
          ]}
          onPress={handleSubmit}
          disabled={!content.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustContentInsets={false}
      >
        <TextInput
          style={[
            styles.titleInput,
            {
              backgroundColor: Colors.dark.card,
              color: Colors.dark.text,
              borderColor: Colors.dark.divider,
            },
          ]}
          placeholder={isRepost ? "Add your repost title (optional)" : "Title (optional)"}
          placeholderTextColor={Colors.dark.textSecondary}
          value={title}
          onChangeText={setTitle}
          multiline
        />

        <TextInput
          style={[
            styles.contentInput,
            {
              backgroundColor: Colors.dark.card,
              color: Colors.dark.text,
              borderColor: Colors.dark.divider,
            },
          ]}
          placeholder={isRepost ? "Add your repost comment..." : "What's happening?"}
          placeholderTextColor={Colors.dark.textSecondary}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {isRepost && (
          <View
            style={[
              styles.repostInfo,
              { backgroundColor: Colors.dark.divider },
            ]}
          >
            <Text style={[styles.repostLabel, { color: Colors.dark.tint }]}>
              Reposting from {originalAuthor}
            </Text>
            <Text
              style={[
                styles.repostContent,
                { color: Colors.dark.textSecondary },
              ]}
            >
              {originalContent}
            </Text>
            
            {originalImage && (originalImage.url || typeof originalImage === 'string') && (
              <View style={styles.originalImageContainer}>
                <Text style={[styles.originalImageLabel, { color: Colors.dark.textSecondary }]}>
                  Original image (will be included):
                </Text>
                <Image 
                  source={{ uri: typeof originalImage === 'string' ? originalImage : originalImage.url }} 
                  style={styles.originalImage} 
                />
              </View>
            )}
            
            {originalProofImages && originalProofImages.length > 0 && (
              <View style={styles.originalProofContainer}>
                <Text style={[styles.originalImageLabel, { color: Colors.dark.textSecondary }]}>
                  Original proof images (will be included):
                </Text>
                <View style={styles.originalProofImages}>
                  {originalProofImages.map((img, idx) => (
                    <Image 
                      key={idx} 
                      source={{ uri: typeof img === 'string' ? img : (img.url || img) }} 
                      style={styles.originalProofImage} 
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {image && !isRepost && (
          <View
            style={[
              styles.imageContainer,
              {
                backgroundColor: Colors.dark.card,
                borderColor: Colors.dark.divider,
              },
            ]}
          >
            <Image source={{ uri: image.uri }} style={styles.selectedImage} />
            <TouchableOpacity
              style={[
                styles.removeImageButton,
                { backgroundColor: Colors.dark.tint },
              ]}
              onPress={() => setImage(null)}
            >
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: Colors.dark.card,
              borderColor: Colors.dark.divider,
            },
          ]}
          onPress={pickImage}
        >
          <MaterialIcons name="image" size={24} color={Colors.dark.icon} />
          <Text style={[styles.actionText, { color: Colors.dark.text }]}>
            {isRepost ? "Original Images" : "Add Image"}
          </Text>
        </TouchableOpacity>

        {!isRepost && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: Colors.dark.card,
                borderColor: Colors.dark.divider,
              },
            ]}
            onPress={() => setShowCategoryModal(true)}
          >
            <MaterialIcons name="category" size={24} color={Colors.dark.icon} />
            <Text style={[styles.actionText, { color: Colors.dark.text }]}>
              {category || "Select Category"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: Colors.dark.card,
              borderColor: Colors.dark.divider,
            },
          ]}
          onPress={() => setShowHashtagModal(true)}
        >
          <MaterialIcons name="tag" size={24} color={Colors.dark.icon} />
          <Text style={[styles.actionText, { color: Colors.dark.text }]}>
            {selectedHashtags.length > 0 ? `${selectedHashtags.length} tags` : "Add Hashtags"}
          </Text>
        </TouchableOpacity>
      </View>

      {!isRepost && (
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          transparent={true}
        >
          <View
            style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          >
            <View
              style={[styles.modalContent, { backgroundColor: Colors.dark.card }]}
            >
              <Text style={[styles.modalTitle, { color: Colors.dark.text }]}>
                Select Category
              </Text>

              {categoryOptions.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor:
                        category === cat
                          ? Colors.dark.tint
                          : Colors.dark.background,
                      borderColor: Colors.dark.divider,
                    },
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: category === cat ? "#fff" : Colors.dark.text },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { backgroundColor: Colors.dark.divider },
                ]}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text
                  style={[styles.cancelButtonText, { color: Colors.dark.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <Modal
        visible={showHashtagModal}
        animationType="slide"
        transparent={true}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[styles.modalContent, { backgroundColor: Colors.dark.card }]}
          >
            <Text style={[styles.modalTitle, { color: Colors.dark.text }]}>
              Select Hashtags
            </Text>

            {availableHashtags.length === 0 ? (
              <Text style={[styles.noHashtagsText, { color: Colors.dark.textSecondary }]}>
                No hashtags available. Contact admin to add hashtags.
              </Text>
            ) : (
              <ScrollView style={styles.hashtagList} showsVerticalScrollIndicator={false}>
                {availableHashtags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.hashtagOption,
                      {
                        backgroundColor: selectedHashtags.includes(tag)
                          ? Colors.dark.tint
                          : Colors.dark.background,
                        borderColor: Colors.dark.divider,
                      },
                    ]}
                    onPress={() => {
                      if (selectedHashtags.includes(tag)) {
                        setSelectedHashtags(selectedHashtags.filter(t => t !== tag));
                      } else {
                        setSelectedHashtags([...selectedHashtags, tag]);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.hashtagText,
                        { color: selectedHashtags.includes(tag) ? "#fff" : Colors.dark.text },
                      ]}
                    >
                      #{tag}
                    </Text>
                    {selectedHashtags.includes(tag) && (
                      <MaterialIcons name="check" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: Colors.dark.divider },
              ]}
              onPress={() => setShowHashtagModal(false)}
            >
              <Text
                style={[styles.cancelButtonText, { color: Colors.dark.text }]}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.text,
  },
  postButton: {
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
  titleInput: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 18,
    color: Colors.dark.text,
    minHeight: 60,
    borderWidth: 1,
    borderColor: Colors.dark.divider,
  },
  contentInput: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: Colors.dark.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.dark.divider,
  },
  repostInfo: {
    backgroundColor: Colors.dark.divider,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  repostLabel: {
    fontSize: 14,
    color: Colors.dark.tint,
    marginBottom: 4,
  },
  repostContent: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 12,
  },
  originalImageContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: Colors.dark.background,
    borderRadius: 6,
  },
  originalImageLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  originalImage: {
    width: 100,
    height: 100,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  originalProofContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: Colors.dark.background,
    borderRadius: 6,
  },
  originalProofImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  originalProofImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    resizeMode: 'cover',
  },
  imageContainer: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    position: "relative",
    borderWidth: 1,
    borderColor: Colors.dark.divider,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    resizeMode: "cover",
  },
  removeImageButton: {
    backgroundColor: Colors.dark.tint,
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: Colors.dark.card,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.divider,
    paddingBottom: 20,
  },
  actionButton: {
    backgroundColor: Colors.dark.card,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.dark.divider,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.dark.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 20,
    textAlign: "center",
  },
  categoryOption: {
    backgroundColor: Colors.dark.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.divider,
  },
  selectedCategory: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  categoryText: {
    fontSize: 16,
    color: Colors.dark.text,
    textAlign: "center",
  },
  selectedCategoryText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: Colors.dark.divider,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  noHashtagsText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  hashtagList: {
    maxHeight: 300,
    marginVertical: 10,
  },
  hashtagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  hashtagText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
