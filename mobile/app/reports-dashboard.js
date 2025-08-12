import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../store/authContext";
import { Colors } from "../constants/Colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { API_BASE_URL } from "../config/server";

const ADMIN_EMAIL = "garsh5444@gmail.com";

export default function ReportsDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [suspendModal, setSuspendModal] = useState(false);
  const [suspendReportId, setSuspendReportId] = useState(null);
  const [suspendLoading, setSuspendLoading] = useState(false);

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000000",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 20 }}>Access Denied</Text>
        <Text style={{ color: "#aaa", marginTop: 8 }}>
          You do not have permission to view this page.
        </Text>
      </View>
    );
  }

  useEffect(() => {
    fetch(`${API_BASE_URL}/reports`)
      .then((res) => res.json())
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, action, duration) => {
    setUpdating(id);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${id}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duration ? { action, duration } : { action }),
      });

      if (response.ok) {
        const data = await response.json();
        setReports((reports) => reports.filter((r) => r._id !== id));

        let msg = "";
        if (action === "safe") msg = "Marked as safe.";
        else if (action === "warn") msg = "Author warned.";
        else if (action === "delete") msg = "Post deleted.";
        else if (action === "suspend") msg = "Author suspended.";
        else msg = "Action completed successfully.";

        Alert.alert("Success", msg);
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    } finally {
      setUpdating(null);
      setSuspendModal(false);
      setSuspendReportId(null);
      setSuspendLoading(false);
    }
  };

  const openSuspendModal = (reportId) => {
    setSuspendReportId(reportId);
    setSuspendModal(true);
  };

  const handleViewPost = (postLink) => {
    if (postLink) {
      router.push(`/posts/${postLink}`);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  return (
    <>
      <View style={styles.container}>
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={() => (
            <>
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                >
                  <MaterialIcons
                    name="arrow-back"
                    size={24}
                    color={Colors.dark.text}
                  />
                </TouchableOpacity>
                <Text style={[styles.title, { color: Colors.dark.text }]}>
                  Reports Dashboard
                </Text>
                <View style={styles.placeholder} />
              </View>

              <View style={styles.statsContainer}>
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: Colors.dark.card },
                  ]}
                >
                  <MaterialIcons
                    name="report"
                    size={24}
                    color={Colors.dark.tint}
                  />
                  <Text
                    style={[styles.statNumber, { color: Colors.dark.text }]}
                  >
                    {reports.length}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: Colors.dark.textSecondary },
                    ]}
                  >
                    Total Reports
                  </Text>
                </View>
              </View>
            </>
          )}
          ListEmptyComponent={() => (
            <View
              style={[
                styles.emptyContainer,
                { backgroundColor: Colors.dark.card },
              ]}
            >
              <MaterialIcons
                name="report"
                size={48}
                color={Colors.dark.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: Colors.dark.text }]}>
                No Reports Yet
              </Text>
              <Text
                style={[
                  styles.emptyMessage,
                  { color: Colors.dark.textSecondary },
                ]}
              >
                When users report content, it will appear here.
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View
              style={[
                styles.reportCard,
                {
                  backgroundColor: Colors.dark.card,
                  borderColor: Colors.dark.divider,
                },
              ]}
            >
              <View style={styles.reportHeader}>
                <Text style={[styles.reportId, { color: Colors.dark.text }]}>
                  Report #{item?._id?.slice(-6) || "Unknown"}
                </Text>
                <Text
                  style={[styles.reportStatus, { color: Colors.dark.tint }]}
                >
                  {item?.status || "pending"}
                </Text>
              </View>
              <Text style={[styles.reportReason, { color: Colors.dark.text }]}>
                Reason: {item?.reason || "No reason provided"}
              </Text>
              <Text
                style={[
                  styles.reportDescription,
                  { color: Colors.dark.textSecondary },
                ]}
              >
                Details: {item?.details || "No details provided"}
              </Text>
              <View style={styles.postInfo}>
                <Text style={[styles.postTitle, { color: Colors.dark.text }]}>
                  Reported Post:
                </Text>
                <Text
                  style={[
                    styles.postContent,
                    { color: Colors.dark.textSecondary },
                  ]}
                >
                  {item?.post?.content || "Post not found"}
                </Text>
                {item?.postLink && (
                  <TouchableOpacity
                    style={[
                      styles.viewPostButton,
                      { backgroundColor: Colors.dark.tint },
                    ]}
                    onPress={() => handleViewPost(item.postLink)}
                  >
                    <Text style={styles.viewPostButtonText}>
                      View Original Post
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.safeButton,
                    { backgroundColor: Colors.dark.tint },
                  ]}
                  onPress={() => handleAction(item._id, "safe")}
                  disabled={updating === item._id}
                >
                  <Text style={styles.actionButtonText}>
                    {updating === item._id ? "Updating..." : "Mark as Safe"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.warnButton,
                    { backgroundColor: Colors.dark.tint },
                  ]}
                  onPress={() => handleAction(item._id, "warn")}
                  disabled={updating === item._id}
                >
                  <Text style={styles.actionButtonText}>
                    {updating === item._id ? "Updating..." : "Warn Author"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.deleteButton,
                    { backgroundColor: Colors.dark.tint },
                  ]}
                  onPress={() => handleAction(item._id, "delete")}
                  disabled={updating === item._id}
                >
                  <Text style={styles.actionButtonText}>
                    {updating === item._id ? "Updating..." : "Delete Post"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.suspendButton,
                    { backgroundColor: Colors.dark.tint },
                  ]}
                  onPress={() => openSuspendModal(item._id)}
                  disabled={updating === item._id}
                >
                  <Text style={styles.actionButtonText}>
                    {updating === item._id ? "Updating..." : "Suspend Author"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            reports.length === 0 ? { flex: 1 } : { paddingBottom: 20 }
          }
        />
      </View>
      <Modal
        visible={suspendModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSuspendModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[styles.modalContent, { backgroundColor: Colors.dark.card }]}
          >
            <Text style={[styles.modalTitle, { color: Colors.dark.text }]}>
              Suspend Author
            </Text>
            <Text
              style={[
                styles.modalSubtitle,
                { color: Colors.dark.textSecondary },
              ]}
            >
              Select suspension duration:
            </Text>
            {[
              { label: "Ban for 1 hour", value: "1h" },
              { label: "Ban for 6 hours", value: "6h" },
              { label: "Ban for 1 day", value: "1d" },
              { label: "Ban for 1 week", value: "1w" },
              { label: "Ban permanently", value: "perm" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.suspendOption,
                  {
                    backgroundColor:
                      suspendLoading && opt.value === suspendReportId
                        ? Colors.dark.tint
                        : Colors.dark.background,
                    borderColor: Colors.dark.divider,
                  },
                ]}
                onPress={() => {
                  setSuspendLoading(true);
                  handleAction(suspendReportId, "suspend", opt.value);
                }}
                disabled={suspendLoading}
              >
                <Text
                  style={[
                    styles.suspendOptionText,
                    {
                      color:
                        suspendLoading && opt.value === suspendReportId
                          ? "#fff"
                          : Colors.dark.text,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={{ marginTop: 18, alignItems: "center" }}
              onPress={() => setSuspendModal(false)}
              disabled={suspendLoading}
            >
              <Text style={{ color: Colors.dark.textSecondary, fontSize: 16 }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.dark.background,
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
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  statCard: {
    alignItems: "center",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
    borderRadius: 15,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  reportCard: {
    margin: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reportId: {
    fontSize: 16,
    fontWeight: "bold",
  },
  reportStatus: {
    fontSize: 14,
    fontWeight: "bold",
  },
  reportReason: {
    fontSize: 16,
    marginBottom: 5,
  },
  reportDescription: {
    fontSize: 14,
    marginBottom: 15,
  },
  postInfo: {
    marginBottom: 15,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  postContent: {
    fontSize: 14,
    marginBottom: 10,
  },
  viewPostButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  viewPostButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    minWidth: "45%",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  safeButton: {
    backgroundColor: "#28a745",
  },
  warnButton: {
    backgroundColor: "#ffc107",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  suspendButton: {
    backgroundColor: "#6f42c1",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: 20,
    borderRadius: 12,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    marginTop: 10,
  },
});
