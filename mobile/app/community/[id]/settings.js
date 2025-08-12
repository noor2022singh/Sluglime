import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../store/authContext";
import { API_BASE_URL } from "../../../config/server";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";

export default function CommunitySettings() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [community, setCommunity] = useState(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [banner, setBanner] = useState(null);
  const [savingCommunity, setSavingCommunity] = useState(false);

  useEffect(() => {
    fetchCommunity();
    fetchCategories();
  }, [id]);

  const fetchCommunity = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/communities/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCommunity(data);
        setName(data.name);
        setAvatar(data.avatar ? { uri: data.avatar } : null);
        setBanner(data.banner ? { uri: data.banner } : null);
      }
    } catch {}
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/communities/${id}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (type === "avatar") setAvatar(result.assets[0]);
      if (type === "banner") setBanner(result.assets[0]);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/communities/${id}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          name: newCategory.trim(),
          icon: newIcon.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        Alert.alert("Error", err.error || "Failed to add category");
      } else {
        setNewCategory("");
        setNewIcon("");
        fetchCategories();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (name) => {
    Alert.alert("Delete Category", `Delete category "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setSaving(true);
          try {
            const res = await fetch(
              `${API_BASE_URL}/communities/${id}/categories/${encodeURIComponent(
                name
              )}`,
              {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user._id }),
              }
            );
            if (!res.ok) {
              const err = await res.json();
              Alert.alert("Error", err.error || "Failed to delete category");
            } else {
              fetchCategories();
            }
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const handleEditCategory = async () => {
    if (!editing || !editing.newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/communities/${id}/categories/${encodeURIComponent(
          editing.name
        )}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            newName: editing.newName.trim(),
            icon: editing.newIcon.trim(),
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        Alert.alert("Error", err.error || "Failed to update category");
      } else {
        setEditing(null);
        fetchCategories();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCommunity = async () => {
    setSavingCommunity(true);
    try {
      const res = await fetch(`${API_BASE_URL}/communities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, name }),
      });
      if (!res.ok) {
        const err = await res.json();
        Alert.alert("Error", err.error || "Failed to update community");
        setSavingCommunity(false);
        return;
      }
      if (
        (avatar && !avatar.uri?.startsWith("http")) ||
        (banner && !banner.uri?.startsWith("http"))
      ) {
        const formData = new FormData();
        formData.append("userId", user._id);
        if (avatar && !avatar.uri?.startsWith("http")) {
          formData.append("avatar", {
            uri: avatar.uri,
            name: "avatar.jpg",
            type: avatar.mimeType || "image/jpeg",
          });
        }
        if (banner && !banner.uri?.startsWith("http")) {
          formData.append("banner", {
            uri: banner.uri,
            name: "banner.jpg",
            type: banner.mimeType || "image/jpeg",
          });
        }
        await fetch(`${API_BASE_URL}/communities/${id}`, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        });
      }
      Alert.alert("Success", "Community updated!");
      fetchCommunity();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update community");
    } finally {
      setSavingCommunity(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Settings</Text>
      </View>
      <Text style={styles.sectionTitle}>Edit Community Info</Text>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <TouchableOpacity onPress={() => pickImage("avatar")}>
          <Image
            source={
              avatar
                ? { uri: avatar.uri }
                : require("../../../assets/images/icon.png")
            }
            style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 8 }}
          />
          <Text style={{ color: "#888", textAlign: "center" }}>
            Change Avatar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => pickImage("banner")}
          style={{ alignItems: "center" }}
        >
          <View
            style={{
              position: "relative",
              width: 200,
              height: 60,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <Image
              source={
                banner
                  ? { uri: banner.uri }
                  : require("../../../assets/images/icon.png")
              }
              style={{ width: 200, height: 60, borderRadius: 10 }}
            />
            <View
              style={{
                position: "absolute",
                right: 10,
                bottom: 10,
                backgroundColor: "rgba(0,0,0,0.5)",
                borderRadius: 16,
                padding: 4,
              }}
            >
              <MaterialIcons name="photo-camera" size={20} color="#fff" />
            </View>
          </View>
          <Text style={{ color: "#888", textAlign: "center", marginTop: 2 }}>
            Tap to change banner
          </Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { marginTop: 8, width: "100%" }]}
          value={name}
          onChangeText={setName}
          placeholder="Community Name"
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          onPress={handleSaveCommunity}
          style={[
            styles.addButton,
            { marginTop: 10, alignSelf: "center", minWidth: 120 },
          ]}
          disabled={savingCommunity}
        >
          <Text
            style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}
          >
            {savingCommunity ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Manage Categories</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) =>
          editing && editing.name === item.name ? (
            <View style={styles.categoryRow}>
              <TextInput
                style={styles.input}
                value={editing.newName}
                onChangeText={(t) => setEditing((e) => ({ ...e, newName: t }))}
                placeholder="Category Name"
                placeholderTextColor="#888"
              />
              <TextInput
                style={styles.input}
                value={editing.newIcon}
                onChangeText={(t) => setEditing((e) => ({ ...e, newIcon: t }))}
                placeholder="Icon (optional)"
                placeholderTextColor="#888"
              />
              <TouchableOpacity
                onPress={handleEditCategory}
                style={styles.saveButton}
                disabled={saving}
              >
                <MaterialIcons name="check" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditing(null)}
                style={styles.cancelButton}
              >
                <MaterialIcons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.categoryRow}>
              {item.icon ? (
                <MaterialIcons
                  name={item.icon}
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              ) : null}
              <Text style={styles.categoryName}>{item.name}</Text>
              <TouchableOpacity
                onPress={() =>
                  setEditing({
                    name: item.name,
                    newName: item.name,
                    newIcon: item.icon || "",
                  })
                }
                style={styles.editButton}
              >
                <MaterialIcons name="edit" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteCategory(item.name)}
                style={styles.deleteButton}
              >
                <MaterialIcons name="delete" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )
        }
        ListEmptyComponent={
          <Text style={{ color: "#888", textAlign: "center", marginTop: 20 }}>
            No categories yet.
          </Text>
        }
      />
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={newCategory}
          onChangeText={setNewCategory}
          placeholder="New Category Name"
          placeholderTextColor="#888"
        />
        <TextInput
          style={styles.input}
          value={newIcon}
          onChangeText={setNewIcon}
          placeholder="Icon (optional)"
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          onPress={handleAddCategory}
          style={styles.addButton}
          disabled={saving}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: {
    marginRight: 16,
    padding: 8,
    backgroundColor: "#222",
    borderRadius: 20,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  categoryName: { color: "#fff", fontSize: 16, flex: 1 },
  editButton: {
    marginLeft: 8,
    backgroundColor: "#007AFF",
    borderRadius: 16,
    padding: 6,
  },
  deleteButton: {
    marginLeft: 8,
    backgroundColor: "#ff3b30",
    borderRadius: 16,
    padding: 6,
  },
  saveButton: {
    marginLeft: 8,
    backgroundColor: "#007AFF",
    borderRadius: 16,
    padding: 6,
  },
  cancelButton: {
    marginLeft: 8,
    backgroundColor: "#888",
    borderRadius: 16,
    padding: 6,
  },
  addRow: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  input: {
    flex: 1,
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
  },
  addButton: { backgroundColor: "#007AFF", borderRadius: 16, padding: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
