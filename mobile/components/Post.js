import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  Share,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth } from "../store/authContext";
import { useRealtime } from "../context/RealtimeContext";
import { Colors } from "../constants/Colors";
import { API_BASE_URL, WEB_BASE_URL } from "../config/server";
dayjs.extend(relativeTime);

export default function Post({
  _id,
  author,
  createdAt,
  content = "",
  title = "",
  likes = [],
  shares = 0,
  reposts = 0,
  onMenu,
  comments = 0,
  image = null,
  proofImages = [],
  anonymous = false,
  anonymousId = "",
  onDelete,
  repostOf,
  hashtags = [],
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { emitPostAction, getPostUpdate, clearPostUpdate, socket } =
    useRealtime();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(
    Array.isArray(likes) ? likes.length : 0
  );
  const [shareCount, setShareCount] = useState(shares);
  const [commentCount, setCommentCount] = useState(comments);
  const [likeLoading, setLikeLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareDialogLoading, setShareDialogLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [authorFollowers, setAuthorFollowers] = useState(0);
  const [authorFollowing, setAuthorFollowing] = useState(0);

  const [commentModal, setCommentModal] = useState(false);
  const [commentList, setCommentList] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const MAX_CHARS = 220;
  const [expanded, setExpanded] = useState(false);
  const safeContent = typeof content === "string" ? content : "";
  const isLong = safeContent.length > MAX_CHARS;
  const displayContent =
    expanded || !isLong ? safeContent : safeContent.slice(0, MAX_CHARS) + "...";

  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [selectedProofIdx, setSelectedProofIdx] = useState(0);

  const [menuVisible, setMenuVisible] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("False Information");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const reportReasons = [
    "False Information",
    "Dangerous Content",
    "Spam",
    "Other",
  ];

  const handleReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: _id,
          reason: reportReason,
          details: reportDetails,
          reporterId: user?._id,
          reporterEmail: user?.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit report");
      Alert.alert(
        "Report Submitted",
        "Thank you for helping keep the platform safe."
      );
      setReportModal(false);
      setReportReason("False Information");
      setReportDetails("");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    setLiked(Array.isArray(likes) && likes.includes(user?._id));
    setLikeCount(Array.isArray(likes) ? likes.length : 0);
    setShareCount(shares);
    if (user && author?._id && user._id !== author._id) {
      fetch(`${API_BASE_URL}/users/${author._id}/followers`)
        .then((res) => res.json())
        .then((followersList) => {
          setIsFollowing(
            Array.isArray(followersList) &&
            !!followersList.find((f) => f._id === user._id)
          );
          setAuthorFollowers(
            Array.isArray(followersList) ? followersList.length : 0
          );
        })
        .catch(() => {
          setIsFollowing(false);
          setAuthorFollowers(0);
        });
      fetch(`${API_BASE_URL}/users/${author._id}/following`)
        .then((res) => res.json())
        .then((followingList) =>
          setAuthorFollowing(
            Array.isArray(followingList) ? followingList.length : 0
          )
        )
        .catch(() => setAuthorFollowing(0));
    }
  }, [likes, shares, comments, user, author]);

  useEffect(() => {
    const update = getPostUpdate(_id);
    if (update) {
      if (update.likes !== undefined) {
        setLikeCount(update.likes);
        setLiked(update.liked);
      }
      if (update.shares !== undefined) {
        setShareCount(update.shares);
      }
      if (update.comments !== undefined) {
        setCommentCount(update.comments);
      }
      if (update.reposts !== undefined) {
      }
      clearPostUpdate(_id);
    }
  }, [getPostUpdate(_id)]);

  useEffect(() => {
    if (socket && author?._id) {
      const handleUserFollowed = (data) => {
        if (data.userId === author._id) {
          setAuthorFollowers(data.followersCount);
        }
      };

      socket.on("user_followed", handleUserFollowed);

      return () => {
        socket.off("user_followed", handleUserFollowed);
      };
    }
  }, [socket, author?._id]);

  const handleLike = async () => {
    if (!user) return;
    setLikeLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/posts/${_id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likes);

      emitPostAction("post_liked", {
        postId: _id,
        userId: user._id,
        liked: data.liked,
        likes: data.likes,
      });
    } catch (err) {
      Alert.alert("Error", "Failed to like post");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async () => {
    setShareLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/posts/${_id}/share`, {
        method: "POST",
      });
      const data = await res.json();
      setShareCount(data.shares);

      emitPostAction("post_shared", {
        postId: _id,
        shares: data.shares,
      });
    } catch (err) {
      Alert.alert("Error", "Failed to share post");
    } finally {
      setShareLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !author?._id) return;
    setFollowLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${author._id}/${isFollowing ? "unfollow" : "follow"
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentUserId: user._id }),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to update follow status");
      setIsFollowing(data.followingUser);
      const [followersRes, followingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/${author._id}/followers`),
        fetch(`${API_BASE_URL}/users/${author._id}/following`),
      ]);
      setAuthorFollowers((await followersRes.json()).length);
      setAuthorFollowing((await followingRes.json()).length);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const openComments = async () => {
    setCommentModal(true);
    setCommentLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/posts/${_id}/comments`);
      const data = await res.json();
      setCommentList(data);
    } catch (err) {
      setCommentList([]);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/posts/${_id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          text: commentText,
          parent: replyTo,
        }),
      });
      const data = await res.json();
      if (replyTo) {
        if (Platform.OS === "android")
          ToastAndroid.show("Reply added!", ToastAndroid.SHORT);
        else Alert.alert("Reply added!");
      }
      setCommentList([data, ...commentList]);
      setCommentText("");
      setReplyTo(null);

      setCommentCount((prev) => prev + 1);
      emitPostAction("comment_added", {
        postId: _id,
        commentId: data._id,
        userId: user._id,
      });
    } catch (err) {
      Alert.alert("Error", "Failed to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleShareDialog = async () => {
    setShareDialogLoading(true);
    try {
      const shareLink = `${WEB_BASE_URL}/posts/${_id}`;
      
      const authorName = anonymous ? 'Anonymous' : (author?.name || author?.username || 'Unknown');
      const shareText = title ? `${title}\n\n${content}` : content;
      const shareMessage = `${shareText}\n\n— ${authorName}\n\nRead more: ${shareLink}`;
      
      const result = await Share.share({
        message: shareMessage,
        title: title || 'Check out this post on SlugLime',
      });
    } catch (error) {
      Alert.alert("Error", "Failed to open share dialog");
    } finally {
      setShareDialogLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/posts/${_id}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                anonymous
                  ? { anonymousId: user.anonymousId }
                  : { userId: user._id }
              ),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete");
            if (onDelete) onDelete(_id);
            ToastAndroid.show("Post deleted", ToastAndroid.SHORT);
          } catch (err) {
            Alert.alert("Error", err.message || "Failed to delete post");
          }
        },
      },
    ]);
  };

  const handleRepost = () => {
    if (!user) return;
    router.push({
      pathname: "/create-post",
      params: {
        repostOf: _id,
        originalContent: content,
        originalAuthor: author?.name || author?.username || "Unknown",
        originalImage: image,
        originalProofImages: proofImages || [],
      },
    });
  };

  const handleDeleteRepost = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/posts/${_id}/repost`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete repost");

      if (onDelete) onDelete(_id);

      Alert.alert("Success", "Repost deleted successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to delete repost");
    }
  };

  const isOwner =
    (!anonymous && user && String(author?._id) === String(user._id)) ||
    (anonymous && user && user.anonymousId && user.anonymousId === anonymousId);
  const openReportModal = () => setReportModal(true);

  const theme = Colors.dark;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.card, borderColor: theme.divider },
      ]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.push(`/user/${author?._id}`)}
          style={styles.authorRow}
        >
          {author?.avatar ? (
            <Image source={{ uri: author.avatar }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: "#2a2a2a",
                  justifyContent: "center",
                  alignItems: "center",
                  borderTopColor: "#444444",
                  borderBottomColor: "#111111",
                  borderLeftColor: "#333333",
                  borderRightColor: "#333333",
                },
              ]}
            >
              <Text style={{ fontSize: 18, color: theme.text, fontWeight: "700" }}>
                {author?.name?.[0] || author?.username?.[0]}
              </Text>
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: theme.text }]}>
              {author?.name || "Unknown"}
            </Text>
            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {dayjs(createdAt).fromNow()}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={onMenu} style={styles.menuBtn}>
            <MaterialIcons name="more-horiz" size={22} color={theme.icon} />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {repostOf && (
        <View
          style={{
            backgroundColor: "#1f1f1f",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            borderLeftWidth: 3,
            borderLeftColor: theme.tint,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: -2 },
            elevation: 2,
            borderWidth: 1,
            borderTopColor: "#2a2a2a",
            borderBottomColor: "#0f0f0f",
            borderRightColor: "#1a1a1a",
          }}
        >
          <Text style={{ 
            color: theme.tint, 
            fontWeight: "600",
            fontSize: 13,
            marginBottom: 6 
          }}>
            🔄 Reposted from {repostOf.author?.name || "Unknown"}
          </Text>
          <Text style={{ 
            color: theme.textSecondary, 
            lineHeight: 20,
            fontSize: 14 
          }}>
            {repostOf.content}
          </Text>
        </View>
      )}
      {title && (
        <Text style={[styles.postTitle, { color: theme.text }]}>{title}</Text>
      )}
      {Array.isArray(proofImages) && proofImages.length > 0 && (
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#ffd700",
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginBottom: 8,
            marginTop: 6,
            shadowColor: "#ffd700",
            shadowOpacity: 0.4,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            elevation: 4,
            borderWidth: 1,
            borderTopColor: "#ffed4a",
            borderBottomColor: "#cc9900",
            borderLeftColor: "#e6c200",
            borderRightColor: "#e6c200",
          }}
        >
          <Text style={{ 
            color: "#1a1a1a", 
            fontWeight: "800", 
            fontSize: 11,
            letterSpacing: 0.6,
            textShadowColor: '#ffffff',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 1,
          }}>
            ✓ WITH PROOF
          </Text>
        </View>
      )}
      <TouchableOpacity 
        onPress={() => router.push(`/posts/${_id}`)}
        style={[styles.contentContainer, { backgroundColor: 'rgba(255,255,255,0.02)' }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.content, { color: theme.text }]}>
          {displayContent}
        </Text>
        <View style={styles.clickIndicator}>
          <MaterialIcons name="open-in-new" size={16} color={theme.textSecondary} />
        </View>
      </TouchableOpacity>
      {isLong && (
        <TouchableOpacity onPress={() => setExpanded((e) => !e)}>
          <Text style={[styles.readMoreText, { color: theme.tint }]}>
            {expanded ? "Show less" : "Read more"}
          </Text>
        </TouchableOpacity>
      )}
      {Array.isArray(hashtags) && hashtags.length > 0 && (
        <View style={styles.hashtagsContainer}>
          {hashtags.map((tag, index) => (
            <Text
              key={index}
              style={[
                styles.hashtag,
                { backgroundColor: "#111111", color: theme.tint },
              ]}
            >
              #{tag}
            </Text>
          ))}
        </View>
      )}
      {image && image.url && (
        <TouchableOpacity onPress={() => setImageModalVisible(true)}>
          <View style={{
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 6,
            marginTop: -2,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
            borderWidth: 1,
            borderTopColor: "#333333",
            borderBottomColor: "#111111",
            borderLeftColor: "#222222",
            borderRightColor: "#222222",
          }}>
            <Image
              source={{ uri: image.url }}
              style={{
                width: "100%",
                height: 200,
                backgroundColor: "#2a2a2a",
              }}
              resizeMode="cover"
              onError={() => { }}
            />
          </View>
        </TouchableOpacity>
      )}
      {Array.isArray(proofImages) && proofImages.length > 0 && (
        <View style={{ marginBottom: 12, marginTop: 8 }}>
          <Text style={{ 
            fontWeight: "600", 
            marginBottom: 8, 
            color: Colors.dark.text,
            fontSize: 14
          }}>
            Proof Images:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {proofImages.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  setSelectedProofIdx(idx);
                  setProofModalVisible(true);
                }}
                style={{
                  marginRight: 12,
                  borderRadius: 12,
                  overflow: 'hidden',
                  shadowColor: "#000",
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                  borderWidth: 1,
                  borderTopColor: "#444444",
                  borderBottomColor: "#111111",
                  borderLeftColor: "#222222",
                  borderRightColor: "#222222",
                }}
              >
                <Image
                  source={{ uri: img.url }}
                  style={{
                    width: 100,
                    height: 100,
                    backgroundColor: "#2a2a2a",
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setImageModalVisible(false)}>
          <View style={styles.fullscreenModalBg}>
            <Image
              source={{ uri: image?.url }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={{ color: "#fff", fontSize: 24 }}>×</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Modal
        visible={proofModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProofModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setProofModalVisible(false)}>
          <View style={styles.fullscreenModalBg}>
            <Image
              source={{ uri: proofImages[selectedProofIdx]?.url }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setProofModalVisible(false)}
            >
              <Text style={{ color: "#fff", fontSize: 24 }}>×</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionItem, liked && { backgroundColor: '#1a0f0f' }]}
          onPress={handleLike}
          disabled={likeLoading}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={liked ? "favorite" : "favorite-border"}
            size={18}
            color={liked ? "#ff6600" : "#aaa"}
          />
          <Text style={[styles.actionText, liked && { color: "#ff6600", fontWeight: "600" }]}>
            {likeCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={openComments}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chat-bubble-outline" size={18} color="#aaa" />
          <Text style={styles.actionText}>{commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={handleShareDialog}
          disabled={shareDialogLoading}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="share"
            size={18}
            color={shareDialogLoading ? "#ff6600" : "#aaa"}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={handleRepost}
          activeOpacity={0.7}
        >
          <MaterialIcons name="repeat" size={18} color="#0a7ea4" />
          <Text style={[styles.actionText, { color: "#0a7ea4" }]}>
            {reposts || 0}
          </Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          style={[styles.actionItem, { opacity: 0.6, marginRight: 0 }]} 
          onPress={openReportModal}
          activeOpacity={0.7}
        >
          <MaterialIcons name="flag" size={16} color="#666" />
        </TouchableOpacity>
      </View>
      <Modal
        visible={commentModal}
        animationType="slide"
        onRequestClose={() => setCommentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.stickyHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity
              onPress={() => setCommentModal(false)}
              style={styles.closeModalBtn}
            >
              <MaterialIcons name="close" size={24} color="#aaa" />
            </TouchableOpacity>
          </View>
          {commentLoading ? (
            <ActivityIndicator size="large" />
          ) : (
            <FlatList
              data={commentList}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  {item.user?.avatar ? (
                    <Image
                      source={{ uri: item.user.avatar }}
                      style={styles.commentAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.commentAvatar,
                        {
                          backgroundColor: "#ccc",
                          justifyContent: "center",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 14 }}>
                        {item.user?.name?.[0] || item.user?.username?.[0]}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.commentName}>
                      {item.user?.name || "Unknown"}
                    </Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <Text style={styles.commentTime}>
                      {dayjs(item.createdAt).fromNow()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setReplyTo(item._id)}
                      style={styles.replyBtn}
                    >
                      <Text style={styles.replyText}>Reply</Text>
                    </TouchableOpacity>
                    {Array.isArray(item.replies) &&
                      item.replies.length > 0 &&
                      item.replies.map((reply) => (
                        <View key={reply._id} style={styles.replyItem}>
                          {reply.user?.avatar ? (
                            <Image
                              source={{ uri: reply.user.avatar }}
                              style={styles.commentAvatar}
                            />
                          ) : (
                            <View
                              style={[
                                styles.commentAvatar,
                                {
                                  backgroundColor: "#ccc",
                                  justifyContent: "center",
                                  alignItems: "center",
                                },
                              ]}
                            >
                              <Text style={{ fontSize: 14 }}>
                                {reply.user?.name?.[0] ||
                                  reply.user?.username?.[0]}
                              </Text>
                            </View>
                          )}
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.commentName}>
                              {reply.user?.name || "Unknown"}
                            </Text>
                            <Text style={styles.commentText}>{reply.text}</Text>
                            <Text style={styles.commentTime}>
                              {dayjs(reply.createdAt).fromNow()}
                            </Text>
                          </View>
                        </View>
                      ))}
                  </View>
                  <View style={styles.commentDivider} />
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: "center", marginTop: 16 }}>
                  No comments yet.
                </Text>
              }
            />
          )}
          <View style={styles.commentInputRow}>
            {replyTo && <Text style={styles.replyingTo}>Replying...</Text>}
            <TextInput
              style={styles.commentInput}
              placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={commentSubmitting || !commentText.trim()}
              style={styles.commentSendBtn}
            >
              <MaterialIcons
                name="send"
                size={24}
                color={commentSubmitting ? "#aaa" : "#0a7ea4"}
              />
            </TouchableOpacity>
            {replyTo && (
              <TouchableOpacity
                onPress={() => setReplyTo(null)}
                style={styles.cancelReplyBtn}
              >
                <MaterialIcons name="close" size={20} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}>
            <View
              style={{
                position: "absolute",
                right: 16,
                top: 180,
                backgroundColor: "#111111",
                borderRadius: 16,
                padding: 16,
                minWidth: 220,
                elevation: 8,
              }}
            >
              {repostOf && (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                  onPress={handleDeleteRepost}
                >
                  <MaterialIcons
                    name="repeat"
                    size={22}
                    color="#ff4444"
                    style={{ marginRight: 12 }}
                  />
                  <Text style={{ color: "#ff4444", fontSize: 16 }}>
                    Delete Repost
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
                onPress={handleDelete}
              >
                <MaterialIcons
                  name="delete"
                  size={22}
                  color="#ff4444"
                  style={{ marginRight: 12 }}
                />
                <Text style={{ color: "#ff4444", fontSize: 16 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Modal
        visible={reportModal}
        animationType="slide"
        transparent
        onRequestClose={() => setReportModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setReportModal(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} />
        </TouchableWithoutFeedback>
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#111111",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 16,
              color: "#fff",
            }}
          >
            Report Post
          </Text>
          <Text style={{ color: "#fff", marginBottom: 8 }}>Reason</Text>
          {reportReasons.map((r) => (
            <TouchableOpacity
              key={r}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 6,
              }}
              onPress={() => setReportReason(r)}
            >
              <MaterialIcons
                name={
                  reportReason === r
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={18}
                color={reportReason === r ? "#0a7ea4" : "#aaa"}
              />
              <Text style={{ marginLeft: 8, color: "#fff" }}>{r}</Text>
            </TouchableOpacity>
          ))}
          <Text style={{ color: "#fff", marginTop: 12 }}>
            Details (optional)
          </Text>
          <TextInput
            style={{
              backgroundColor: "#222222",
              borderRadius: 8,
              padding: 10,
              marginTop: 6,
              color: "#fff",
              minHeight: 60,
            }}
            value={reportDetails}
            onChangeText={setReportDetails}
            placeholder="Add more details..."
            placeholderTextColor="#888"
            multiline
          />
          <TouchableOpacity
            style={{
              backgroundColor: "#ff4444",
              borderRadius: 8,
              marginTop: 18,
              padding: 12,
              alignItems: "center",
            }}
            onPress={handleReport}
            disabled={reportLoading}
          >
            {reportLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                Submit Report
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={{ alignItems: "center", marginTop: 10 }}
            onPress={() => setReportModal(false)}
          >
            <Text style={{ color: "#aaa" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
    borderColor: "#333333",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderTopColor: "#2a2a2a",
    borderBottomColor: "#0a0a0a",
    borderLeftColor: "#1f1f1f",
    borderRightColor: "#1f1f1f",
    backgroundGradient: 'linear-gradient(145deg, #1f1f1f, #151515)',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 0,
    borderWidth: 2,
    borderColor: "#444444",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    borderTopColor: "#555555",
    borderBottomColor: "#222222",
  },
  authorInfo: {
    marginLeft: 10,
    justifyContent: "center",
    flex: 1,
  },
  authorName: {
    fontWeight: "700",
    fontSize: 15,
    color: Colors.dark.text,
  },
  dot: {
    fontSize: 15,
    color: "#bbb",
    marginHorizontal: 4,
  },
  time: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    fontWeight: "400",
  },

  menuBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#1f1f1f",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderTopColor: "#333333",
    borderBottomColor: "#111111",
    borderLeftColor: "#222222",
    borderRightColor: "#222222",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 2,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metaAuthor: {
    fontSize: 14,
    color: "#888",
    fontWeight: "bold",
  },
  metaDot: {
    fontSize: 14,
    color: "#bbb",
    marginHorizontal: 4,
  },
  metaTime: {
    fontSize: 14,
    color: "#888",
  },
  metaFollowers: {
    fontSize: 14,
    color: "#888",
  },
  content: {
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 22,
    marginBottom: 10,
    marginTop: 6,
  },
  contentContainer: {
    paddingVertical: 4,
    position: 'relative',
  },
  clickIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    opacity: 0.6,
  },
  readMoreText: {
    color: Colors.dark.tint,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    backgroundColor: "#171717",
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: -2 },
    elevation: 3,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "#1f1f1f",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderTopColor: "#333333",
    borderBottomColor: "#111111",
    borderLeftColor: "#222222",
    borderRightColor: "#222222",
  },
  actionText: {
    color: "#aaa",
    fontSize: 13,
    marginLeft: 4,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    paddingTop: 48,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eee",
  },
  commentName: {
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 15,
    color: "#222",
  },
  commentTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  commentSendBtn: {
    marginLeft: 8,
    padding: 6,
  },
  closeModalBtn: {
    alignSelf: "flex-end",
    padding: 8,
  },
  stickyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
    marginBottom: 8,
  },
  commentDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
  replyBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  replyText: {
    color: "#0a7ea4",
    fontWeight: "bold",
  },
  replyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: 32,
    marginTop: 8,
    marginBottom: 8,
  },
  replyingTo: {
    color: "#0a7ea4",
    fontWeight: "bold",
    marginRight: 8,
  },
  cancelReplyBtn: {
    marginLeft: 4,
    padding: 2,
  },
  fullscreenModalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: "100%",
    height: "80%",
    resizeMode: "contain",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
    zIndex: 2,
  },
  hashtagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    marginBottom: 8,
  },
  hashtag: {
    backgroundColor: "#1f1f1f",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 13,
    color: Colors.dark.tint,
    fontWeight: "600",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderTopColor: "#333333",
    borderBottomColor: "#111111",
    borderLeftColor: "#222222",
    borderRightColor: "#222222",
  },
});
