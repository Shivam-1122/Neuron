import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { Colors } from '../theme/colors';
import {
  X,
  Check,
  User,
  LogOut,
  Sliders,
  Database,
  Cpu,
  Volume2,
  VolumeX,
  Music,
  Mic,
  ChevronDown,
  ChevronUp,
  Server,
  Wifi,
  Shield,
  Sparkles,
} from 'lucide-react-native';
import { getApiBase, setApiBase, testApiConnection, getCaregiversApi } from '../api/client';
import sound from '../utils/soundEngine';

export default function SettingsModal({
  visible,
  onClose,
  currentUser,
  onLogout,
  llmProvider = 'groq',
  onToggleLLM,
  isMuted = false,
  onToggleSound,
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'preferences' | 'data'
  const [showAdvancedNet, setShowAdvancedNet] = useState(false);
  const [url, setUrl] = useState(getApiBase());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Preference switches
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundFxEnabled, setSoundFxEnabled] = useState(!isMuted);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Stats
  const [caregiverCount, setCaregiverCount] = useState(0);

  useEffect(() => {
    if (visible && currentUser?.uid) {
      getCaregiversApi(currentUser.uid)
        .then((res) => {
          if (res?.caregivers) setCaregiverCount(res.caregivers.length);
        })
        .catch(() => {});
    }
  }, [visible, currentUser]);

  const handleSaveNetwork = () => {
    setApiBase(url);
    Alert.alert('Network Saved', 'Cortex endpoint updated.');
  };

  const handleTestNetwork = async () => {
    setIsTesting(true);
    setTestResult(null);
    setApiBase(url);
    const result = await testApiConnection();
    setTestResult(result);
    setIsTesting(false);
  };

  const handleToggleMusicSwitch = (val) => {
    setMusicEnabled(val);
    if (val) {
      sound.startBackgroundMusic();
    } else {
      sound.stopBackgroundMusic();
    }
  };

  const handleToggleSoundFxSwitch = (val) => {
    setSoundFxEnabled(val);
    if (onToggleSound) onToggleSound();
  };

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to end your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          onClose();
          if (onLogout) onLogout();
        },
      },
    ]);
  };

  const displayName = currentUser?.displayName || currentUser?.name || 'Sanctuary Member';
  const roleName = currentUser?.role === 'caregiver' ? 'Caregiver Portal' : 'Patient Sanctuary';
  const emailOrPhone = currentUser?.email || currentUser?.phoneNumber || 'Biometric ID User';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sliders color={Colors.amber} size={15} />
              <Text style={styles.title}>SYSTEM & PREFERENCES</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X color={Colors.textMuted} size={15} />
            </TouchableOpacity>
          </View>

          {/* 3 Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
              onPress={() => setActiveTab('profile')}
            >
              <User size={13} color={activeTab === 'profile' ? Colors.amber : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
                Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'preferences' && styles.tabItemActive]}
              onPress={() => setActiveTab('preferences')}
            >
              <Cpu size={13} color={activeTab === 'preferences' ? Colors.amber : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'preferences' && styles.tabTextActive]}>
                Preferences
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'data' && styles.tabItemActive]}
              onPress={() => setActiveTab('data')}
            >
              <Database size={13} color={activeTab === 'data' ? Colors.amber : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'data' && styles.tabTextActive]}>
                Memory Core
              </Text>
            </TouchableOpacity>
          </View>

          {/* Modal Scroll Body */}
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* ========================================== */}
            {/* TAB 1: PROFILE                             */}
            {/* ========================================== */}
            {activeTab === 'profile' && (
              <View style={styles.sectionWrap}>
                <View style={styles.profileCard}>
                  <View style={styles.profileAvatar}>
                    <User size={22} color={Colors.amber} />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{displayName}</Text>
                    <Text style={styles.profileContact}>{emailOrPhone}</Text>
                    <View style={styles.roleBadge}>
                      <Shield size={10} color={Colors.cyan} />
                      <Text style={styles.roleBadgeText}>{roleName}</Text>
                    </View>
                  </View>
                </View>

                {/* Details List */}
                <View style={styles.metaBox}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>USER ID</Text>
                    <Text style={styles.metaVal}>{currentUser?.uid || 'guest_session'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>SECURITY PROTOCOL</Text>
                    <Text style={[styles.metaVal, { color: Colors.emerald }]}>Active & Encrypted</Text>
                  </View>
                  <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.metaLabel}>CAREGIVERS LINKED</Text>
                    <Text style={styles.metaVal}>{caregiverCount} verified</Text>
                  </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={handleLogoutPress}
                  activeOpacity={0.8}
                >
                  <LogOut size={13} color={Colors.red} />
                  <Text style={styles.logoutBtnText}>LOGOUT FROM SESSION</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ========================================== */}
            {/* TAB 2: PREFERENCES                         */}
            {/* ========================================== */}
            {activeTab === 'preferences' && (
              <View style={styles.sectionWrap}>
                {/* LLM Engine */}
                <View style={styles.prefRow}>
                  <View style={styles.prefLeft}>
                    <Sparkles size={14} color={Colors.cyan} />
                    <View>
                      <Text style={styles.prefTitle}>Neural Cortex LLM</Text>
                      <Text style={styles.prefSub}>
                        {llmProvider === 'groq' ? 'Groq LLaMA-3.3 (Fast)' : 'Google Gemini Flash'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.pillToggle}
                    onPress={onToggleLLM}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pillToggleText}>
                      {llmProvider === 'groq' ? 'SWITCH TO GEMINI' : 'SWITCH TO GROQ'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Harmonic Music */}
                <View style={styles.prefRow}>
                  <View style={styles.prefLeft}>
                    <Music size={14} color={Colors.amber} />
                    <View>
                      <Text style={styles.prefTitle}>Harmonic Ambient Sound</Text>
                      <Text style={styles.prefSub}>Soothing 432Hz cognitive harmonic audio</Text>
                    </View>
                  </View>
                  <Switch
                    value={musicEnabled}
                    onValueChange={handleToggleMusicSwitch}
                    trackColor={{ false: '#262933', true: 'rgba(245, 158, 11, 0.4)' }}
                    thumbColor={musicEnabled ? Colors.amber : '#6b7280'}
                  />
                </View>

                {/* Sound FX */}
                <View style={styles.prefRow}>
                  <View style={styles.prefLeft}>
                    <Volume2 size={14} color={Colors.purple} />
                    <View>
                      <Text style={styles.prefTitle}>Tactile Audio Chimes</Text>
                      <Text style={styles.prefSub}>Auditory affirmation for cards & buttons</Text>
                    </View>
                  </View>
                  <Switch
                    value={soundFxEnabled}
                    onValueChange={handleToggleSoundFxSwitch}
                    trackColor={{ false: '#262933', true: 'rgba(168, 85, 247, 0.4)' }}
                    thumbColor={soundFxEnabled ? Colors.purple : '#6b7280'}
                  />
                </View>

                {/* Voice Guidance */}
                <View style={styles.prefRow}>
                  <View style={styles.prefLeft}>
                    <Mic size={14} color={Colors.emerald} />
                    <View>
                      <Text style={styles.prefTitle}>Voice Guidance Narration</Text>
                      <Text style={styles.prefSub}>Spoken step verification & responses</Text>
                    </View>
                  </View>
                  <Switch
                    value={speechEnabled}
                    onValueChange={setSpeechEnabled}
                    trackColor={{ false: '#262933', true: 'rgba(16, 185, 129, 0.4)' }}
                    thumbColor={speechEnabled ? Colors.emerald : '#6b7280'}
                  />
                </View>

                {/* Advanced Network Settings (Collapsed Accordion) */}
                <View style={styles.advancedBox}>
                  <TouchableOpacity
                    style={styles.advancedHeader}
                    onPress={() => setShowAdvancedNet(!showAdvancedNet)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.advancedTitleRow}>
                      <Server size={13} color={Colors.textMuted} />
                      <Text style={styles.advancedTitle}>Advanced Network Settings</Text>
                    </View>
                    {showAdvancedNet ? (
                      <ChevronUp size={13} color={Colors.textMuted} />
                    ) : (
                      <ChevronDown size={13} color={Colors.textMuted} />
                    )}
                  </TouchableOpacity>

                  {showAdvancedNet && (
                    <View style={styles.advancedBody}>
                      <Text style={styles.inputLabel}>CORTEX BACKEND URL</Text>
                      <TextInput
                        style={styles.input}
                        value={url}
                        onChangeText={setUrl}
                        placeholder="https://..."
                        placeholderTextColor={Colors.textDark}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />

                      {testResult && (
                        <View
                          style={[
                            styles.resultBanner,
                            testResult.success ? styles.bannerSuccess : styles.bannerError,
                          ]}
                        >
                          <Wifi
                            color={testResult.success ? Colors.emerald : Colors.red}
                            size={12}
                          />
                          <Text
                            style={[
                              styles.resultText,
                              testResult.success ? styles.textSuccess : styles.textError,
                            ]}
                          >
                            {testResult.message}
                          </Text>
                        </View>
                      )}

                      <View style={styles.netBtnRow}>
                        <TouchableOpacity
                          style={styles.testBtn}
                          onPress={handleTestNetwork}
                          disabled={isTesting}
                        >
                          {isTesting ? (
                            <ActivityIndicator color={Colors.cyan} size="small" />
                          ) : (
                            <Text style={styles.testBtnText}>PING CORTEX</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveNetBtn} onPress={handleSaveNetwork}>
                          <Text style={styles.saveNetBtnText}>SAVE ENDPOINT</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ========================================== */}
            {/* TAB 3: MEMORY CORE                         */}
            {/* ========================================== */}
            {activeTab === 'data' && (
              <View style={styles.sectionWrap}>
                <View style={styles.dataCard}>
                  <View style={styles.dataIconWrap}>
                    <Database size={16} color={Colors.cyan} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dataCardTitle}>512-D Neural Biometrics Core</Text>
                    <Text style={styles.dataCardSub}>
                      All facial embeddings and object telemetry are stored securely in your private
                      Qdrant vector collection.
                    </Text>
                  </View>
                </View>

                <View style={styles.dataStatsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{caregiverCount}</Text>
                    <Text style={styles.statLabel}>CAREGIVERS</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: Colors.cyan }]}>Active</Text>
                    <Text style={styles.statLabel}>FACE RECALL</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: Colors.emerald }]}>Synced</Text>
                    <Text style={styles.statLabel}>SPATIAL CORE</Text>
                  </View>
                </View>

                <Text style={styles.dataNotice}>
                  Manage, add, and remove loved ones from the Caregiver tab.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#111318',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: '#16181f',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0c0e14',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.amber,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  tabTextActive: {
    color: Colors.amber,
    fontWeight: '800',
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 20,
  },
  sectionWrap: {
    gap: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#16181f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  profileContact: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 5,
  },
  roleBadgeText: {
    color: Colors.cyan,
    fontSize: 8.5,
    fontWeight: '700',
  },
  metaBox: {
    backgroundColor: '#16181f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaVal: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginTop: 4,
  },
  logoutBtnText: {
    color: Colors.red,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#16181f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  prefTitle: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  prefSub: {
    color: Colors.textMuted,
    fontSize: 8.5,
    marginTop: 1,
  },
  pillToggle: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillToggleText: {
    color: Colors.cyan,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  advancedBox: {
    backgroundColor: '#13151c',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
    marginTop: 4,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  advancedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  advancedTitle: {
    color: Colors.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
  },
  advancedBody: {
    padding: 10,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    height: 36,
    backgroundColor: '#0c0e14',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    color: Colors.textPrimary,
    fontSize: 10,
    paddingHorizontal: 10,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  bannerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resultText: {
    fontSize: 9,
    fontWeight: '700',
  },
  textSuccess: {
    color: Colors.emerald,
  },
  textError: {
    color: Colors.red,
  },
  netBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  testBtn: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '800',
  },
  saveNetBtn: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveNetBtnText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
  },
  dataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#16181f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  dataIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataCardTitle: {
    color: Colors.textPrimary,
    fontSize: 10.5,
    fontWeight: '800',
  },
  dataCardSub: {
    color: Colors.textMuted,
    fontSize: 8.5,
    lineHeight: 12,
    marginTop: 2,
  },
  dataStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#16181f',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.amber,
    fontSize: 14,
    fontWeight: '900',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 7.5,
    fontWeight: '800',
    marginTop: 2,
  },
  dataNotice: {
    color: Colors.textDark,
    fontSize: 8.5,
    textAlign: 'center',
    marginTop: 4,
  },
});
