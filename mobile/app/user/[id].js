import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Button,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Post from "../../components/Post";
import { useAuth } from "../../store/authContext";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../../constants/Colors";
import { API_BASE_URL } from "../../config/server";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const isOwner = currentUser && user && currentUser._id === user._id;
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar || "");
  const [selectedEditImage, setSelectedEditImage] = useState(null);
  const TABS = ["Activity", "Posts", "Likes"];
  const [activeTab, setActiveTab] = useState("Posts");
  const [avatarModal, setAvatarModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/users/${id}`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/users/${id}/posts`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/users/${id}/followers`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/users/${id}/following`).then((res) => res.json()),
    ])
      .then(([userData, userPosts, followersList, followingList]) => {
        setUser(userData);
        setPosts(userPosts);
        setFollowers(followersList);
        setFollowing(followingList);
        setIsFollowing(!!followersList.find((f) => f._id === currentUser?._id));
        setError("");
      })
      .catch(() => setError("Failed to load user"))
      .finally(() => setLoading(false));
  }, [id, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) return;
    setFollowLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${id}/${isFollowing ? "unfollow" : "follow"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentUserId: currentUser._id }),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to update follow status");
      setIsFollowing(data.followingUser);
      const [followersRes, followingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/${id}/followers`),
        fetch(`${API_BASE_URL}/users/${id}/following`),
      ]);
      setFollowers(await followersRes.json());
      setFollowing(await followingRes.json());
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const pickAndUploadImage = async (type) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append(type, { uri, name: `${type}.jpg`, type: "image/jpeg" });
      const endpoint = `${API_BASE_URL}/users/${user._id}/${type}`;
      await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      const userData = await fetch(`${API_BASE_URL}/users/${user._id}`).then(
        (res) => res.json()
      );
      setUser(userData);
    }
  };

  const pickEditImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedEditImage(result.assets[0]);
        setEditAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (selectedEditImage) {
        const formData = new FormData();
        formData.append('avatar', {
          uri: selectedEditImage.uri,
          type: 'image/jpeg',
          name: 'avatar.jpg'
        });

        const uploadResponse = await fetch(`${API_BASE_URL}/users/${user._id}/avatar`, {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          setEditAvatar(uploadData.avatar);
        }
      }

      await fetch(`${API_BASE_URL}/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          bio: editBio,
          avatar: editAvatar,
        }),
      });

      const userData = await fetch(`${API_BASE_URL}/users/${user._id}`).then(
        (res) => res.json()
      );
      setUser(userData);
      setEditModal(false);
      setSelectedEditImage(null);
    } catch (error) {
      Alert.alert("Error", "Failed to save profile");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (error || !user) {
    return (
      <View style={styles.center}>
        <Text>{error || "User not found"}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View style={styles.bannerWrapper}>
        {user.bannerImage ? (
          <Image source={{ uri: user.bannerImage }} style={styles.banner} />
        ) : (
          <View style={[styles.banner, { backgroundColor: "#eee" }]} />
        )}
        {isOwner && (
          <TouchableOpacity
            style={styles.editBannerBtn}
            onPress={() => pickAndUploadImage("banner")}
          >
            <Text style={styles.editIcon}>📷</Text>
          </TouchableOpacity>
        )}
        <View style={styles.avatarWrapper}>
          {user.avatar ? (
            <TouchableOpacity onPress={() => setAvatarModal(true)}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: "#ccc",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={{ fontSize: 32 }}>
                {user.name?.[0] || user.username?.[0]}
              </Text>
            </View>
          )}
          {isOwner && (
            <TouchableOpacity
              style={styles.editAvatarBtn}
              onPress={() => pickAndUploadImage("avatar")}
            >
              <Text style={styles.editIcon}>📷</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        <View style={styles.statsRow}>
          <TouchableOpacity onPress={() => setShowFollowers(true)}>
            <Text style={styles.stats}>{followers.length} Followers</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>·</Text>
          <TouchableOpacity onPress={() => setShowFollowing(true)}>
            <Text style={styles.stats}>{following.length} Following</Text>
          </TouchableOpacity>
        </View>
        {isOwner && (
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => {
              setEditName(user.name);
              setEditBio(user.bio || "");
              setEditAvatar(user.avatar || "");
              setSelectedEditImage(null); 
              setEditModal(true);
            }}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
        {!isOwner && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleFollow}
              style={[
                styles.followBtn,
                { backgroundColor: isFollowing ? "#aaa" : "#0a7ea4" },
              ]}
              disabled={followLoading}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === "Posts" &&
        (posts.length === 0 ? (
          <Text style={{ color: "#888", textAlign: "center", marginTop: 16 }}>
            No posts yet.
          </Text>
        ) : (
          posts.map((post, idx) => <Post key={idx} {...post} />)
        ))}
      {activeTab === "Activity" && (
        <Text style={{ color: "#888", textAlign: "center", marginTop: 16 }}>
          No activity yet.
        </Text>
      )}
      {activeTab === "Likes" && (
        <Text style={{ color: "#888", textAlign: "center", marginTop: 16 }}>
          No liked posts yet.
        </Text>
      )}
      <Modal
        visible={editModal}
        animationType="slide"
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.center}>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 16 }}>
            Edit Profile
          </Text>
          <Text>Name</Text>
          <TextInput
            value={editName}
            onChangeText={setEditName}
            style={styles.input}
          />
          <Text>Bio</Text>
          <TextInput
            value={editBio}
            onChangeText={setEditBio}
            style={[styles.input, { height: 80 }]}
            multiline
          />
          <Text>Avatar</Text>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={pickEditImage}
          >
            {selectedEditImage ? (
              <Image source={{ uri: selectedEditImage.uri }} style={styles.selectedEditImage} />
            ) : editAvatar ? (
              <Image source={{ uri: editAvatar }} style={styles.selectedEditImage} />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <MaterialIcons name="add-a-photo" size={24} color="#666" />
                <Text style={styles.imagePickerText}>Select Avatar</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={{ flexDirection: "row", marginTop: 16 }}>
            <TouchableOpacity
              onPress={handleSaveProfile}
              style={[styles.saveBtn, { marginRight: 12 }]}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditModal(false)}
              style={styles.cancelBtn}
            >
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showFollowers}
        animationType="slide"
        onRequestClose={() => setShowFollowers(false)}
      >
        <View style={styles.center}>
          <Text style={{ color: "#fff", fontSize: 20, marginBottom: 12 }}>
            Followers
          </Text>
          <FlatList
            data={followers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setShowFollowers(false);
                  router.push(`/user/${item._id}`);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                {item.avatar ? (
                  <Image
                    source={{ uri: item.avatar }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      marginRight: 8,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#ccc",
                      marginRight: 8,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text>{item.name?.[0]}</Text>
                  </View>
                )}
                <Text style={{ color: "#fff" }}>
                  {item.name} @{item.username}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ color: "#fff" }}>No followers yet.</Text>
            }
          />
          <Button title="Close" onPress={() => setShowFollowers(false)} />
        </View>
      </Modal>
      <Modal
        visible={showFollowing}
        animationType="slide"
        onRequestClose={() => setShowFollowing(false)}
      >
        <View style={styles.center}>
          <Text style={{ color: "#fff", fontSize: 20, marginBottom: 12 }}>
            Following
          </Text>
          <FlatList
            data={following}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setShowFollowing(false);
                  router.push(`/user/${item._id}`);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                {item.avatar ? (
                  <Image
                    source={{ uri: item.avatar }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      marginRight: 8,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#ccc",
                      marginRight: 8,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text>{item.name?.[0]}</Text>
                  </View>
                )}
                <Text style={{ color: "#fff" }}>
                  {item.name} @{item.username}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ color: "#fff" }}>Not following anyone yet.</Text>
            }
          />
          <Button title="Close" onPress={() => setShowFollowing(false)} />
        </View>
      </Modal>
      <Modal
        visible={avatarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModal(false)}
      >
        <View style={styles.fullscreenModalBg}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setAvatarModal(false)}
          >
            <Image
              source={{ uri: user.avatar }}
              style={styles.fullscreenAvatar}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  profileHeader: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#000000",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    backgroundColor: "#eee",
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  username: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 4,
  },
  email: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 16,
  },
  bannerWrapper: {
    width: "100%",
    height: 140,
    backgroundColor: "#eee",
    position: "relative",
    marginBottom: 60,
  },
  banner: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  avatarWrapper: {
    position: "absolute",
    left: 24,
    bottom: -50,
    zIndex: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#eee",
  },
  editBannerBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 6,
    zIndex: 2,
  },
  editAvatarBtn: {
    position: "absolute",
    right: -8,
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 6,
    zIndex: 2,
  },
  editIcon: {
    color: "#fff",
    fontSize: 18,
  },
  profileInfo: {
    alignItems: "flex-start",
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  name: {
    color: "#222",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 2,
  },
  username: {
    color: "#888",
    fontSize: 16,
    marginBottom: 2,
  },
  bio: {
    color: "#444",
    fontSize: 15,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stats: {
    color: "#888",
    fontSize: 14,
  },
  dot: {
    color: "#bbb",
    fontSize: 14,
    marginHorizontal: 6,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  editProfileBtn: {
    backgroundColor: "#eee",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
  },
  editProfileText: {
    color: "#222",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
    width: 260,
    backgroundColor: "#fff",
  },
  saveBtn: {
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelBtn: {
    backgroundColor: "#aaa",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  followBtn: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  tabBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginHorizontal: 6,
  },
  activeTabBtn: {
    backgroundColor: "#0a7ea4",
  },
  tabText: {
    color: "#222",
    fontWeight: "bold",
    fontSize: 15,
  },
  activeTabText: {
    color: "#fff",
  },
  fullscreenModalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenAvatar: {
    width: "100%",
    height: "100%",
  },
  imagePickerButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#eee",
  },
  selectedEditImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  imagePickerPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  imagePickerText: {
    color: "#666",
    fontSize: 12,
    marginTop: 5,
  },
});
