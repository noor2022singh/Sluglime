import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Alert,
  Animated,
  Modal,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from "../constants/Colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useAuth } from "../store/authContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { io } from "socket.io-client";
import * as ImagePicker from "expo-image-picker";
import { ToastAndroid } from "react-native";
import dayjs from "dayjs";
import { API_BASE_URL, SOCKET_URL } from "../config/server";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

function responsiveSize(size) {
  return Math.round(size * (width / 375));
}

const useTheme = () => Colors.dark;

function ChatScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [sendingImage, setSendingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageForModal, setSelectedImageForModal] = useState(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1.0,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const sendImage = async () => {
    if (!selectedImage || !selectedUser || !user || !socket) return;

    setSendingImage(true);
    try {
      let fileExtension = "jpg";
      let mimeType = "image/jpeg";

      if (selectedImage.includes(".")) {
        fileExtension = selectedImage.split(".").pop().toLowerCase();
        mimeType =
          fileExtension === "png"
            ? "image/png"
            : fileExtension === "gif"
            ? "image/gif"
            : fileExtension === "webp"
            ? "image/webp"
            : "image/jpeg";
      }

      const fileName = `chat-image-${Date.now()}.${fileExtension}`;

      const formData = new FormData();
      formData.append("image", {
        uri: selectedImage,
        type: mimeType,
        name: fileName,
      });
      formData.append("senderId", user._id);
      formData.append("receiverId", selectedUser._id);

      const response = await fetch(`${API_BASE_URL}/messages/send-image`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `HTTP ${response.status}: Failed to send image`
        );
      }

      const tempImageMessage = {
        _id: Date.now().toString(),
        sender: user._id,
        receiver: selectedUser._id,
        content: data.message.imageUrl,
        type: "image",
        imageUrl: data.message.imageUrl,
        timestamp: new Date().toISOString(),
        senderDetails: {
          username: user.username,
          name: user.name,
          avatar: user.avatar,
        },
      };

      setMessages((prev) => [...prev, tempImageMessage]);

      setTimeout(() => {
        if (messagesListRef.current) {
          messagesListRef.current.scrollToEnd({ animated: true });
          setShowScrollToBottom(false);
        }
      }, 100);

      socket.emit("send_message", {
        senderId: user._id,
        receiverId: selectedUser._id,
        content: data.message.content,
        type: "image",
        imageUrl: data.message.imageUrl,
      });

      setSelectedImage(null);
      ToastAndroid.show("Image sent!", ToastAndroid.SHORT);
    } catch (error) {
      console.error("Error sending image:", error);
      Alert.alert("Error", "Failed to send image. Please try again.");
    } finally {
      setSendingImage(false);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
  };
  const debounceRef = useRef();
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const messagesListRef = useRef(null);
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const accentGradient = theme.accentGradient || ["#030b21ff", "#0d2449ff", "#5a8ecfff"];

  useEffect(() => {
    if (user?._id) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        setSocketConnected(true);
        refreshOnlineStatus();
      });

      newSocket.on("disconnect", () => {
        setSocketConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setSocketConnected(false);
      });

      newSocket.emit("join", user._id);

      newSocket.on("new_message", (message) => {
        setMessages((prev) => [...prev, message]);
      });

      newSocket.on("message_sent", (message) => {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === message._id ? message : msg))
        );
      });

      newSocket.on("user_typing", (data) => {
        if (data.senderId === selectedUser?._id) {
          setOtherUserTyping(data.isTyping);
        }
      });

      newSocket.on("message_error", (error) => {
        console.error("Message error:", error);
        Alert.alert("Error", "Failed to send message");
      });

      newSocket.on("user_status_change", (data) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          if (data.online) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      });

      newSocket.on("online_users", (onlineUserIds) => {
        setOnlineUsers(new Set(onlineUserIds));
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user?._id]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (socketConnected) {
        refreshOnlineStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [socketConnected]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);

        setTimeout(() => {
          if (messagesListRef.current && messages.length > 0) {
            messagesListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [messages.length]);

  useEffect(() => {
    if (socket && selectedUser) {
      const timeout = setTimeout(() => {
        socket.emit("typing", {
          senderId: user._id,
          receiverId: selectedUser._id,
          isTyping: false,
        });
        setIsTyping(false);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [newMessage, socket, selectedUser]);

  const handleTyping = (text) => {
    setNewMessage(text);

    if (socket && selectedUser && !isTyping) {
      setIsTyping(true);
      socket.emit("typing", {
        senderId: user._id,
        receiverId: selectedUser._id,
        isTyping: true,
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (response.ok) {
        const data = await response.json();
        const filteredUsers = data.filter((u) => u._id !== user?._id);
        setUsers(filteredUsers);

        const onlineSet = new Set();
        filteredUsers.forEach((user) => {
          if (user.online) {
            onlineSet.add(user._id);
          }
        });
        setOnlineUsers(onlineSet);

      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser || !user) return;

    setMessagesLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/conversation/${user._id}/${selectedUser._id}`
      );
      if (response.ok) {
        const data = await response.json();

        const processedMessages = data.map((message) => ({
          ...message,
          sender:
            typeof message.sender === "object"
              ? message.sender._id
              : message.sender,
        }));

        setMessages(processedMessages);
        setTimeout(() => {
          if (messagesListRef.current && processedMessages.length > 0) {
            messagesListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const toggleSidebar = () => {
    if (sidebarVisible) {
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setSidebarVisible(false));
    } else {
      setSidebarVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!text) {
      setSearchResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/search?query=${encodeURIComponent(text)}`
        );
        const data = await res.json();
        const usersOnly = data
          .filter((item) => item.username || item.name || item.email)
          .filter((u) => u._id !== user?._id);
        setSearchResults(usersOnly);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setMessages([]);
    setNewMessage("");
    toggleSidebar();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user || !socket) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);

    const tempMessage = {
      _id: Date.now().toString(),
      sender: user._id,
      receiver: selectedUser._id,
      content: messageContent,
      timestamp: new Date().toISOString(),
      senderDetails: {
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      },
    };

    setMessages((prev) => [...prev, tempMessage]);

    setTimeout(() => {
      if (messagesListRef.current) {
        messagesListRef.current.scrollToEnd({ animated: true });
        setShowScrollToBottom(false);
      }
    }, 100);

    try {
      socket.emit("send_message", {
        senderId: user._id,
        receiverId: selectedUser._id,
        content: messageContent,
      });

      socket.emit("typing", {
        senderId: user._id,
        receiverId: selectedUser._id,
        isTyping: false,
      });
      setIsTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const isSameUser = (id1, id2) => {
    if (!id1 || !id2) return false;

    const actualId1 = typeof id1 === "object" && id1._id ? id1._id : id1;
    const actualId2 = typeof id2 === "object" && id2._id ? id2._id : id2;

    return actualId1.toString() === actualId2.toString();
  };

  const isUserOnline = (userId) => {
    if (!userId) return false;
    const userIdStr = userId.toString();
    return Array.from(onlineUsers).some((id) => id.toString() === userIdStr);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const refreshOnlineStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (response.ok) {
        const data = await response.json();
        const onlineSet = new Set();
        data.forEach((user) => {
          if (user.online && user._id !== user?._id) {
            onlineSet.add(user._id);
          }
        });
        setOnlineUsers(onlineSet);
      }
    } catch (error) {
      console.error("Error refreshing online status:", error);
    }
  };

  const openImageModal = (imageUrl) => {
    setSelectedImageForModal(imageUrl);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImageForModal(null);
  };

  const scrollToBottom = () => {
    if (messagesListRef.current) {
      messagesListRef.current.scrollToEnd({ animated: true });
      setShowScrollToBottom(false);
    }
  };

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 20;

    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    setShowScrollToBottom(!isNearBottom);
  };

  const handleScrollBeginDrag = () => {
    setIsScrolling(true);
  };

  const handleScrollEndDrag = () => {
    setIsScrolling(false);
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        selectedUser?._id === item._id && styles.selectedUserItem,
      ]}
      onPress={() => selectUser(item)}
    >
      <View style={styles.userAvatarContainer}>
        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            style={styles.userAvatar}
          />
        ) : (
          <View style={[styles.userAvatar, { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
              {item.name?.[0] || item.username?.[0] || "U"}
            </Text>
          </View>
        )}
        {isUserOnline(item._id) && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.text }]}>
          {item.name || item.username}
        </Text>
        <Text style={[styles.userStatus, { color: theme.textSecondary }]}>
          {isUserOnline(item._id) ? "Online" : "Offline"}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => {
    const isOwnMessage = isSameUser(item.sender, user._id);

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {/* Avatar with ring for other user */}
        {!isOwnMessage && (
          item.senderDetails?.avatar ? (
            <View style={styles.avatarRing}>
              <Image
                source={{ uri: item.senderDetails.avatar }}
                style={styles.messageAvatar}
              />
            </View>
          ) : (
            <View style={[styles.messageAvatar, { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" }]}> 
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>
                {item.senderDetails?.name?.[0] || item.senderDetails?.username?.[0] || "U"}
              </Text>
            </View>
          )
        )}
        {/* Glassmorphism bubble with gradient for own message */}
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.modernOwnMessageBubble : styles.modernOtherMessageBubble,
          ]}
        >
          {item.type === "image" ? (
            <TouchableOpacity
              style={styles.imageMessageContainer}
              onPress={() => openImageModal(item.content)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.content }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <Text
              style={[
                styles.messageText,
                { color: isOwnMessage ? "#fff" : theme.text },
              ]}
            >
              {item.content}
            </Text>
          )}
          <Text
            style={[
              styles.messageTime,
              {
                color: isOwnMessage ? "rgba(255,255,255,0.7)" : theme.textSecondary,
              },
            ]}
          >
            {dayjs(item.timestamp || item.createdAt).format("h:mm A")}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}> 
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
  <SafeAreaView style={[styles.header, { backgroundColor: theme.background }]}> 
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons
                name="arrow-back"
                size={responsiveSize(24)}
                color={theme.text}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>💬 Chat</Text>
            <View style={styles.headerRight}>
              <View
                style={[
                  styles.connectionIndicator,
                  { backgroundColor: socketConnected ? "#28a745" : "#dc3545" },
                ]}
              />
              <TouchableOpacity
                style={[styles.sidebarButton, { backgroundColor: theme.card }]}
                onPress={toggleSidebar}
              >
                <View style={styles.sidebarButtonContent}>
                  <MaterialIcons
                    name="people"
                    size={responsiveSize(20)}
                    color={theme.tint}
                  />
                  <Text
                    style={[styles.sidebarButtonText, { color: theme.tint }]}
                  >
                    Users
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

  <View style={styles.content}>
          <Animated.View
            style={[
              styles.sidebar,
              {
                backgroundColor: theme.card,
                transform: [{ translateX: slideAnim }],
                left: 0,
                top: 0,
                bottom: 0,
                width: width * 0.8,
                position: "absolute",
                zIndex: 1000,
              },
            ]}
          >
            <View style={styles.sidebarHeader}>
              <Text style={[styles.sidebarTitle, { color: theme.text }]}>Users</Text>
              <TouchableOpacity onPress={toggleSidebar}>
                <MaterialIcons
                  name="close"
                  size={responsiveSize(24)}
                  color={theme.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MaterialIcons
                name="search"
                size={responsiveSize(20)}
                color={theme.textSecondary}
              />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search users..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            <FlatList
              data={searchQuery ? searchResults : users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              style={styles.userList}
              ListEmptyComponent={() => (
                <View style={styles.emptyList}>
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <Text
                        style={[
                          styles.loadingText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Searching...
                      </Text>
                    </View>
                  ) : searchQuery ? (
                    <View style={styles.noResultsContainer}>
                      <Text
                        style={[
                          styles.noResultsText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        No users found for "{searchQuery}"
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.noUsersContainer}>
                      <Text
                        style={[
                          styles.noUsersText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        No users available
                      </Text>
                    </View>
                  )}
                </View>
              )}
            />
          </Animated.View>

          {sidebarVisible && (
            <TouchableOpacity
              style={styles.overlay}
              onPress={toggleSidebar}
              activeOpacity={1}
            />
          )}

          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={[styles.chatArea, { backgroundColor: theme.background }]}> 
              {selectedUser ? (
                <>
                  <View style={[styles.chatHeader, { backgroundColor: theme.card }]}> 
                    <View style={styles.chatUserAvatarContainer}>
                      {selectedUser.avatar ? (
                        <Image
                          source={{ uri: selectedUser.avatar }}
                          style={styles.chatUserAvatar}
                        />
                      ) : (
                        <View style={[styles.chatUserAvatar, { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" }]}> 
                          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
                            {selectedUser.name?.[0] || selectedUser.username?.[0] || "U"}
                          </Text>
                        </View>
                      )}
                      {isUserOnline(selectedUser._id) && (
                        <View style={styles.chatOnlineIndicator} />
                      )}
                    </View>
                    <View style={styles.chatUserInfo}>
                      <Text style={[styles.chatUserName, { color: theme.text }]}>{selectedUser.name || selectedUser.username}</Text>
                      <Text style={[styles.chatUserStatus, { color: theme.textSecondary }]}>{isUserOnline(selectedUser._id) ? "Online" : "Offline"}</Text>
                    </View>
                    <TouchableOpacity>
                      <MaterialIcons
                        name="info"
                        size={responsiveSize(24)}
                        color={theme.text}
                      />
                    </TouchableOpacity>
                  </View>

                  {messagesLoading ? (
                    <View style={styles.messagesLoadingContainer}>
                      <ActivityIndicator size="large" color={theme.tint} />
                      <Text
                        style={[
                          styles.loadingText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Loading messages...
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      ref={messagesListRef}
                      data={messages}
                      renderItem={renderMessage}
                      keyExtractor={(item) => item._id}
                      showsVerticalScrollIndicator={true}
                      style={styles.messagesList}
                      contentContainerStyle={styles.messagesContent}
                      onContentSizeChange={() => {
                        if (messagesListRef.current && messages.length > 0) {
                          messagesListRef.current.scrollToEnd({
                            animated: true,
                          });
                        }
                      }}
                      onScroll={handleScroll}
                      onScrollBeginDrag={handleScrollBeginDrag}
                      onScrollEndDrag={handleScrollEndDrag}
                      ListEmptyComponent={() => (
                        <View style={styles.noMessagesContainer}>
                          <Text
                            style={[
                              styles.noMessagesText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            No messages yet. Start the conversation!
                          </Text>
                        </View>
                      )}
                    />
                  )}

                  {otherUserTyping && (
                    <View style={styles.typingIndicator}>
                      <View
                        style={[
                          styles.typingBubble,
                          { backgroundColor: theme.card },
                        ]}
                      >
                        <Text
                          style={[
                            styles.typingText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {selectedUser?.name || selectedUser?.username} is
                          typing...
                        </Text>
                      </View>
                    </View>
                  )}

                  <View
                    style={[
                      styles.inputContainer,
                      { paddingBottom: keyboardVisible ? 10 : 0 },
                    ]}
                  >
                    {selectedImage && (
                      <View style={styles.imagePreviewContainer}>
                        <Image
                          source={{ uri: selectedImage }}
                          style={styles.imagePreview}
                        />
                        <TouchableOpacity
                          onPress={clearSelectedImage}
                          style={styles.removeImageBtn}
                        >
                          <MaterialIcons name="close" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )}

                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: theme.card },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={pickImage}
                        style={styles.attachButton}
                        disabled={sendingImage}
                      >
                        <LinearGradient
                          colors={accentGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.gradientButton}
                        >
                          {sendingImage ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <MaterialIcons
                              name="attach-file"
                              size={20}
                              color="#fff"
                            />
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.messageInput, { color: theme.text }]}
                        placeholder="Type a message..."
                        value={newMessage}
                        onChangeText={handleTyping}
                        multiline
                        maxLength={1000}
                        textAlignVertical="top"
                      />
                      <TouchableOpacity
                        onPress={selectedImage ? sendImage : sendMessage}
                        style={styles.sendButton}
                        disabled={
                          (!newMessage.trim() && !selectedImage) ||
                          sendingMessage ||
                          sendingImage
                        }
                      >
                        <LinearGradient
                          colors={accentGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.gradientButton}
                        >
                          {sendingMessage || sendingImage ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <MaterialIcons name="send" size={20} color="#fff" />
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.selectUserContainer}>
                  <MaterialIcons
                    name="chat"
                    size={responsiveSize(80)}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.selectUserText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Select a user to start chatting
                  </Text>
                </View>
              )}

              {showScrollToBottom && (
                <TouchableOpacity
                  style={[styles.scrollToBottomButton, { opacity: 0.9 }]}
                  onPress={scrollToBottom}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={28}
                    color="#fff"
                  />
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={imageModalVisible}
        transparent={true}
        onRequestClose={closeImageModal}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={closeImageModal}
          >
            <MaterialIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImageForModal }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientButton: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: responsiveSize(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    backgroundColor: Colors.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveSize(20),
    paddingVertical: responsiveSize(18),
  },
  headerTitle: {
    fontSize: responsiveSize(20),
    fontWeight: "bold",
  },
  // ...existing code...
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  connectionIndicator: {
    width: responsiveSize(12),
    height: responsiveSize(12),
    borderRadius: responsiveSize(6),
    marginRight: responsiveSize(10),
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
    position: "relative",
    backgroundColor: Colors.dark.background,
  },
  sidebar: {
    borderRightWidth: 1,
    borderRightColor: "#333",
    backgroundColor: Colors.dark.background,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveSize(16),
    paddingVertical: responsiveSize(12),
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sidebarTitle: {
    fontSize: responsiveSize(18),
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveSize(12),
    paddingVertical: responsiveSize(8),
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  searchInput: {
    flex: 1,
    marginLeft: responsiveSize(8),
    fontSize: responsiveSize(14),
  },
  userList: {
    flex: 1,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveSize(12),
    paddingVertical: responsiveSize(12),
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  selectedUserItem: {
    backgroundColor: Colors.dark.tint + "20",
  },
  userAvatarContainer: {
    position: "relative",
    width: responsiveSize(40),
    height: responsiveSize(40),
    borderRadius: responsiveSize(20),
    marginRight: responsiveSize(12),
  },
  userAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: responsiveSize(20),
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: responsiveSize(10),
    height: responsiveSize(10),
    borderRadius: responsiveSize(5),
    backgroundColor: "#28a745",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: responsiveSize(16),
    fontWeight: "600",
    marginBottom: responsiveSize(2),
  },
  userStatus: {
    fontSize: responsiveSize(12),
  },
  unreadBadge: {
    backgroundColor: Colors.dark.tint,
    borderRadius: responsiveSize(10),
    minWidth: responsiveSize(20),
    height: responsiveSize(20),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: responsiveSize(6),
  },
  unreadText: {
    color: "#fff",
    fontSize: responsiveSize(12),
    fontWeight: "bold",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
  chatArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveSize(16),
    paddingVertical: responsiveSize(12),
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: Colors.dark.card,
  },
  chatUserAvatarContainer: {
    position: "relative",
    width: responsiveSize(40),
    height: responsiveSize(40),
    borderRadius: responsiveSize(20),
    marginRight: responsiveSize(12),
  },
  chatUserAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: responsiveSize(20),
  },
  chatOnlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: responsiveSize(10),
    height: responsiveSize(10),
    borderRadius: responsiveSize(5),
    backgroundColor: "#28a745",
  },
  chatUserInfo: {
    flex: 1,
  },
  chatUserName: {
    fontSize: responsiveSize(16),
    fontWeight: "600",
    marginBottom: responsiveSize(2),
  },
  chatUserStatus: {
    fontSize: responsiveSize(12),
  },
  messagesList: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: responsiveSize(16),
  },
  messagesContent: {
    paddingVertical: responsiveSize(10),
    backgroundColor: Colors.dark.background,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: responsiveSize(4),
  },
  ownMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: responsiveSize(24),
    height: responsiveSize(24),
    borderRadius: responsiveSize(12),
    marginHorizontal: responsiveSize(4),
  },
  messageBubble: {
    maxWidth: "70%",
    paddingHorizontal: responsiveSize(14),
    paddingVertical: responsiveSize(10),
    borderRadius: responsiveSize(18),
    marginVertical: responsiveSize(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    backdropFilter: "blur(8px)",
  },
  modernOwnMessageBubble: {
    backgroundColor: "rgba(30, 80, 200, 0.7)",
    borderBottomRightRadius: responsiveSize(6),
    borderTopLeftRadius: responsiveSize(24),
    borderTopRightRadius: responsiveSize(24),
    borderBottomLeftRadius: responsiveSize(18),
    borderWidth: 1,
    borderColor: "rgba(90, 142, 207, 0.3)",
    overflow: "hidden",
  },
  modernOtherMessageBubble: {
    backgroundColor: "rgba(40, 40, 40, 0.7)",
    borderBottomLeftRadius: responsiveSize(6),
    borderTopLeftRadius: responsiveSize(24),
    borderTopRightRadius: responsiveSize(24),
    borderBottomRightRadius: responsiveSize(18),
    borderWidth: 1,
    borderColor: "rgba(90, 142, 207, 0.1)",
    overflow: "hidden",
  },
  avatarRing: {
    padding: 2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#5a8ecf",
    marginRight: 2,
    backgroundColor: "rgba(90,142,207,0.08)",
  },
  messageText: {
    fontSize: responsiveSize(14),
    lineHeight: responsiveSize(20),
  },
  messageTime: {
    fontSize: responsiveSize(10),
    marginTop: responsiveSize(4),
    alignSelf: "flex-end",
  },
  messageImage: {
    width: responsiveSize(200),
    height: responsiveSize(200),
    borderRadius: responsiveSize(8),
    marginTop: responsiveSize(4),
    marginBottom: responsiveSize(4),
  },
  imageMessageContainer: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: responsiveSize(250),
  },
  inputContainer: {
    paddingHorizontal: responsiveSize(16),
    paddingVertical: responsiveSize(12),
    borderTopWidth: 1,
    borderTopColor: "#333",
    backgroundColor: Colors.dark.background,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: responsiveSize(24),
    paddingHorizontal: responsiveSize(12),
    paddingVertical: responsiveSize(8),
    minHeight: responsiveSize(44),
    backgroundColor: Colors.dark.card,
  },
  attachButton: {
    width: responsiveSize(36),
    height: responsiveSize(36),
    borderRadius: responsiveSize(18),
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveSize(8),
    backgroundColor: Colors.dark.tint,
  },
  messageInput: {
    flex: 1,
    fontSize: responsiveSize(14),
    maxHeight: responsiveSize(100),
    minHeight: responsiveSize(20),
    marginHorizontal: responsiveSize(8),
    paddingVertical: responsiveSize(4),
  },
  sendButton: {
    width: responsiveSize(36),
    height: responsiveSize(36),
    borderRadius: responsiveSize(18),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.dark.tint,
    marginLeft: responsiveSize(6),
  },
  noChatSelected: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noChatText: {
    fontSize: responsiveSize(16),
    marginTop: responsiveSize(16),
    textAlign: "center",
  },
  sidebarButton: {
    padding: responsiveSize(8),
    borderRadius: responsiveSize(8),
    borderWidth: 1,
    borderColor: Colors.dark.tint,
  },
  sidebarButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sidebarButtonText: {
    marginLeft: responsiveSize(8),
    fontSize: responsiveSize(14),
    fontWeight: "600",
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: responsiveSize(20),
  },
  loadingContainer: {
    padding: responsiveSize(10),
  },
  loadingText: {
    fontSize: responsiveSize(14),
  },
  noResultsContainer: {
    padding: responsiveSize(10),
  },
  noResultsText: {
    fontSize: responsiveSize(14),
    textAlign: "center",
  },
  noUsersContainer: {
    padding: responsiveSize(10),
  },
  noUsersText: {
    fontSize: responsiveSize(14),
    textAlign: "center",
  },
  messagesLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: responsiveSize(40),
  },
  noMessagesText: {
    fontSize: responsiveSize(16),
    textAlign: "center",
    marginTop: responsiveSize(16),
  },
  typingIndicator: {
    position: "absolute",
    bottom: responsiveSize(10),
    left: responsiveSize(16),
    right: responsiveSize(16),
    alignItems: "center",
    zIndex: 10,
  },
  typingBubble: {
    paddingHorizontal: responsiveSize(12),
    paddingVertical: responsiveSize(8),
    borderRadius: responsiveSize(16),
    maxWidth: "70%",
  },
  typingText: {
    fontSize: responsiveSize(12),
    lineHeight: responsiveSize(16),
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: responsiveSize(10),
    width: responsiveSize(24),
    height: responsiveSize(24),
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewContainer: {
    position: "relative",
    width: "100%",
    height: responsiveSize(150),
    borderRadius: responsiveSize(12),
    marginBottom: responsiveSize(12),
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.95)",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalCloseButton: {
    position: "absolute",
    top: responsiveSize(50),
    right: responsiveSize(20),
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: responsiveSize(20),
    padding: responsiveSize(8),
  },
  selectUserContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: responsiveSize(40),
  },
  selectUserText: {
    fontSize: responsiveSize(16),
    marginTop: responsiveSize(16),
    textAlign: "center",
  },
  scrollToBottomButton: {
    position: "absolute",
    bottom: responsiveSize(100),
    right: responsiveSize(20),
    backgroundColor: Colors.dark.tint,
    borderRadius: responsiveSize(25),
    width: responsiveSize(50),
    height: responsiveSize(50),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default function ProtectedChat() {
  return (
    <ProtectedRoute>
      <ChatScreen />
    </ProtectedRoute>
  );
}
