import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useAuth } from '../store/authContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { API_BASE_URL } from '../config/server';

export default function WhistleApprovalsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const theme = Colors.dark;
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/whistles`, {
      headers: { 'user-email': user?.email || '' }
    })
      .then(res => res.json())
      .then(data => setSubmissions(Array.isArray(data) ? data : []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [user?.email]);

  useEffect(() => {
    if (params.submissionId) {
      const targetIndex = submissions.findIndex(s => String(s._id) === String(params.submissionId));
      if (targetIndex >= 0) {
      }
    }
  }, [params.submissionId, submissions]);

  const review = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/whistles/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-email': user?.email || ''
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to review');
      setSubmissions(prev => prev.filter(s => s._id !== id));
      Alert.alert('Success', action === 'approve' ? 'Whistle approved' : 'Whistle rejected');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to review');
    }
  };

  const Card = ({ s }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.divider }]}
      key={s._id}
    >
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {s.submittedBy?.avatar ? (
            <Image source={{ uri: s.submittedBy.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}><Text style={{ color: '#fff' }}>{(s.submittedBy?.name || s.submittedBy?.username || '?').charAt(0).toUpperCase()}</Text></View>
          )}
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.name, { color: theme.text }]}>{s.submittedBy?.name || s.submittedBy?.username || 'Anonymous'}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{s.isCommunityPost ? `Community: ${s.community?.name || ''}` : 'Home whistle'}</Text>
          </View>
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{new Date(s.createdAt).toLocaleString()}</Text>
      </View>

      {s.title ? <Text style={[styles.title, { color: theme.text }]}>{s.title}</Text> : null}
      <Text style={[styles.content, { color: theme.text }]}>{s.content}</Text>
      {s.image?.url ? (
        <TouchableOpacity onPress={() => { setViewerUri(s.image.url); setViewerVisible(true); }}>
          <Image source={{ uri: s.image.url }} style={styles.mainImage} />
        </TouchableOpacity>
      ) : null}
      {Array.isArray(s.proofImages) && s.proofImages.length > 0 && (
        <View style={styles.proofRow}>
          {s.proofImages.map((pi, idx) => (
            <TouchableOpacity key={idx} onPress={() => { setViewerUri(pi.url); setViewerVisible(true); }}>
              <Image source={{ uri: pi.url }} style={styles.proofImage} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#2ecc71' }]} onPress={() => review(s._id, 'approve')}>
          <Text style={styles.btnText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#e74c3c' }]} onPress={() => review(s._id, 'reject')}>
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.titleHeader, { color: theme.text }]}>Whistle Approvals</Text>
        <View style={{ width: 32 }} />
      </View>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {submissions.length === 0 ? (
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 40 }}>No pending whistles</Text>
          ) : (
            submissions.map(s => <Card key={s._id} s={s} />)
          )}
        </ScrollView>
      )}

      <Modal visible={viewerVisible} transparent={true} onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
            <Text style={{ color: '#fff', fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
          {viewerUri ? (
            <Image source={{ uri: viewerUri }} style={styles.viewerImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  backButton: { padding: 6 },
  titleHeader: { fontSize: 18, fontWeight: 'bold' },
  card: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#555', alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: 'bold' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  content: { fontSize: 14, marginBottom: 10 },
  mainImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 10 },
  proofRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  proofImage: { width: 80, height: 80, borderRadius: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: '95%', height: '85%' },
  viewerClose: { position: 'absolute', top: 40, right: 20, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
});


