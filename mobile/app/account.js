import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../store/authContext";
import { Colors } from "../constants/Colors";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { API_BASE_URL } from "../config/server";

export default function AccountScreen() {
  const { user, updateUser, refreshUserData } = useAuth();
  const router = useRouter();
  const theme = Colors.dark;

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshUserData();
  }, []);

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      Alert.alert("Error", "Please enter a new email address.");
      return;
    }

    if (!currentPassword.trim()) {
      Alert.alert("Error", "Please enter your current password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/change-email-with-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user._id,
            newEmail: newEmail.trim(),
            currentPassword: currentPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Verification Email Sent!",
          "Please check your new email address and click the verification link to complete the email change.",
          [
            {
              text: "OK",
              onPress: () => {
                setShowEmailModal(false);
                setNewEmail("");
                setCurrentPassword("");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          data.error || "Failed to send verification email."
        );
      }
    } catch (error) {
      console.error("Email change error:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          oldPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Password changed successfully!");
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("Error", data.error || "Failed to change password.");
      }
    } catch (error) {
      console.error("Password change error:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Coming Soon",
              "Account deletion feature will be available soon."
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          Account Settings
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Account Settings
        </Text>

        <TouchableOpacity
          style={[
            styles.option,
            { backgroundColor: theme.card, borderColor: theme.divider },
          ]}
          onPress={() => setShowEmailModal(true)}
        >
          <Text style={[styles.optionLabel, { color: theme.text }]}>
            Change Email
          </Text>
          <Text style={[styles.optionValue, { color: theme.textSecondary }]}>
            {user?.email}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            { backgroundColor: theme.card, borderColor: theme.divider },
          ]}
          onPress={() => setShowPasswordModal(true)}
        >
          <Text style={[styles.optionLabel, { color: theme.text }]}>
            Change Password
          </Text>
          <Text style={[styles.optionValue, { color: theme.textSecondary }]}>
            ••••••••
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>

      {/* Email Change Modal */}
      <Modal visible={showEmailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Change Email
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              placeholder="New Email Address"
              placeholderTextColor={theme.textSecondary}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              placeholder="Current Password"
              placeholderTextColor={theme.textSecondary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.divider }]}
                onPress={() => {
                  setShowEmailModal(false);
                  setNewEmail("");
                  setCurrentPassword("");
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: loading ? theme.divider : theme.tint },
                ]}
                onPress={handleChangeEmail}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Change Email</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Change Password
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              placeholder="Current Password"
              placeholderTextColor={theme.textSecondary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              placeholder="New Password"
              placeholderTextColor={theme.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              placeholder="Confirm New Password"
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.divider }]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: loading ? theme.divider : theme.tint },
                ]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionValue: {
    fontSize: 14,
  },
  deleteBtn: {
    backgroundColor: "#FF4444",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
