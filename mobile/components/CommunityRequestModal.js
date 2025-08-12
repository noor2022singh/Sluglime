import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { API_BASE_URL } from "../config/server";
import { useAuth } from "../store/authContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function CommunityRequestModal({
  visible,
  onClose,
  communityId,
  onRequestHandled,
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPendingRequests = async () => {
    if (!communityId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/communities/${communityId}/requests?adminId=${user._id}`
      );
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        console.error("Error fetching pending requests");
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/communities/requests/${requestId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ adminId: user._id }),
        }
      );

      if (response.ok) {
        Alert.alert("Success", "Join request approved successfully!");
        fetchPendingRequests();
        if (onRequestHandled) onRequestHandled();
      } else {
        const error = await response.json();
        Alert.alert("Error", error.error || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      Alert.alert("Error", "Failed to approve request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/communities/requests/${requestId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ adminId: user._id }),
        }
      );

      if (response.ok) {
        Alert.alert("Success", "Join request rejected successfully!");
        fetchPendingRequests();
        if (onRequestHandled) onRequestHandled();
      } else {
        const error = await response.json();
        Alert.alert("Error", error.error || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      Alert.alert("Error", "Failed to reject request");
    }
  };

  const renderRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.userInfo}>
        <Image
          source={
            item.user?.avatar
              ? { uri: item.user.avatar }
              : require("../assets/images/icon.png")
          }
          style={styles.userAvatar}
        />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {item.user?.name || item.user?.username || "Unknown User"}
          </Text>
          <Text style={styles.requestTime}>
            {dayjs(item.createdAt).fromNow()}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item._id)}
        >
          <MaterialIcons name="check" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item._id)}
        >
          <MaterialIcons name="close" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  useEffect(() => {
    if (visible && communityId) {
      fetchPendingRequests();
    }
  }, [visible, communityId]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Pending Join Requests</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading requests...</Text>
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="group" size={64} color="#666" />
              <Text style={styles.emptyTitle}>No Pending Requests</Text>
              <Text style={styles.emptySubtitle}>
                All join requests have been handled.
              </Text>
            </View>
          ) : (
            <FlatList
              data={requests}
              renderItem={renderRequest}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  listContainer: {
    padding: 20,
  },
  requestCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  requestTime: {
    fontSize: 12,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});
