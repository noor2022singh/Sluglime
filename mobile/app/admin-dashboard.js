import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../store/authContext";
import { Colors } from "../constants/Colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { API_BASE_URL } from "../config/server";

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = Colors.dark;
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/whistles`, {
          headers: { "user-email": user?.email || "" },
        });
        const data = await res.json();
        if (Array.isArray(data)) setPendingCount(data.length);
      } catch (e) {
        setPendingCount(0);
      }
    };
    fetchPending();
  }, [user?.email]);

  if (user?.email !== "garsh5444@gmail.com") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            Admin Dashboard
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.errorCard, { backgroundColor: theme.card }]}>
          <MaterialIcons name="error" size={48} color={theme.error} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>
            Access Denied
          </Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
            You don't have permission to access the admin dashboard.
          </Text>
        </View>
      </View>
    );
  }

  const adminOptions = [
    {
      title: `Pending Whistles${pendingCount ? ` (${pendingCount})` : ""}`,
      subtitle: "Review and approve pending whistles",
      icon: "📣",
      route: "/whistle-approvals",
      color: "#3498DB",
    },
    {
      title: "Reports Dashboard",
      subtitle: "Manage user reports and content moderation",
      icon: "🛡️",
      route: "/reports-dashboard",
      color: "#FF6B6B",
    },
    {
      title: "Feedback Dashboard",
      subtitle: "View and manage user feedback",
      icon: "💬",
      route: "/feedback-dashboard",
      color: "#4ECDC4",
    },
    {
      title: "Hashtag Management",
      subtitle: "Add and remove hashtags for posts",
      icon: "🏷️",
      route: "/hashtag-management",
      color: "#9B59B6",
    },
  ];

  return (
    <ScrollView
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
          Admin Dashboard
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.welcomeCard}>
        <MaterialIcons
          name="admin-panel-settings"
          size={32}
          color={theme.tint}
        />
        <Text style={[styles.welcomeTitle, { color: theme.text }]}>
          Welcome, Admin!
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
          Manage your platform from here
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {adminOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.optionCard, { backgroundColor: theme.card }]}
            onPress={() => router.push(option.route)}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: option.color + "20" },
              ]}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>
                {option.title}
              </Text>
              <Text
                style={[styles.optionSubtitle, { color: theme.textSecondary }]}
              >
                {option.subtitle}
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
        <MaterialIcons name="info" size={20} color={theme.tint} />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Use these dashboards to monitor and manage your platform effectively.
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 34,
  },
  welcomeCard: {
    alignItems: "center",
    margin: 20,
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "flex-start",
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
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
