import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Image,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../store/authContext";
import { Colors } from "../constants/Colors";
import Post from "../components/Post";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { API_BASE_URL } from "../config/server";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");

function responsiveSize(size) {
  return Math.round(size * (width / 375));
}

export default function ProfileScreen() {
  const { user, refreshUserData } = useAuth();
  const router = useRouter();
  const theme = Colors.dark;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersModal, setFollowersModal] = useState(false);
  const [followingModal, setFollowingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    refreshUserData();
    fetchProfileData();
  }, [user?._id]);

  const fetchProfileData = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const profileRes = await fetch(`${API_BASE_URL}/users/${user._id}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      const postsRes = await fetch(`${API_BASE_URL}/posts/user/${user._id}`);
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      } else {
        setPosts([]);
      }

      const followersRes = await fetch(
        `${API_BASE_URL}/users/${user._id}/followers`
      );
      if (followersRes.ok) {
        const followersData = await followersRes.json();
        setFollowers(Array.isArray(followersData) ? followersData : []);
      }

      const followingRes = await fetch(
        `${API_BASE_URL}/users/${user._id}/following`
      );
      if (followingRes.ok) {
        const followingData = await followingRes.json();
        setFollowing(Array.isArray(followingData) ? followingData : []);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openFollowers = async () => {
    if (followers.length > 0) {
      setFollowersModal(true);
    } else {
      Alert.alert("No Followers", "You don't have any followers yet.");
    }
  };

  const openFollowing = async () => {
    if (following.length > 0) {
      setFollowingModal(true);
    } else {
      Alert.alert("No Following", "You're not following anyone yet.");
    }
  };

  const handleReport = () => {
    Alert.alert("Coming Soon", "Report feature will be available soon.");
  };

  const handleRepost = () => {
    Alert.alert("Coming Soon", "Repost feature will be available soon.");
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        
        await uploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadAvatar = async (imageAsset) => {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageAsset.uri,
        type: 'image/jpeg',
        name: 'avatar.jpg'
      });

      const response = await fetch(`${API_BASE_URL}/users/${user._id}/avatar`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.ok) {
        const data = await response.json();
        refreshUserData();
        setSelectedImage(null);
        Alert.alert("Success", "Avatar updated successfully!");
      } else {
        throw new Error('Failed to upload avatar');
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      Alert.alert("Error", "Failed to upload avatar");
      setSelectedImage(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
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
          <Text style={[styles.backArrow, { color: theme.text }]}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
      </View>

      <View
        style={[
          styles.profileSection,
          { backgroundColor: theme.card, borderColor: theme.divider },
        ]}
      >
        <View style={styles.profileInfo}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={[styles.avatar, { backgroundColor: theme.divider }]} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.divider }]}>
                <Text style={[styles.avatarText, { color: theme.text }]}>
                  {user?.name?.[0] || "U"}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditOverlay}>
              <MaterialIcons name="camera-alt" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <View style={styles.profileDetails}>
            <Text style={[styles.name, { color: theme.text }]}>
              {user?.name}
            </Text>
            <Text style={[styles.email, { color: theme.textSecondary }]}>
              {user?.email}
            </Text>
            <Text style={[styles.bio, { color: theme.textSecondary }]}>
              {profile?.bio || "No bio yet"}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.statsSection,
          { backgroundColor: theme.card, borderColor: theme.divider },
        ]}
      >
        <TouchableOpacity style={styles.statItem} onPress={() => { }}>
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {posts.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Posts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statItem} onPress={openFollowers}>
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {followers.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Followers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statItem} onPress={openFollowing}>
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {following.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.postsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Posts</Text>
        {posts.length > 0 ? (
          <FlatList
            data={posts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              return (
                <Post
                  {...item}
                  onReport={handleReport}
                  onRepost={handleRepost}
                />
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Text style={[styles.noPosts, { color: theme.textSecondary }]}>
            No posts yet
          </Text>
        )}
      </View>

      <Modal visible={followersModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Followers ({followers.length})
              </Text>
              <TouchableOpacity onPress={() => setFollowersModal(false)}>
                <Text style={[styles.closeButton, { color: theme.text }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={followers}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <Text style={[styles.listItemText, { color: theme.text }]}>
                    {item.name}
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={followingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Following ({following.length})
              </Text>
              <TouchableOpacity onPress={() => setFollowingModal(false)}>
                <Text style={[styles.closeButton, { color: theme.text }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={following}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <Text style={[styles.listItemText, { color: theme.text }]}>
                    {item.name}
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.taskBarContainer}>
        <View style={styles.taskBar}>
          <TouchableOpacity
            style={styles.taskBarIcon}
            onPress={() => router.push("/")}
          >
            <MaterialIcons
              name="home"
              size={responsiveSize(24)}
              color={theme.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.taskBarIcon, styles.activeTaskBarIcon]}
            onPress={() => { }}
          >
            <MaterialIcons
              name="person"
              size={responsiveSize(24)}
              color={theme.tint}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.taskBarIcon}
            onPress={() => router.push("/choose-post-type")}
          >
            <MaterialIcons
              name="add"
              size={responsiveSize(24)}
              color={theme.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.taskBarIcon}
            onPress={() => router.push("/chat")}
          >
            <MaterialIcons
              name="chat"
              size={responsiveSize(24)}
              color={theme.icon}
            />
          </TouchableOpacity>
        </View>
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
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backArrow: {
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
  },
  avatarEditOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.dark.tint,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileDetails: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    marginTop: 8,
  },
  statsSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  postsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  noPosts: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 24,
  },
  listItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
  },
  listItemText: {
    fontSize: 16,
  },
  taskBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.dark.background,
    paddingBottom: responsiveSize(12),
    zIndex: 10,
  },
  taskBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#000000",
    borderTopLeftRadius: responsiveSize(20),
    borderTopRightRadius: responsiveSize(20),
    height: responsiveSize(70),
    width: "100%",
    paddingHorizontal: responsiveSize(20),
    paddingVertical: responsiveSize(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: responsiveSize(8),
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  taskBarIcon: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveSize(8),
    position: "relative",
  },
  activeTaskBarIcon: {
    position: "relative",
  },
});
