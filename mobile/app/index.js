// Hello world
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Dimensions, Platform, ScrollView, ActivityIndicator, Image, Pressable, Modal, FlatList, Alert, Animated, Easing } from 'react-native';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Post from '../components/Post';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'expo-router';
import { useAuth } from '../store/authContext';
import { useNotifications } from './_layout';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Sidebar from '../components/Sidebar';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import { ToastAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserCard from '../components/UserCard';
import { API_BASE_URL } from '../config/server';
import GradientBackground from '../components/GradientBackground';

dayjs.extend(relativeTime);

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

function responsiveSize(size) {
  return Math.round(size * (width / 375));
}

const TABS = ['Home', 'Following', 'Hotrising', 'Your'];

const SAMPLE_POSTS = [
  {
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    username: 'Diogo',
    time: '4w',
    content: 'Educate yourself.\n\nWhen a question about a certain topic pops up, google it. Watch movies and documentaries. When something sparks your interest, read about it.\nRead, read, read.\nStudy, learn, and stimulate your brain.\nDon\'t just rely on the school system; *educate your beautiful mind.*',
    likes: '18.5k',
    comments: '102',
    shares: '2.6k',
  },
  {
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    username: 'Kate',
    time: '1w',
    content: 'Dear algorithm gods,\n\nPlease connect me with people who care about slow living, self-awareness, personal growth, tiny rituals, and honest reflection.\nI\'m tired of scrolling through content only to sell, impress, or perform.\nI want stories. I want softness. I want',
    likes: '9.2k',
    comments: '54',
    shares: '1.1k',
  },
];

const useTheme = () => Colors.dark;

function HomeScreen() {
  const [activeTab, setActiveTab] = useState('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef();
  const router = useRouter();
  const { user, refreshUserData } = useAuth();
  const [category, setCategory] = useState('news');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const [hiddenPostIds, setHiddenPostIds] = useState([]);
  const [hiddenUndoStack, setHiddenUndoStack] = useState([]);
  const [isWhistleFeed, setIsWhistleFeed] = useState(false);
  const [showCreateButton, setShowCreateButton] = useState(true);
  
  // Animated value for smooth button transition
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const buttonTranslateY = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const contentMarginTop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('hiddenPostIds');
      if (stored) setHiddenPostIds(JSON.parse(stored));
      const undoStack = await AsyncStorage.getItem('hiddenUndoStack');
      if (undoStack) setHiddenUndoStack(JSON.parse(undoStack));
    })();
  }, []);

  useEffect(() => {
    if (!user && (activeTab === 'Following' || activeTab === 'Your')) return;
    setPostsLoading(true);
    let url = '';
    if (isWhistleFeed) {
      url = `${API_BASE_URL}/posts/whistle-blow?category=${category}`;
    } else {
      if (activeTab === 'Home') {
        url = `${API_BASE_URL}/posts?category=${category}&excludeWhistle=true`;
      } else if (activeTab === 'Following') {
        url = `${API_BASE_URL}/posts/following/${user._id}?category=${category}&excludeWhistle=true`;
      } else if (activeTab === 'Hotrising') {
        url = `${API_BASE_URL}/posts/hotrising?category=${category}&excludeWhistle=true`;
      } else if (activeTab === 'Your') {
        url = `${API_BASE_URL}/users/${user._id}/posts?category=${category}&excludeWhistle=true`;
      }
    }
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setPosts(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        setPosts([]);
      })
      .finally(() => setPostsLoading(false));
  }, [activeTab, category, user, isWhistleFeed]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text) {
      setSearchResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(text)}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const { notifications, fetchNotifications } = useNotifications();
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;
  const [notifModal, setNotifModal] = useState(false);

  const openNotifModal = async () => {
    setNotifModal(true);
    if (unreadCount > 0 && user) {
      await fetch(`${API_BASE_URL}/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });
      fetchNotifications();
    }
  };

  const createSampleNotifications = async () => {
    if (!user?._id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/create-sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });

      if (response.ok) {
        fetchNotifications();
        ToastAndroid.show('Sample notifications created!', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Error creating sample notifications:', error);
    }
  };

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPost, setMenuPost] = useState(null);
  const menuPostRef = useRef(null);
  const [savingImage, setSavingImage] = useState(false);

  const handleMenu = (post, ref) => {
    setMenuPost(post);
    menuPostRef.current = ref.current;
    setMenuVisible(true);
  };

  const handleFollowAuthor = async () => {
    if (!user || !menuPost?.author?._id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${menuPost.author._id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: user._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to follow');
      ToastAndroid.show('Followed!', ToastAndroid.SHORT);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to follow');
    } finally {
      setMenuVisible(false);
    }
  };
  const handleSaveAsImage = async () => {
    if (!menuPostRef.current) return;
    setSavingImage(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Permission denied');
      const uri = await captureRef(menuPostRef.current, { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      ToastAndroid.show('Saved to gallery!', ToastAndroid.SHORT);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save image');
    } finally {
      setSavingImage(false);
      setMenuVisible(false);
    }
  };
  const handleCopyText = () => {
    Clipboard.setString(menuPost?.content || '');
    ToastAndroid.show('Copied!', ToastAndroid.SHORT);
    setMenuVisible(false);
  };

  const handleHideNote = async () => {
    if (!menuPost) return;
    const id = menuPost._id || menuPost.id;
    setHiddenPostIds(prev => {
      const updated = [...prev, id];
      AsyncStorage.setItem('hiddenPostIds', JSON.stringify(updated));
      return updated;
    });
    setHiddenUndoStack(prev => {
      const updated = [...prev, id];
      AsyncStorage.setItem('hiddenUndoStack', JSON.stringify(updated));
      return updated;
    });
    setMenuVisible(false);
  };
  const handleUndoHide = () => {
    setHiddenUndoStack(prev => {
      if (prev.length === 0) return prev;
      const updatedStack = [...prev];
      const lastId = updatedStack.pop();
      setHiddenPostIds(hiddenIds => {
        const updatedHidden = hiddenIds.filter(pid => pid !== lastId);
        AsyncStorage.setItem('hiddenPostIds', JSON.stringify(updatedHidden));
        return updatedHidden;
      });
      AsyncStorage.setItem('hiddenUndoStack', JSON.stringify(updatedStack));
      return updatedStack;
    });
  };

  const isOwner = (post) => {
    if (!user || !post) return false;
    if (!post.anonymous) {
      return String(post.author?._id) === String(user._id);
    } else {
      return user.anonymousId && user.anonymousId === post.anonymousId;
    }
  };

  const handleDeletePost = async () => {
    if (!menuPost) return;
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/posts/${menuPost._id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(
                menuPost.anonymous
                  ? { anonymousId: user.anonymousId }
                  : { userId: user._id }
              ),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete');
            setPosts(posts => posts.filter(p => (p._id || p.id) !== menuPost._id));
            ToastAndroid.show('Post deleted', ToastAndroid.SHORT);
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete post');
          } finally {
            setMenuVisible(false);
          }
        }
      }
    ]);
  };

  const postsToShow = searchQuery ? (Array.isArray(searchResults) ? searchResults : []) : posts;

  const theme = useTheme();

  const clearAllNotifications = async () => {
    Alert.alert('Clear All Notifications', 'Are you sure you want to clear all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/notifications/clear-all`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user._id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to clear notifications');
            fetchNotifications();
            ToastAndroid.show('All notifications cleared!', ToastAndroid.SHORT);
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to clear notifications');
          }
        },
      },
    ]);
  };

  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const maxScroll = 60; // Further reduced for ultra-smooth transition
    const threshold = 5; // Even lower threshold for immediate response
    
    // Calculate progress with ultra-smooth curve
    const rawProgress = Math.max(0, Math.min(1, (scrollY - threshold) / (maxScroll - threshold)));
    
    // Apply double smoothstep for maximum smoothness
    const smoothProgress = rawProgress * rawProgress * (3 - 2 * rawProgress);
    const ultraSmoothProgress = smoothProgress * smoothProgress * (3 - 2 * smoothProgress);
    
    // Ultra-smooth opacity transition with gentle curve
    const opacity = Math.max(0, 1 - Math.pow(ultraSmoothProgress, 0.8));
    
    // Gentle translateY with minimal movement
    const translateY = -ultraSmoothProgress * 40; // Reduced to 40px for gentleness
    
    // Ultra-gentle scale animation
    const scale = Math.max(0.75, 1 - ultraSmoothProgress * 0.2); // Reduced scale factor
    
    // Smooth content margin transition to fill the button space
    const marginTop = -ultraSmoothProgress * 70; // Move feed content up to fill button space
    
    // Use direct value setting for instant response on transform properties
    buttonOpacity.setValue(opacity);
    buttonTranslateY.setValue(translateY);
    buttonScale.setValue(scale);
    
    // Use ultra-gentle timing for layout animations
    Animated.timing(contentMarginTop, {
      toValue: marginTop,
      duration: 100, // Slightly longer for ultra-smooth feel
      useNativeDriver: false,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Custom bezier for maximum smoothness
    }).start();
    
    // Update visibility state with wider hysteresis to prevent any flickering
    if (scrollY > threshold + 10) {
      setShowCreateButton(false);
    } else if (scrollY < threshold - 10) {
      setShowCreateButton(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Fixed Header - Always visible and never affected by scroll */}
      <View style={[styles.fixedHeader, { backgroundColor: theme.background }]}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.headerLogo}
          resizeMode="cover"
        />
        <TextInput
          style={[styles.searchBar, { backgroundColor: theme.card, color: theme.text }]}
          placeholder="Search"
          placeholderTextColor={theme.icon}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity onPress={openNotifModal} style={styles.notifBell}>
          {unreadCount > 0 ? (
            <GradientBackground style={styles.notifBellGradient}>
              <MaterialIcons name="notifications" size={28} color="white" />
            </GradientBackground>
          ) : (
            <MaterialIcons name="notifications" size={28} color={theme.icon} />
          )}
          {unreadCount > 0 && (
            <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSidebarOpen(true)}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.profileIconImg} />
          ) : (
            <View style={styles.profileIcon}>
              <GradientBackground style={styles.profileIconGradient}>
                <Text style={styles.profileIconText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                </Text>
              </GradientBackground>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Fixed tabs and toggles - Always visible below header */}
      {!searchQuery && !isWhistleFeed && (
        <View style={[styles.fixedTabsContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.tabBarWrapper, { backgroundColor: theme.background }]}>
            <View style={styles.tabBar}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab, 
                    { 
                      backgroundColor: activeTab === tab ? theme.accentColor : 'transparent', 
                      borderColor: theme.divider 
                    }
                  ]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.tabText,
                    {
                      color: activeTab === tab ? '#fff' : theme.textSecondary,
                      fontWeight: activeTab === tab ? 'bold' : '600'
                    }
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 1, backgroundColor: theme.divider, opacity: 0.2, width: '100%', marginTop: responsiveSize(1) }} />
          </View>
          <View style={styles.toggleBarWrapper}>
            <View style={styles.toggleBar}>
              <Pressable
                style={[styles.toggleBtn]}
                onPress={() => setCategory('news')}
              >
                {category === 'news' ? (
                  <GradientBackground style={styles.toggleBtnGradient}>
                    <Text style={[styles.toggleText, { color: '#fff' }]}>NEWS</Text>
                  </GradientBackground>
                ) : (
                  <Text style={[styles.toggleText, { color: theme.textSecondary }]}>NEWS</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.toggleBtn]}
                onPress={() => setCategory('culture')}
              >
                {category === 'culture' ? (
                  <GradientBackground style={styles.toggleBtnGradient}>
                    <Text style={[styles.toggleText, { color: '#fff' }]}>CULTURE</Text>
                  </GradientBackground>
                ) : (
                  <Text style={[styles.toggleText, { color: theme.textSecondary }]}>CULTURE</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
      
      {/* Scrollable content area - starts below fixed header and tabs */}
      <View style={[
        styles.scrollableContent,
        (!searchQuery && !isWhistleFeed) ? styles.scrollableContentWithTabs : styles.scrollableContentWithoutTabs
      ]}>
        {/* Create New Post button - Animated */}
        <Animated.View 
          style={{ 
            padding: 10,
            opacity: buttonOpacity,
            transform: [
              { translateY: buttonTranslateY },
              { scale: buttonScale }
            ],
          }}
        >
          <TouchableOpacity onPress={() => router.push('/choose-post-type')}>
            <GradientBackground 
              style={{ 
                height: 50, 
                borderRadius: 12, 
                justifyContent: 'center', 
                alignItems: 'center', 
                marginTop: 6,
                marginBottom: 0 
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 * 0.8 }}>Share Your Thoughts 💭</Text>
            </GradientBackground>
          </TouchableOpacity>
        </Animated.View>

        {/* Feed content with animated margin to fill button space */}
        <Animated.View style={{ flex: 1, marginTop: contentMarginTop }}>
          {!searchQuery && isWhistleFeed && (
            <View style={[styles.whistleFeedHeader, { backgroundColor: theme.background }]}>
              <Text style={[styles.whistleFeedTitle, { color: theme.text }]}>Whistle Blowing Feed</Text>
              <Text style={[styles.whistleFeedSubtitle, { color: theme.textSecondary }]}>Anonymous reports and disclosures</Text>
            </View>
          )}
          
          <FlatList
            style={styles.feed}
            data={!searchQuery ? postsToShow : []}
            keyExtractor={(item) => item._id || item.id || Math.random().toString()}
            onScroll={handleScroll}
            scrollEventThrottle={8}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={5}
            getItemLayout={null}
            renderItem={({ item: post }) => {
              const postId = post._id || post.id;
              const postRef = React.createRef();
              const isHidden = hiddenPostIds.includes(postId);
              const isUndoable = hiddenUndoStack.length > 0 && hiddenUndoStack[hiddenUndoStack.length - 1] === postId;

              if (isHidden) {
                return (
                  <View style={{ padding: 16, alignItems: 'center', backgroundColor: theme.card, borderRadius: 12, margin: 8 }}>
                    <MaterialIcons name="visibility-off" size={28} color={theme.text} style={{ marginBottom: 8 }} />
                    <Text style={{ color: theme.text, fontSize: 16 * 0.8, marginBottom: 8 }}>Note hidden</Text>
                    {isUndoable && (
                      <TouchableOpacity onPress={handleUndoHide} style={{ backgroundColor: theme.divider, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 8 }}>
                        <Text style={{ color: theme.text }}>Undo</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={{ color: theme.textSecondary, fontSize: 13 * 0.8, marginBottom: 4 }}>We'll use this feedback to improve your feed.</Text>
                    <TouchableOpacity style={{ marginTop: 4 }}><Text style={{ color: theme.textSecondary, fontSize: 13 * 0.8 }}>Show fewer notes like this</Text></TouchableOpacity>
                    <TouchableOpacity style={{ marginTop: 4 }}><Text style={{ color: theme.textSecondary, fontSize: 13 * 0.8 }}>Snooze {post.author?.name || 'author'} for 30 days</Text></TouchableOpacity>
                    <TouchableOpacity style={{ marginTop: 4 }}><Text style={{ color: theme.textSecondary, fontSize: 13 * 0.8 }}>More options</Text></TouchableOpacity>
                  </View>
                );
              }

              return (
                <ViewShot ref={postRef} style={{ marginBottom: 2 }}>
                  <Post
                    {...post}
                    anonymous={post.anonymous}
                    anonymousId={post.anonymousId}
                    onMenu={() => handleMenu(post, postRef)}
                    onDelete={deletedId => setPosts(posts => posts.filter(p => (p._id || p.id) !== deletedId))}
                  />
                </ViewShot>
              );
            }}
            ListHeaderComponent={() => (
              <>
                {loading && searchQuery ? (
                  <View style={{ alignItems: 'center', marginTop: 24 }}>
                    <ActivityIndicator size="large" color={Colors.light.tint} />
                  </View>
                ) : postsLoading && !searchQuery ? (
                  <View style={{ alignItems: 'center', marginTop: 24 }}>
                    <ActivityIndicator size="large" color={Colors.light.tint} />
                  </View>
                ) : null}
                {(!loading && searchQuery && postsToShow.length === 0) && (
                  <View style={{ alignItems: 'center', marginTop: 24 }}>
                    <Text style={{ color: theme.icon, fontSize: 16 * 0.8 }}>No results found.</Text>
                  </View>
                )}
                {(!searchQuery && !postsLoading && postsToShow.length === 0) && (
                  <View style={{ alignItems: 'center', marginTop: 24 }}>
                    <Text style={{ color: theme.icon, fontSize: 16 * 0.8 }}>No posts found.</Text>
                  </View>
                )}
                {searchQuery && Array.isArray(searchResults) && searchResults.length > 0 && searchResults[0].username && searchResults[0].avatar !== undefined && (
                  searchResults.map((user, idx) => (
                    <UserCard key={user._id || idx} user={user} onPress={() => router.push(`/user/${user._id}`)} />
                  ))
                )}
              </>
            )}
            ListFooterComponent={() => <View style={{ height: height * 0.18 }} />}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </View>
      
      <Modal visible={notifModal} animationType="slide" onRequestClose={() => setNotifModal(false)}>
        <View style={[styles.notifModalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.notifModalHeader}>
            <Text style={[styles.notifModalTitle, { color: theme.text }]}>Notifications</Text>
            <View style={styles.notifModalActions}>
              {notifications.length > 0 && (
                <TouchableOpacity
                  onPress={clearAllNotifications}
                  style={styles.clearAllBtn}
                >
                  <GradientBackground style={styles.clearAllBtnGradient}>
                    <Text style={[styles.clearAllBtnText, { color: '#fff' }]}>Clear All</Text>
                  </GradientBackground>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setNotifModal(false)} style={styles.closeModalBtn}>
                <MaterialIcons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={notifications}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.notifItem, { backgroundColor: item.read ? 'transparent' : theme.card }]}
                onPress={() => {
                  setNotifModal(false);
                  if (item.type === 'whistle_review' && item.metadata?.submissionId) {
                    router.push(`/whistle-approvals?submissionId=${item.metadata.submissionId}`);
                  } else if (item.postId) {
                    router.push(`/posts/${item.postId}`);
                  } else if (item.fromUser) {
                    router.push(`/user/${item.fromUser._id}`);
                  }
                }}
              >
                <MaterialIcons
                  name={item.type === 'reply' ? 'reply' : item.type === 'like' ? 'favorite' : item.type === 'comment' ? 'comment' : item.type === 'follow' ? 'person-add' : 'notifications'}
                  size={22}
                  color={item.read ? theme.textSecondary : theme.tint}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.notifMsg, { color: item.read ? theme.textSecondary : theme.text }, !item.read && { fontWeight: 'bold' }]}>
                    {item.message}
                  </Text>
                  <Text style={[styles.notifTime, { color: theme.textSecondary }]}>
                    {dayjs(item.createdAt).fromNow()}
                  </Text>
                </View>
                {!item.read && (
                  <View style={[styles.unreadDot, { backgroundColor: theme.tint }]} />
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={true}
            style={styles.notificationsList}
            contentContainerStyle={styles.notificationsContent}
            ListEmptyComponent={
              <View style={styles.emptyNotifications}>
                <MaterialIcons name="notifications-none" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyNotificationsText, { color: theme.textSecondary }]}>
                  No notifications yet
                </Text>
                <Text style={[styles.emptyNotificationsSubtext, { color: theme.textSecondary }]}>
                  You'll see notifications here when someone interacts with your content
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setMenuVisible(false)}>
          <View style={{ position: 'absolute', right: 16, top: 180, backgroundColor: '#222', borderRadius: 16, padding: 16, minWidth: 220, elevation: 8 }}>
            {menuPost && (
              <>
                {isOwner(menuPost) && (
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} onPress={handleDeletePost}>
                    <MaterialIcons name="delete" size={22} color="#ff4444" style={{ marginRight: 12 }} />
                    <Text style={{ color: '#ff4444', fontSize: 16 * 0.8 }}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} onPress={handleFollowAuthor}>
                  <MaterialIcons name="person-add-alt" size={22} color="#fff" style={{ marginRight: 12 }} />
                  <Text style={{ color: '#fff', fontSize: 16 * 0.8 }}>Follow {menuPost?.author?.name || ''}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} onPress={handleSaveAsImage} disabled={savingImage}>
                  <MaterialIcons name="download" size={22} color="#fff" style={{ marginRight: 12 }} />
                  <Text style={{ color: '#fff', fontSize: 16 * 0.8 }}>{savingImage ? 'Saving...' : 'Save as image'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} onPress={handleCopyText}>
                  <MaterialIcons name="content-copy" size={22} color="#fff" style={{ marginRight: 12 }} />
                  <Text style={{ color: '#fff', fontSize: 16 * 0.8 }}>Copy text</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} onPress={handleHideNote}>
                  <MaterialIcons name="visibility-off" size={22} color="#fff" style={{ marginRight: 12 }} />
                  <Text style={{ color: '#fff', fontSize: 16 * 0.8 }}>Hide note</Text>
                </TouchableOpacity>
                <View style={{ height: 1, backgroundColor: '#444', marginVertical: 8 }} />
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <MaterialIcons name="volume-off" size={22} color="#ff4444" style={{ marginRight: 12 }} />
                  <Text style={{ color: '#ff4444', fontSize: 16 * 0.8 }}>Mute author</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <MaterialIcons name="block" size={22} color="#ff4444" style={{ marginRight: 12 }} />
                  <Text style={{ color: '#ff4444', fontSize: 16 * 0.8 }}>Block</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="report" size={22} color="#ff4444" style={{ marginRight: 12 }} />
                  <Text style={{ color: '#ff4444', fontSize: 16 * 0.8 }}>Report</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
      
      <View style={styles.taskBarContainer}>
        <View style={styles.taskBar}>
          <TouchableOpacity
            style={[styles.taskBarIcon]}
            onPress={() => {
              setIsWhistleFeed(false);
              setActiveTab('Home');
            }}
          >
            {!isWhistleFeed && activeTab === 'Home' ? (
              <GradientBackground style={styles.taskBarIconGradient}>
                <MaterialIcons
                  name="home"
                  size={responsiveSize(24)}
                  color="white"
                />
              </GradientBackground>
            ) : (
              <MaterialIcons
                name="home"
                size={responsiveSize(24)}
                color={theme.icon}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.taskBarIcon]}
            onPress={() => {
              setIsWhistleFeed(true);
            }}
          >
            {isWhistleFeed ? (
              <GradientBackground style={styles.taskBarIconGradient}>
                <MaterialIcons
                  name="sports"
                  size={responsiveSize(24)}
                  color="white"
                />
              </GradientBackground>
            ) : (
              <MaterialIcons
                name="sports"
                size={responsiveSize(24)}
                color={theme.icon}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.taskBarIcon}
            onPress={() => router.push('/choose-post-type')}
          >
            <View style={[styles.instagramCreateIcon, {
              borderColor: '#CCCCCC',
              backgroundColor: 'transparent',
              transform: [{ scale: 1.2 }],
            }]}>
              <MaterialIcons
                name="add"
                size={responsiveSize(22)}
                color="#CCCCCC"
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.taskBarIcon}
            onPress={() => router.push('/chat')}
          >
            <MaterialIcons
              name="chat"
              size={responsiveSize(24)}
              color={theme.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.taskBarIcon}
            onPress={() => router.push('/communities')}
          >
            <MaterialIcons
              name="people"
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
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSize(16),
    paddingTop: Platform.OS === 'ios' ? responsiveSize(48) : responsiveSize(32),
    paddingBottom: responsiveSize(12),
    backgroundColor: Colors.dark.background,
    gap: responsiveSize(8),
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  fixedTabsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? responsiveSize(108) : responsiveSize(88), // Below the fixed header
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: Colors.dark.background,
  },
  scrollableContent: {
    flex: 1,
    // Dynamic margin based on whether tabs are visible
  },
  scrollableContentWithTabs: {
    marginTop: Platform.OS === 'ios' ? responsiveSize(180) : responsiveSize(160), // Account for fixed header + tabs height
  },
  scrollableContentWithoutTabs: {
    marginTop: Platform.OS === 'ios' ? responsiveSize(120) : responsiveSize(100), // Account for fixed header only
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSize(16),
    paddingTop: Platform.OS === 'ios' ? responsiveSize(48) : responsiveSize(32),
    paddingBottom: responsiveSize(12),
    backgroundColor: Colors.dark.background,
    gap: responsiveSize(8),
  },
  headerLogo: {
    width: responsiveSize(48),
    height: responsiveSize(48),
    borderRadius: responsiveSize(24),
  },
  searchBar: {
    flex: 1,
    height: responsiveSize(36),
    backgroundColor: '#f0f0f0',
    borderRadius: responsiveSize(18),
    paddingHorizontal: responsiveSize(16),
    fontSize: responsiveSize(16 * 0.8),
    marginHorizontal: responsiveSize(6),
    color: Colors.light.text,
  },
  profileIcon: {
    width: responsiveSize(32 * 0.8),
    height: responsiveSize(32 * 0.8),
    borderRadius: responsiveSize(16 * 0.8),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  profileIconGradient: {
    width: responsiveSize(32 * 0.8),
    height: responsiveSize(32 * 0.8),
    borderRadius: responsiveSize(16 * 0.8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    color: '#fff',
    fontSize: responsiveSize(14 * 0.8),
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileIconImg: {
    width: responsiveSize(32 * 0.8),
    height: responsiveSize(32 * 0.8),
    borderRadius: responsiveSize(16 * 0.8),
    resizeMode: 'cover',
  },
  tabBarWrapper: {
    borderBottomWidth: 0,
    backgroundColor: Colors.dark.background,
    paddingVertical: responsiveSize(2),
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSize(12),
    paddingVertical: responsiveSize(2),
    justifyContent: 'space-between',
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingHorizontal: responsiveSize(8),
    paddingVertical: responsiveSize(6),
    borderRadius: responsiveSize(12),
    marginHorizontal: responsiveSize(2),
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTab: {
    backgroundColor: Colors.dark.tint,
    shadowColor: Colors.dark.tint,
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    borderColor: Colors.dark.tint,
  },
  tabText: {
    fontSize: responsiveSize(11 * 0.8),
    color: Colors.dark.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  tabGradient: {
    flex: 1,
    paddingHorizontal: responsiveSize(8),
    paddingVertical: responsiveSize(6),
    borderRadius: responsiveSize(12),
    marginHorizontal: responsiveSize(2),
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feed: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: responsiveSize(24),
    fontWeight: 'bold',
    marginBottom: responsiveSize(24),
  },
  taskBarSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 10,
    paddingBottom: responsiveSize(12),
    backgroundColor: 'transparent',
  },
  taskBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.dark.background,
    paddingBottom: responsiveSize(12 * 0.8),
    zIndex: 10,
  },
  taskBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderTopLeftRadius: responsiveSize(20 * 0.8),
    borderTopRightRadius: responsiveSize(20 * 0.8),
    height: responsiveSize(70 * 0.8),
    width: '100%',
    paddingHorizontal: responsiveSize(20 * 0.8),
    paddingVertical: responsiveSize(12 * 0.8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: responsiveSize(8 * 0.8),
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  taskBarIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSize(8 * 0.8),
    borderRadius: responsiveSize(8 * 0.8),
  },
  taskBarIconGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSize(8 * 0.8),
    paddingHorizontal: responsiveSize(12 * 0.8),
    borderRadius: responsiveSize(8 * 0.8),
    minWidth: responsiveSize(40 * 0.8),
    minHeight: responsiveSize(40 * 0.8),
  },
  instagramCreateIcon: {
    width: responsiveSize(32 * 0.8),
    height: responsiveSize(32 * 0.8),
    borderWidth: 2,
    borderRadius: responsiveSize(8 * 0.8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTaskBarIcon: {
    backgroundColor: Colors.dark.tint,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  fab: {
    position: 'absolute',
    bottom: height * 0.08,
    right: responsiveSize(32),
    backgroundColor: Colors.light.tint,
    width: responsiveSize(56),
    height: responsiveSize(56),
    borderRadius: responsiveSize(28),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: responsiveSize(4),
    elevation: 10,
  },
  toggleBarWrapper: {
    alignItems: 'center',
    marginTop: responsiveSize(4),
    marginBottom: responsiveSize(4),
    paddingHorizontal: responsiveSize(8),
  },
  toggleBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.dark.tint,
    borderRadius: responsiveSize(16),
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  toggleBtn: {
    paddingHorizontal: responsiveSize(18),
    paddingVertical: responsiveSize(6),
    backgroundColor: 'transparent',
    minWidth: responsiveSize(65),
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnGradient: {
    paddingHorizontal: responsiveSize(18),
    paddingVertical: responsiveSize(6),
    minWidth: responsiveSize(65),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: responsiveSize(15),
  },
  toggleBtnActive: {
    backgroundColor: Colors.dark.tint,
  },
  toggleText: {
    fontSize: responsiveSize(11 * 0.8),
    color: Colors.dark.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notifBell: {
    marginRight: 8,
    position: 'relative',
  },
  notifBellGradient: {
    borderRadius: responsiveSize(20),
    padding: responsiveSize(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff6600',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 11 * 0.8,
    fontWeight: 'bold',
  },
  notifModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 48,
  },
  notifModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notifModalTitle: {
    fontSize: 22 * 0.8,
    fontWeight: 'bold',
  },
  notifModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearAllBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearAllBtnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllBtnText: {
    fontSize: 14 * 0.8,
    fontWeight: 'bold',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    paddingBottom: responsiveSize(100),
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notifMsg: {
    fontSize: 15 * 0.8,
    color: '#222',
  },
  notifTime: {
    fontSize: 12 * 0.8,
    color: '#888',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyNotifications: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyNotificationsText: {
    fontSize: 18 * 0.8,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyNotificationsSubtext: {
    fontSize: 14 * 0.8,
    marginTop: 8,
    textAlign: 'center',
  },
  closeModalBtn: {
    alignSelf: 'flex-end',
    marginTop: 16,
  },
  whistleFeedHeader: {
    paddingHorizontal: responsiveSize(16),
    paddingVertical: responsiveSize(12),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  whistleFeedTitle: {
    fontSize: responsiveSize(20 * 0.8),
    fontWeight: 'bold',
    marginBottom: responsiveSize(4),
  },
  whistleFeedSubtitle: {
    fontSize: responsiveSize(14 * 0.8),
  },
});

export default function ProtectedHome() {
  return (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  );
}