import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    Modal,
    Pressable,
    FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../store/authContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { API_BASE_URL } from '../../config/server';
import Post from '../../components/Post';
import CommunityRequestModal from '../../components/CommunityRequestModal';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import { ToastAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientBackground from '../../components/GradientBackground';

export default function CommunityDetailScreen() {
    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]); 
    const [selectedCategory, setSelectedCategory] = useState(''); 
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);

    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPost, setMenuPost] = useState(null);
    const menuPostRef = useRef(null);
    const [savingImage, setSavingImage] = useState(false);
    const postRefs = useRef({});

    const { user } = useAuth();
    const router = useRouter();
    const { id } = useLocalSearchParams();

    useEffect(() => {
        fetchCommunityData();
        fetchCategories(); 
    }, [id]);

    useEffect(() => {
        if (community) {
            fetchPosts();
        }
    }, [selectedCategory, community]);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/communities/${id}/categories`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            } else {
                setCategories([]);
            }
        } catch (err) {
            setCategories([]);
        }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            let url = `${API_BASE_URL}/communities/${id}/posts`;
            if (selectedCategory && selectedCategory !== 'all') {
                url += `?category=${encodeURIComponent(selectedCategory)}`;
            }
            const postsRes = await fetch(url);
            if (postsRes.ok) {
                const postsData = await postsRes.json();
                const postsArray = postsData.posts || postsData || [];
                setPosts(postsArray);
            } else {
                setPosts([]);
            }
        } catch (error) {
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCommunityData = async () => {
        try {
            setLoading(true);
            const communityRes = await fetch(`${API_BASE_URL}/communities/${id}`);
            if (communityRes.ok) {
                const communityData = await communityRes.json();
                setCommunity(communityData);
            }
        } catch (error) {
            setCommunity(null);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchCommunityData();
        setRefreshing(false);
    };

    const handleJoinCommunity = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/communities/${id}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    userId: user._id,
                    isPrivate: community?.privacy === 'private'
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (community?.privacy === 'private') {
                    Alert.alert('Request Sent', 'Your join request has been sent to the community admins for approval.');
                } else {
                    Alert.alert('Success', 'Joined community successfully!');
                }
                fetchCommunityData();
            } else {
                const error = await response.json();
                Alert.alert('Error', error.message || 'Failed to join community');
            }
        } catch (error) {
            console.error('Error joining community:', error);
            Alert.alert('Error', 'Failed to join community');
        }
    };



    const isMember = () => {
        if (!community || !user) return false;
        const userId = user._id.toString();
        const members = community.members || [];
        const creator = community.creator ? (typeof community.creator === 'object' ? community.creator._id : community.creator).toString() : null;

        const isInMembers = members.some(member => {
            const memberId = typeof member === 'object' ? member._id : member;
            return memberId.toString() === userId;
        });

        const isCreator = creator === userId;

        return isInMembers || isCreator;
    };

    const isAdmin = () => {
        if (!community || !user) return false;
        const userId = user._id.toString();
        const admins = community.admins || [];
        const creator = community.creator ? (typeof community.creator === 'object' ? community.creator._id : community.creator).toString() : null;

        const isInAdmins = admins.some(admin => {
            const adminId = typeof admin === 'object' ? admin._id : admin;
            return adminId.toString() === userId;
        });

        const isCreator = creator === userId;

        return isInAdmins || isCreator;
    };

    const canViewPosts = () => {
        return community?.privacy === 'public' || isMember();
    };

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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000000" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Loading community...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!community) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000000" />
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color="#666" />
                    <Text style={styles.errorTitle}>Community Not Found</Text>
                    <Text style={styles.errorSubtitle}>This community may have been deleted or doesn't exist.</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <GradientBackground style={styles.backButtonGradient}>
                            <Text style={styles.backButtonText}>Go Back</Text>
                        </GradientBackground>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {community.name}
                </Text>
                <View style={styles.headerActions}>
                    {isAdmin() && (
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => router.push(`/community/${id}/settings`)}
                        >
                            <GradientBackground style={styles.settingsButtonGradient}>
                                <MaterialIcons name="settings" size={22} color="#fff" />
                            </GradientBackground>
                        </TouchableOpacity>
                    )}
                    {isAdmin() && community?.privacy === 'private' && (
                        <TouchableOpacity
                            style={styles.headerRequestsButton}
                            onPress={() => setShowRequestModal(true)}
                        >
                            <GradientBackground style={styles.requestsButtonGradient}>
                                <MaterialIcons name="group-add" size={20} color="#fff" />
                            </GradientBackground>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.createPostButton}
                        onPress={() => setShowCreateMenu(true)}
                    >
                        <GradientBackground style={styles.createPostButtonGradient}>
                            <MaterialIcons name="add" size={24} color="#fff" />
                        </GradientBackground>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.bannerContainer}>
                    {community.banner ? (
                        <Image source={{ uri: community.banner }} style={styles.bannerImage} />
                    ) : (
                        <View style={styles.bannerPlaceholder}>
                            <MaterialIcons name="image" size={48} color="#666" />
                        </View>
                    )}
                </View>

                <View style={styles.communityInfo}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={
                                community.avatar
                                    ? { uri: community.avatar }
                                    : require('../../assets/images/icon.png')
                            }
                            style={styles.avatar}
                        />
                        {community.privacy === 'private' && (
                            <View style={styles.privacyBadge}>
                                <MaterialIcons name="lock" size={12} color="#fff" />
                            </View>
                        )}
                    </View>

                    <View style={styles.communityDetails}>
                        <Text style={styles.communityName}>{community.name}</Text>
                        <Text style={styles.communityCategory}>{community.category}</Text>
                        <Text style={styles.communityStats}>
                            {community.memberCount} members • {community.postCount} posts
                        </Text>
                    </View>

                    <View style={styles.actionButtons}>
                        {isAdmin() && (
                            <View style={styles.adminBadge}>
                                <GradientBackground style={styles.adminBadgeGradient}>
                                    <MaterialIcons name="admin-panel-settings" size={16} color="#fff" />
                                    <Text style={styles.adminText}>Admin</Text>
                                </GradientBackground>
                            </View>
                        )}

                        {!isMember() ? (
                            <TouchableOpacity
                                style={styles.joinButton}
                                onPress={handleJoinCommunity}
                            >
                                <GradientBackground style={styles.joinButtonGradient}>
                                    <Text style={styles.joinButtonText}>Join</Text>
                                </GradientBackground>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('posts')}
                    >
                        {activeTab === 'posts' ? (
                            <GradientBackground style={styles.activeTabGradient}>
                                <Text style={styles.activeTabText}>Posts</Text>
                            </GradientBackground>
                        ) : (
                            <Text style={styles.tabText}>Posts</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('about')}
                    >
                        {activeTab === 'about' ? (
                            <GradientBackground style={styles.activeTabGradient}>
                                <Text style={styles.activeTabText}>About</Text>
                            </GradientBackground>
                        ) : (
                            <Text style={styles.tabText}>About</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {activeTab === 'posts' ? (
                    <View style={styles.postsContainer}>
                        {!canViewPosts() ? (
                            <View style={styles.privateContainer}>
                                <MaterialIcons name="lock" size={64} color="#666" />
                                <Text style={styles.privateTitle}>Private Community</Text>
                                <Text style={styles.privateSubtitle}>
                                    Join this community to see posts and participate in discussions.
                                </Text>
                                <TouchableOpacity
                                    style={styles.joinPrivateButton}
                                    onPress={handleJoinCommunity}
                                >
                                    <GradientBackground style={styles.joinPrivateButtonGradient}>
                                        <Text style={styles.joinPrivateButtonText}>Join Community</Text>
                                    </GradientBackground>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                {/* Category Hotbar */}
                                {categories && categories.length > 0 && (
                                    <View style={{ paddingVertical: 6, paddingLeft: 10 }}>
                                        <FlatList
                                            data={[{ name: 'All', icon: '' }, ...categories]}
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            keyExtractor={item => item.name}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={styles.categoryButton}
                                                    onPress={() => setSelectedCategory(item.name === 'All' ? '' : item.name)}
                                                >
                                                    {(selectedCategory === item.name || (item.name === 'All' && !selectedCategory)) ? (
                                                        <GradientBackground style={styles.categoryButtonGradient}>
                                                            {item.icon ? (
                                                                <MaterialIcons name={item.icon} size={18} color="#fff" style={{ marginRight: 6 }} />
                                                            ) : null}
                                                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.name}</Text>
                                                        </GradientBackground>
                                                    ) : (
                                                        <View style={styles.categoryButtonInactive}>
                                                            {item.icon ? (
                                                                <MaterialIcons name={item.icon} size={18} color="#fff" style={{ marginRight: 6 }} />
                                                            ) : null}
                                                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.name}</Text>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </View>
                                )}
                                {posts.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <MaterialIcons name="post-add" size={64} color="#666" />
                                        <Text style={styles.emptyTitle}>No Posts Yet</Text>
                                        <Text style={styles.emptySubtitle}>
                                            Be the first to share something in this community!
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.createFirstPostButton}
                                            onPress={() => router.push(`/create-post?community=${id}`)}
                                        >
                                            <GradientBackground style={styles.createFirstPostButtonGradient}>
                                                <Text style={styles.createFirstPostButtonText}>Create Post</Text>
                                            </GradientBackground>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.postsList}>
                                        {Array.isArray(posts) && posts.map((post) => {
                                            const ref = postRefs.current[post._id] || React.createRef();
                                            postRefs.current[post._id] = ref;
                                            return (
                                                <ViewShot key={post._id} ref={ref} style={{ marginBottom: 0 }}>
                                                    <Post
                                                        _id={post._id}
                                                        author={post.author}
                                                        createdAt={post.createdAt}
                                                        content={post.content}
                                                        title={post.title}
                                                        likes={post.likes}
                                                        shares={post.shares}
                                                        reposts={post.reposts}
                                                        comments={post.comments}
                                                        image={post.image}
                                                        proofImages={post.proofImages}
                                                        anonymous={post.anonymous}
                                                        anonymousId={post.anonymousId}
                                                        repostOf={post.repostOf}
                                                        hashtags={post.hashtags}
                                                        onMenu={() => handleMenu(post, ref)}
                                                        onDelete={deletedId => setPosts(posts => posts.filter(p => (p._id || p.id) !== deletedId))}
                                                    />
                                                </ViewShot>
                                            );
                                        })}
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                ) : (
                    <View style={styles.aboutContainer}>
                        <View style={styles.aboutSection}>
                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.description}>
                                {community.description || 'No description available'}
                            </Text>
                        </View>

                        {community.tags && community.tags.length > 0 && (
                            <View style={styles.aboutSection}>
                                <Text style={styles.sectionTitle}>Tags</Text>
                                <View style={styles.tagsContainer}>
                                    {community.tags.map((tag, index) => (
                                        <View key={index} style={styles.tag}>
                                            <Text style={styles.tagText}>#{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {community.rules && community.rules.length > 0 && (
                            <View style={styles.aboutSection}>
                                <Text style={styles.sectionTitle}>Community Rules</Text>
                                {community.rules.map((rule, index) => (
                                    <View key={index} style={styles.ruleItem}>
                                        <Text style={styles.ruleNumber}>{index + 1}.</Text>
                                        <Text style={styles.ruleText}>{rule}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={styles.aboutSection}>
                            <Text style={styles.sectionTitle}>Community Info</Text>
                            <View style={styles.infoItem}>
                                <MaterialIcons name="category" size={16} color="#666" />
                                <Text style={styles.infoLabel}>Category:</Text>
                                <Text style={styles.infoValue}>{community.category}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <MaterialIcons name="visibility" size={16} color="#666" />
                                <Text style={styles.infoLabel}>Privacy:</Text>
                                <Text style={styles.infoValue}>
                                    {community.privacy === 'public' ? 'Public' : 'Private'}
                                </Text>
                            </View>
                            <View style={styles.infoItem}>
                                <MaterialIcons name="people" size={16} color="#666" />
                                <Text style={styles.infoLabel}>Members:</Text>
                                <Text style={styles.infoValue}>{community.memberCount}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <MaterialIcons name="article" size={16} color="#666" />
                                <Text style={styles.infoLabel}>Posts:</Text>
                                <Text style={styles.infoValue}>{community.postCount}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <MaterialIcons name="schedule" size={16} color="#666" />
                                <Text style={styles.infoLabel}>Created:</Text>
                                <Text style={styles.infoValue}>
                                    {new Date(community.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={showCreateMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCreateMenu(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCreateMenu(false)}
                >
                    <View style={styles.createMenuContainer}>
                        <TouchableOpacity
                            style={styles.createMenuOption}
                            onPress={() => {
                                setShowCreateMenu(false);
                                router.push(`/create-post?community=${id}`);
                            }}
                        >
                            <MaterialIcons name="post-add" size={24} color="#fff" />
                            <Text style={styles.createMenuText}>Create Post</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.createMenuOption}
                            onPress={() => {
                                setShowCreateMenu(false);
                                router.push(`/whistle-blow?community=${id}`);
                            }}
                        >
                            <MaterialIcons name="sports" size={24} color="#fff" />
                            <Text style={styles.createMenuText}>Whistle Blow</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <CommunityRequestModal
                visible={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                communityId={id}
                onRequestHandled={fetchCommunityData}
            />

            <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setMenuVisible(false)}>
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
                        {menuPost && (
                            <>
                                {isOwner(menuPost) && (
                                    <TouchableOpacity onPress={handleDeletePost} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' }}>
                                        <MaterialIcons name="delete" size={24} color="#ff4444" />
                                        <Text style={{ color: '#ff4444', fontSize: 16, marginLeft: 15 }}>Delete Post</Text>
                                    </TouchableOpacity>
                                )}
                                {!menuPost.anonymous && menuPost.author?._id !== user?._id && (
                                    <TouchableOpacity onPress={handleFollowAuthor} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' }}>
                                        <MaterialIcons name="person-add" size={24} color="#fff" />
                                        <Text style={{ color: '#fff', fontSize: 16, marginLeft: 15 }}>Follow {menuPost?.author?.name || ''}</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={handleSaveAsImage} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' }}>
                                    <MaterialIcons name="save-alt" size={24} color="#fff" />
                                    <Text style={{ color: '#fff', fontSize: 16, marginLeft: 15 }}>
                                        {savingImage ? 'Saving...' : 'Save as Image'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleCopyText} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15 }}>
                                    <MaterialIcons name="content-copy" size={24} color="#fff" />
                                    <Text style={{ color: '#fff', fontSize: 16, marginLeft: 15 }}>Copy Text</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </Pressable>
            </Modal>

            <View style={styles.taskbar}>
                <TouchableOpacity
                    style={styles.taskbarButton}
                    onPress={() => router.push('/')}
                >
                    <MaterialIcons name="home" size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.taskbarButton}
                    onPress={() => router.push('/whistle-blow')}
                >
                    <MaterialIcons name="sports" size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.taskbarButton}
                    onPress={() => router.push('/choose-post-type')}
                >
                    <View style={{
                        width: 32,
                        height: 32,
                        borderWidth: 2,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderColor: '#CCCCCC',
                        backgroundColor: 'transparent',
                        transform: [{ scale: 1.2 }],
                    }}>
                        <MaterialIcons name="add" size={22} color="#CCCCCC" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.taskbarButton}
                    onPress={() => router.push('/chat')}
                >
                    <MaterialIcons name="chat" size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.taskbarButton, styles.activeTaskbarButton]}
                    onPress={() => router.push('/communities')}
                >
                    <GradientBackground style={styles.activeTaskbarButtonGradient}>
                        <MaterialIcons name="people" size={24} color="#fff" />
                    </GradientBackground>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    createPostButton: {
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createPostButtonGradient: {
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsButton: {
        marginRight: 8,
        borderRadius: 18,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsButtonGradient: {
        borderRadius: 18,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerRequestsButton: {
        borderRadius: 18,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    requestsButtonGradient: {
        borderRadius: 18,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    bannerContainer: {
        height: 150,
        backgroundColor: '#1a1a1a',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    communityInfo: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    privacyBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#666',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    communityDetails: {
        flex: 1,
    },
    communityName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    communityCategory: {
        fontSize: 14,
        color: '#007AFF',
        textTransform: 'capitalize',
        marginBottom: 2,
    },
    communityStats: {
        fontSize: 12,
        color: '#666',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    adminBadge: {
        borderRadius: 12,
        marginRight: 8,
    },
    adminBadgeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    adminText: {
        color: '#fff',
        fontSize: 10,
        marginLeft: 4,
    },
    joinButton: {
        borderRadius: 20,
    },
    joinButtonGradient: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    leaveButton: {
        backgroundColor: '#ff3b30',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    leaveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 8,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabGradient: {
        paddingVertical: 6,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTabButton: {
        borderBottomColor: '#007AFF',
    },
    tabText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    postsContainer: {
        flex: 1,
    },
    postsList: {
        paddingHorizontal: 0,
    },
    privateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    privateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    privateSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    joinPrivateButton: {
        borderRadius: 25,
    },
    joinPrivateButtonGradient: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    joinPrivateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    categoryButton: {
        marginRight: 10,
    },
    categoryButtonGradient: {
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryButtonInactive: {
        backgroundColor: '#222',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    createFirstPostButton: {
        borderRadius: 25,
    },
    createFirstPostButtonGradient: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createFirstPostButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    aboutContainer: {
        padding: 20,
    },
    aboutSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    description: {
        fontSize: 16,
        color: '#ccc',
        lineHeight: 24,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        color: '#007AFF',
        fontSize: 14,
    },
    ruleItem: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    ruleNumber: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: 'bold',
        marginRight: 8,
        minWidth: 20,
    },
    ruleText: {
        fontSize: 16,
        color: '#ccc',
        flex: 1,
        lineHeight: 24,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 16,
        color: '#666',
        marginLeft: 8,
        marginRight: 8,
        minWidth: 80,
    },
    infoValue: {
        fontSize: 16,
        color: '#fff',
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    backButton: {
        borderRadius: 25,
    },
    backButtonGradient: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    createMenuContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 20,
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    createMenuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    createMenuText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 12,
    },
    taskbar: {
        flexDirection: 'row',
        backgroundColor: '#000000',
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingVertical: 10,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    taskbarButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
    },
    activeTaskbarButton: {
        borderRadius: 8,
    },
    activeTaskbarButtonGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        minWidth: 40,
        minHeight: 40,
    },
    requestsButton: {
        backgroundColor: '#FF9800',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginLeft: 8,
    },
    requestsButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
});
