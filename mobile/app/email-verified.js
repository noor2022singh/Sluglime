import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors } from "../constants/Colors";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { API_BASE_URL } from "../config/server";

export default function EmailVerifiedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    try {
      const token = params.token;
      if (!token) {
        setError("No verification token provided");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/verify-email/${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setVerified(true);
        setUserData(data.user);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: Colors.dark.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <Text style={styles.loadingText}>Verifying your email...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: Colors.dark.background }]}
      >
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/images/icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>SlugLime</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.errorIcon}>
              <MaterialIcons name="error" size={60} color={Colors.dark.error} />
            </View>
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.subtitle}>{error}</Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/register")}
            >
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.dark.background }]}
    >
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>SlugLime</Text>
          <Text style={styles.tagline}>
            The modern platform for secure authentication and user management
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check-circle" size={80} color="#28a745" />
          </View>

          <Text style={styles.title}>Welcome to SlugLime!</Text>
          <Text style={styles.welcomeText}>
            Welcome, {userData?.name || "User"}!
          </Text>

          <Text style={styles.subtitle}>
            Your email has been verified successfully. You are now logged in and
            ready to explore your dashboard.
          </Text>

          <Text style={styles.instructionText}>
            Explore your dashboard or check back soon for more features!
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
    marginTop: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.tint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  formSection: {
    backgroundColor: Colors.dark.card,
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    shadowColor: Colors.dark.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  successIcon: {
    marginBottom: 20,
  },
  errorIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 10,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#28a745",
    marginBottom: 15,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 24,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: Colors.dark.tint,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: "center",
    minWidth: 200,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
