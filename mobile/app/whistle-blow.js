import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Image, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { API_BASE_URL } from '../config/server';
import { useAuth } from '../store/authContext';

function generateAnonymousId() {
    return 'Anonymous-' + Math.floor(1000 + Math.random() * 9000);
}

export default function WhistleBlow() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const isCommunityPost = !!params.community;
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [anonId] = useState(generateAnonymousId());
    const [mainImage, setMainImage] = useState(null);
    const [proofImages, setProofImages] = useState([]);
    const [category, setCategory] = useState(''); 
    const [categoryOptions, setCategoryOptions] = useState([]); 
    const [showCategoryModal, setShowCategoryModal] = useState(false); 
    const [showHashtagModal, setShowHashtagModal] = useState(false);
    const [availableHashtags, setAvailableHashtags] = useState([]);
    const [selectedHashtags, setSelectedHashtags] = useState([]);
    useEffect(() => {
        if (isCommunityPost && params.community) {
            fetch(`${API_BASE_URL}/communities/${params.community}/categories`)
                .then(res => res.json())
                .then(data => {
                    setCategoryOptions(data.map(cat => cat.name));
                    if (data.length > 0) setCategory(data[0].name);
                })
                .catch(() => setCategoryOptions([]));
        } else {
            setCategoryOptions(['news', 'culture']);
            setCategory('news');
        }

        fetch(`${API_BASE_URL}/posts/hashtags`)
            .then((res) => res.json())
            .then((data) => {
                setAvailableHashtags(data.hashtags || []);
            })
            .catch(() => setAvailableHashtags([]));
    }, [isCommunityPost, params.community]);

    const pickMainImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setMainImage(result.assets[0]);
        }
    };

    const pickProofImages = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setProofImages(prev => [...prev, ...result.assets]);
        }
    };

    const handleSubmit = async () => {
        if (!content) {
            Alert.alert('Error', 'Content is required.');
            return;
        }
        if (!category) {
            Alert.alert('Error', 'Please select a category.');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('category', category);
            formData.append('anonymous', 'true');
            formData.append('anonymousId', anonId);
            if (user?._id) {
                formData.append('author', String(user._id));
            }
            if (mainImage) {
                formData.append('image', {
                    uri: mainImage.uri,
                    name: mainImage.fileName || 'main.jpg',
                    type: mainImage.mimeType || 'image/jpeg',
                });
            }
            proofImages.forEach((img, idx) => {
                formData.append('proofImages', {
                    uri: img.uri,
                    name: img.fileName || `proof${idx}.jpg`,
                    type: img.mimeType || 'image/jpeg',
                });
            });
            if (isCommunityPost) {
                formData.append('community', params.community);
                formData.append('visibility', 'community');
            }
            if (selectedHashtags.length > 0) {
                formData.append('selectedHashtags', selectedHashtags.join(','));
            }

            const res = await fetch(`${API_BASE_URL}/posts/whistle-blow`, {
                method: 'POST',
                headers: { 'Content-Type': 'multipart/form-data' },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to post');
            Alert.alert('Submitted', 'Your whistle was sent to admin for approval. You will be notified once reviewed.');

            if (isCommunityPost) {
                router.replace(`/community/${params.community}`);
            } else {
                router.replace('/');
            }
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to post');
        } finally {
            setLoading(false);
        }
    };

    const removeProofImage = (index) => {
        setProofImages(prev => prev.filter((_, i) => i !== index));
    };



    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { backgroundColor: Colors.dark.background }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: Colors.dark.divider }]}>
                    <Text style={[styles.backText, { color: Colors.dark.text }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.dark.text }]}>
                    {isCommunityPost ? 'Community Whistle' : 'Anonymous Whistle'}
                </Text>
                <TouchableOpacity style={[styles.postButton, { backgroundColor: content.trim() ? Colors.dark.tint : Colors.dark.divider }]} onPress={handleSubmit} disabled={!content.trim() || loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.postButtonText}>Post</Text>
                    )}
                </TouchableOpacity>
            </View>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustContentInsets={false}
            >
                <Text style={[styles.warningText, { color: Colors.dark.tint }]}>
                    ⚠️ This post will be completely anonymous and untraceable
                </Text>
                <TextInput
                    style={[styles.titleInput, { backgroundColor: Colors.dark.card, color: Colors.dark.text, borderColor: Colors.dark.divider }]}
                    placeholder="Title (optional)"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                    multiline
                />
                <TextInput
                    style={[styles.contentInput, { backgroundColor: Colors.dark.card, color: Colors.dark.text, borderColor: Colors.dark.divider }]}
                    placeholder="Share your anonymous whistle..."
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                />
                <Text style={[styles.hashtagHint, { color: Colors.dark.textSecondary }]}>
                    💡 Tip: Add hashtags like #Tech, #Business, #Politics to help others discover your post and receive relevant notifications.
                </Text>
                {mainImage && (
                    <View style={[styles.mainImageContainer, { backgroundColor: Colors.dark.card, borderColor: Colors.dark.divider }]}>
                        <Text style={[styles.mainImageTitle, { color: Colors.dark.text }]}>Main Image</Text>
                        <View style={[styles.mainImageWrapper, { backgroundColor: Colors.dark.background, borderColor: Colors.dark.divider }]}>
                            <Image source={{ uri: mainImage.uri }} style={styles.mainImage} />
                            <TouchableOpacity style={[styles.removeMainImageButton, { backgroundColor: Colors.dark.tint }]} onPress={() => setMainImage(null)}>
                                <Text style={styles.removeMainImageText}>×</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                {proofImages.length > 0 && (
                    <View style={[styles.proofContainer, { backgroundColor: Colors.dark.card, borderColor: Colors.dark.divider }]}>
                        <Text style={[styles.proofTitle, { color: Colors.dark.text }]}>Proof Images ({proofImages.length})</Text>
                        <View style={styles.proofImages}>
                            {proofImages.map((image, index) => (
                                <View key={index} style={[styles.proofImageContainer, { backgroundColor: Colors.dark.background, borderColor: Colors.dark.divider }]}>
                                    <Image source={{ uri: image.uri }} style={styles.proofImage} />
                                    <TouchableOpacity style={[styles.removeProofButton, { backgroundColor: Colors.dark.tint }]} onPress={() => removeProofImage(index)}>
                                        <Text style={styles.removeProofText}>×</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
            <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: Colors.dark.card, borderColor: Colors.dark.divider }]} onPress={pickMainImage}>
                    <MaterialIcons name="image" size={24} color={Colors.dark.icon} />
                    <Text style={[styles.actionText, { color: Colors.dark.text }]}>Add Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: Colors.dark.card, borderColor: Colors.dark.divider }]} onPress={pickProofImages}>
                    <MaterialIcons name="attach-file" size={24} color={Colors.dark.icon} />
                    <Text style={[styles.actionText, { color: Colors.dark.text }]}>Add Proof</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: Colors.dark.card, borderColor: Colors.dark.divider }]} onPress={() => setShowCategoryModal(true)}>
                    <MaterialIcons name="category" size={24} color={Colors.dark.icon} />
                    <Text style={[styles.actionText, { color: Colors.dark.text }]}>{category || 'Select Category'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: Colors.dark.card, borderColor: Colors.dark.divider }]} onPress={() => setShowHashtagModal(true)}>
                    <MaterialIcons name="tag" size={24} color={Colors.dark.icon} />
                    <Text style={[styles.actionText, { color: Colors.dark.text }]}>{selectedHashtags.length > 0 ? `${selectedHashtags.length} tags` : 'Add Hashtags'}</Text>
                </TouchableOpacity>
            </View>
            <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: Colors.dark.card }]}>
                        <Text style={[styles.modalTitle, { color: Colors.dark.text }]}>Select Category</Text>
                        {categoryOptions.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.categoryOption, { backgroundColor: category === cat ? Colors.dark.tint : Colors.dark.background, borderColor: Colors.dark.divider }]}
                                onPress={() => {
                                    setCategory(cat);
                                    setShowCategoryModal(false);
                                }}
                            >
                                <Text style={[styles.categoryText, { color: category === cat ? '#fff' : Colors.dark.text }]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={[styles.cancelButton, { backgroundColor: Colors.dark.divider }]} onPress={() => setShowCategoryModal(false)}>
                            <Text style={[styles.cancelButtonText, { color: Colors.dark.text }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showHashtagModal} animationType="slide" transparent={true}>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: Colors.dark.card }]}>
                        <Text style={[styles.modalTitle, { color: Colors.dark.text }]}>Select Hashtags</Text>

                        {availableHashtags.length === 0 ? (
                            <Text style={[styles.noHashtagsText, { color: Colors.dark.textSecondary }]}>
                                No hashtags available. Contact admin to add hashtags.
                            </Text>
                        ) : (
                            <ScrollView style={styles.hashtagList} showsVerticalScrollIndicator={false}>
                                {availableHashtags.map((tag) => (
                                    <TouchableOpacity
                                        key={tag}
                                        style={[
                                            styles.hashtagOption,
                                            {
                                                backgroundColor: selectedHashtags.includes(tag)
                                                    ? Colors.dark.tint
                                                    : Colors.dark.background,
                                                borderColor: Colors.dark.divider,
                                            },
                                        ]}
                                        onPress={() => {
                                            if (selectedHashtags.includes(tag)) {
                                                setSelectedHashtags(selectedHashtags.filter(t => t !== tag));
                                            } else {
                                                setSelectedHashtags([...selectedHashtags, tag]);
                                            }
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.hashtagText,
                                                { color: selectedHashtags.includes(tag) ? "#fff" : Colors.dark.text },
                                            ]}
                                        >
                                            #{tag}
                                        </Text>
                                        {selectedHashtags.includes(tag) && (
                                            <MaterialIcons name="check" size={20} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: Colors.dark.divider }]}
                            onPress={() => setShowHashtagModal(false)}
                        >
                            <Text style={[styles.cancelButtonText, { color: Colors.dark.text }]}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.divider,
    },
    backButton: {
        backgroundColor: Colors.dark.divider,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    backText: {
        color: Colors.dark.text,
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    postButton: {
        backgroundColor: Colors.dark.tint,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    postButtonDisabled: {
        backgroundColor: Colors.dark.divider,
    },
    postButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        flexGrow: 1,
        padding: 16,
        paddingBottom: 100,
    },
    warningText: {
        fontSize: 14,
        color: Colors.dark.tint,
        marginBottom: 16,
        textAlign: 'center',
        padding: 12,
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
    },
    titleInput: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 18,
        color: Colors.dark.text,
        minHeight: 60,
        borderWidth: 1,
        borderColor: Colors.dark.divider,
    },
    contentInput: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        color: Colors.dark.text,
        minHeight: 120,
        borderWidth: 1,
        borderColor: Colors.dark.divider,
    },
    hashtagHint: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 8,
        marginBottom: 24,
        textAlign: 'center',
    },
    proofContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.divider,
    },
    proofTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 12,
    },
    proofImages: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    proofImageContainer: {
        backgroundColor: Colors.dark.background,
        borderRadius: 8,
        padding: 4,
        position: 'relative',
        borderWidth: 1,
        borderColor: Colors.dark.divider,
    },
    proofImage: {
        width: 80,
        height: 80,
        borderRadius: 4,
    },
    removeProofButton: {
        backgroundColor: Colors.dark.tint,
        position: 'absolute',
        top: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeProofText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: 8,
        padding: 16,
        backgroundColor: Colors.dark.card,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.divider,
        paddingBottom: 20,
    },
    actionButton: {
        backgroundColor: Colors.dark.card,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 20,
        flex: 1,
        minWidth: '30%',
        borderWidth: 1,
        borderColor: Colors.dark.divider,
    },
    actionText: {
        marginLeft: 8,
        fontSize: 14,
        color: Colors.dark.text,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    categoryOption: {
        backgroundColor: Colors.dark.background,
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.divider,
    },
    selectedCategory: {
        backgroundColor: Colors.dark.tint,
        borderColor: Colors.dark.tint,
    },
    categoryText: {
        fontSize: 16,
        color: Colors.dark.text,
        textAlign: 'center',
    },
    selectedCategoryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: Colors.dark.divider,
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: Colors.dark.text,
        fontSize: 16,
    },
    mainImageContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.divider,
    },
    mainImageTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 12,
    },
    mainImageWrapper: {
        backgroundColor: Colors.dark.background,
        borderRadius: 8,
        padding: 4,
        position: 'relative',
        borderWidth: 1,
        borderColor: Colors.dark.divider,
        alignSelf: 'flex-start',
    },
    mainImage: {
        width: 120,
        height: 120,
        borderRadius: 4,
        resizeMode: 'cover',
    },
    removeMainImageButton: {
        backgroundColor: Colors.dark.tint,
        position: 'absolute',
        top: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeMainImageText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    noHashtagsText: {
        fontSize: 16,
        textAlign: 'center',
        marginVertical: 20,
        fontStyle: 'italic',
    },
    hashtagList: {
        maxHeight: 300,
        marginVertical: 10,
    },
    hashtagOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
    },
    hashtagText: {
        fontSize: 16,
        fontWeight: '500',
    },
}); 