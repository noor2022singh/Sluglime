import React, { useState, useEffect, useRef } from "react";
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
  TextInput,
  RefreshControl,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../store/authContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { API_BASE_URL } from "../config/server";
import GradientBackground from "../components/GradientBackground";

const { width } = Dimensions.get("window");

function responsiveSize(size) {
  return Math.round(size * (width / 375));
}

export default function CommunitiesScreen() {
  const [communities, setCommunities] = useState([]);
  const [trendingCommunities, setTrendingCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();
  const router = useRouter();

  // Animation refs for Create Community button
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const [allCommunitiesRes, trendingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/communities`),
        fetch(`${API_BASE_URL}/communities/trending`),
      ]);

      if (allCommunitiesRes.ok) {
        const allCommunities = await allCommunitiesRes.json();
        setCommunities(allCommunities.communities || allCommunities || []);
      }

      if (trendingRes.ok) {
        const trending = await trendingRes.json();
        setTrendingCommunities(trending || []);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
      Alert.alert("Error", "Failed to load communities");
      setCommunities([]);
      setTrendingCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCommunities();
    setRefreshing(false);
  };

  const handleJoinCommunity = async (communityId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/communities/${communityId}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ userId: user._id }),
        }
      );

      if (response.ok) {
        Alert.alert("Success", "Joined community successfully!");
        fetchCommunities();
      } else {
        const error = await response.json();
        Alert.alert("Error", error.message || "Failed to join community");
      }
    } catch (error) {
      console.error("Error joining community:", error);
      Alert.alert("Error", "Failed to join community");
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/communities/${communityId}/leave`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ userId: user._id }),
        }
      );

      if (response.ok) {
        Alert.alert("Success", "Left community successfully!");
        fetchCommunities();
      } else {
        const error = await response.json();
        Alert.alert("Error", error.message || "Failed to leave community");
      }
    } catch (error) {
      console.error("Error leaving community:", error);
      Alert.alert("Error", "Failed to leave community");
    }
  };

  const isMember = (community) => {
    return (
      community.members?.includes(user._id) || community.creator === user._id
    );
  };

  const isAdmin = (community) => {
    return (
      community.admins?.includes(user._id) || community.creator === user._id
    );
  };

  const filteredCommunities = () => {
    let communitiesToFilter = communities;

    // Filter by tab
    switch (activeTab) {
      case "trending":
        communitiesToFilter = trendingCommunities;
        break;
      case "new":
        communitiesToFilter = communities.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case "popular":
        communitiesToFilter = communities.sort((a, b) => 
          (b.memberCount || 0) - (a.memberCount || 0)
        );
        break;
      default:
        communitiesToFilter = communities;
    }

    if (!Array.isArray(communitiesToFilter)) {
      return [];
    }

    // Filter by search query
    if (!searchQuery) return communitiesToFilter;

    return communitiesToFilter.filter(
      (community) =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        community.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderCommunityCard = (community) => (
    <TouchableOpacity
      key={community._id}
      style={styles.communityCard}
      onPress={() => router.push(`/community/${community._id}`)}
      activeOpacity={0.8}
    >
      {/* Card Header with Gradient Overlay */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={
              community.avatar
                ? { uri: community.avatar }
                : require("../assets/images/icon.png")
            }
            style={styles.communityAvatar}
          />
          {community.privacy === "private" && (
            <View style={styles.privacyIndicator}>
              <MaterialIcons name="lock" size={12} color="#fff" />
            </View>
          )}
        </View>
        
        <View style={styles.communityInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.communityName} numberOfLines={1}>
              {community.name}
            </Text>
            {isAdmin(community) && (
              <View style={styles.adminBadge}>
                <MaterialIcons name="verified" size={16} color="#4CAF50" />
              </View>
            )}
          </View>
          <Text style={styles.communityCategory}>{community.category}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={14} color="#888" />
              <Text style={styles.statText}>{community.memberCount || 0}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="article" size={14} color="#888" />
              <Text style={styles.statText}>{community.postCount || 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionContainer}>
          {!isMember(community) ? (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={(e) => {
                e.stopPropagation();
                handleJoinCommunity(community._id);
              }}
            >
              <GradientBackground style={styles.joinButtonGradient}>
                <MaterialIcons name="add" size={16} color="#fff" />
                <Text style={styles.joinButtonText}>Join</Text>
              </GradientBackground>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.memberButton}
              onPress={(e) => {
                e.stopPropagation();
                Alert.alert(
                  "Leave Community",
                  `Are you sure you want to leave ${community.name}?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Leave", 
                      style: "destructive",
                      onPress: () => handleLeaveCommunity(community._id)
                    }
                  ]
                );
              }}
            >
              <MaterialIcons name="check" size={16} color="#4CAF50" />
              <Text style={styles.memberButtonText}>Member</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Description */}
      <Text style={styles.communityDescription} numberOfLines={2}>
        {community.description || "No description available"}
      </Text>

      {/* Tags */}
      {community.tags && community.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {community.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {community.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{community.tags.length - 3} more</Text>
          )}
        </View>
      )}

      {/* Activity Indicator */}
      <View style={styles.activityIndicator}>
        <View style={[styles.activityDot, { backgroundColor: community.memberCount > 50 ? '#4CAF50' : community.memberCount > 10 ? '#FF9800' : '#666' }]} />
        <Text style={styles.activityText}>
          {community.memberCount > 50 ? 'Very Active' : community.memberCount > 10 ? 'Active' : 'Growing'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Fixed Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Communities</Text>
          <Text style={styles.subtitle}>Discover and join amazing communities</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/create-community")}
          activeOpacity={0.8}
        >
          <GradientBackground style={styles.createButtonGradient}>
            <MaterialIcons name="add" size={24} color="#fff" />
          </GradientBackground>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Section */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <MaterialIcons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search communities..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterContainer}>
          {["All", "Trending", "New", "Popular"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTag,
                activeTab === filter.toLowerCase() && styles.filterTagActive,
              ]}
              onPress={() => setActiveTab(filter.toLowerCase())}
            >
              <Text
                style={[
                  styles.filterTagText,
                  activeTab === filter.toLowerCase() && styles.filterTagTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Communities List */}
      <ScrollView
        style={styles.communitiesList}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={["#007AFF"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredCommunities().length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people-outline" size={80} color="#333" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No communities found"
                : "No communities available"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try adjusting your search terms or explore different categories"
                : "Be the first to create a community and start building your network!"}
            </Text>
          </View>
        ) : (
          filteredCommunities().map(renderCommunityCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#888",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },

  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    lineHeight: 22,
  },

  // Create Community Button (Plus Icon)
  createButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  createButtonGradient: {
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // Search & Filter Section
  searchFilterContainer: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchContainer: {
    position: "relative",
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 12,
    paddingLeft: 44,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    top: 14,
    zIndex: 1,
  },

  // Filter Tags
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  filterTagActive: {
    backgroundColor: "#1a1a1a",
    borderColor: "#666",
  },
  filterTagText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  filterTagTextActive: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  // Communities List
  communitiesList: {
    flex: 1,
    backgroundColor: "#000",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },

  // Community Card
  communityCard: {
    backgroundColor: "#111",
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#222",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // Card Header
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  communityAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#333",
  },
  privacyIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#666",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  // Community Info
  communityInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  communityName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    letterSpacing: -0.3,
  },
  adminBadge: {
    marginLeft: 8,
  },
  communityCategory: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#333",
    marginHorizontal: 12,
  },

  // Action Container
  actionContainer: {
    alignItems: "flex-end",
  },
  joinButton: {
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  joinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  memberButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  memberButtonText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },

  // Description
  communityDescription: {
    fontSize: 15,
    color: "#ccc",
    lineHeight: 22,
    marginBottom: 12,
  },

  // Tags
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  tag: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  tagText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "500",
  },
  moreTagsText: {
    color: "#666",
    fontSize: 12,
    fontStyle: "italic",
  },

  // Activity Indicator
  activityIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  activityText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
