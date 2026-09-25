import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import {
  HeartHandshake,
  Check,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Users,
  UserPlus,
  Trash2,
  Bell,
  Mail,
  Phone,
  Shield,
  Lock,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react-native';
import AudioRecorder from '../components/AudioRecorder';
import CameraScanner from '../components/CameraScanner';
import {
  rememberPatientApi,
  getCaregiversApi,
  addCaregiverApi,
  deleteCaregiverApi,
  sendCaregiverAlertApi,
} from '../api/client';

export default function CaregiverScreen({ onBack, currentUser }) {
  // Active Tab: 'team' (Caregivers Team) | 'memories' (Remember Loved One Wizard)
  const [activeTab, setActiveTab] = useState('team');

  const userId = currentUser?.patient_id || currentUser?.uid || 'default_user';

  // ==========================================
  // CAREGIVERS TEAM STATE
  // ==========================================
  const [caregivers, setCaregivers] = useState([]);
  const [loadingCaregivers, setLoadingCaregivers] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Caregiver Form
  const [cgName, setCgName] = useState('');
  const [cgEmail, setCgEmail] = useState('');
  const [cgPhone, setCgPhone] = useState('');
  const [cgRelation, setCgRelation] = useState('Primary Caregiver');
  const [cgPassword, setCgPassword] = useState('');
  const [cgPhotoUri, setCgPhotoUri] = useState(null);
  const [savingCg, setSavingCg] = useState(false);

  // Status & Feedback
  const [teamError, setTeamError] = useState('');
  const [teamSuccess, setTeamSuccess] = useState('');

  // Fetch Caregivers list
  const fetchCaregivers = async () => {
    setLoadingCaregivers(true);
    setTeamError('');
    try {
      const res = await getCaregiversApi(userId);
      if (res && res.caregivers) {
        setCaregivers(res.caregivers);
      }
    } catch (err) {
      console.warn('Failed to load caregivers:', err);
    } finally {
      setLoadingCaregivers(false);
    }
  };

  const [showInAppScanner, setShowInAppScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState('wizard');

  useEffect(() => {
    fetchCaregivers();
  }, [userId]);

  // Handle in-app camera capture
  const handleInAppCapture = (uri) => {
    if (scannerTarget === 'caregiver') {
      setCgPhotoUri(uri);
    } else {
      setImageUri(uri);
      setWizardError('');
    }
    setShowInAppScanner(false);
  };

  // Pick Caregiver Photo
  const pickCgPhoto = async (useCamera = false) => {
    try {
      if (useCamera) {
        setScannerTarget('caregiver');
        setShowInAppScanner(true);
        return;
      }
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission', 'Gallery access needed.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCgPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Caregiver photo picker error:', err);
    }
  };

  // Add Caregiver Submit
  const handleSaveCaregiver = async () => {
    if (!cgName.trim()) {
      return Alert.alert('Missing Name', 'Please enter the caregiver full name.');
    }
    if (!cgEmail.trim()) {
      return Alert.alert('Missing Email', 'Please enter an email for login and alerts.');
    }

    setSavingCg(true);
    try {
      await addCaregiverApi({
        name: cgName.trim(),
        email: cgEmail.trim(),
        phone: cgPhone.trim(),
        relation: cgRelation.trim(),
        password: cgPassword || 'caregiver123',
        userId,
        imageUri: cgPhotoUri,
      });

      setTeamSuccess(`Caregiver ${cgName} enrolled successfully!`);
      setShowAddModal(false);
      setCgName('');
      setCgEmail('');
      setCgPhone('');
      setCgPassword('');
      setCgPhotoUri(null);
      fetchCaregivers();
    } catch (err) {
      console.warn('Save caregiver error:', err);
      const detail = err.response?.data?.detail || err.message || 'Failed to add caregiver.';
      Alert.alert('Error', detail);
    } finally {
      setSavingCg(false);
    }
  };

  // Delete Caregiver
  const handleDeleteCaregiver = (cgId, cgName) => {
    Alert.alert(
      'Remove Caregiver',
      `Are you sure you want to remove ${cgName} from the care team? Their login account will also be deactivated.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCaregiverApi(cgId, userId);
              setTeamSuccess(`Removed ${cgName} from care team.`);
              fetchCaregivers();
            } catch (err) {
              console.warn('Delete caregiver error:', err);
              Alert.alert('Error', 'Could not remove caregiver.');
            }
          },
        },
      ]
    );
  };

  // Dispatch Emergency Alert
  const handleEmergencyAlert = () => {
    Alert.alert(
      '🚨 DISPATCH CAREGIVER ALERT',
      'Send immediate distress notification to all enrolled caregivers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND ALERT',
          style: 'destructive',
          onPress: async () => {
            try {
              await sendCaregiverAlertApi(userId, 'distress', 'Patient requested immediate support.');
              Alert.alert('Dispatched', 'Distress telemetry sent to caregivers.');
            } catch (err) {
              Alert.alert('Note', 'Distress beacon recorded.');
            }
          },
        },
      ]
    );
  };

  // ==========================================
  // MEMORIES WIZARD STATE (Remember Loved One)
  // ==========================================
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    notes: '',
    age: '',
  });
  const [imageUri, setImageUri] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState('');
  const [wizardSuccess, setWizardSuccess] = useState('');

  const pickWizardPhoto = async (useCamera = false) => {
    try {
      if (useCamera) {
        setScannerTarget('wizard');
        setShowInAppScanner(true);
        return;
      }
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permission', 'Gallery permission needed.');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setWizardError('');
      }
    } catch (err) {
      console.warn('Caregiver photo picker:', err);
    }
  };

  const handleNextStep = () => {
    setWizardError('');
    if (step === 0 && !formData.name.trim()) {
      return setWizardError('Please enter subject identity name.');
    }
    if (step === 1 && !formData.relation.trim()) {
      return setWizardError('Please specify the relationship.');
    }
    if (step === 2 && !imageUri) {
      return setWizardError('Please acquire or upload an optical portrait.');
    }
    setStep((prev) => prev + 1);
  };

  const handleWizardSubmit = async () => {
    setWizardError('');
    setIsSubmitting(true);

    try {
      await rememberPatientApi({
        name: formData.name.trim(),
        relation: formData.relation.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        notes: formData.notes.trim(),
        imageUri,
        audioUri,
      });

      setWizardSuccess(`Successfully registered ${formData.name} in Patient Memory!`);

      setTimeout(() => {
        setIsSubmitting(false);
        setWizardSuccess('');
        setStep(0);
        setFormData({ name: '', relation: '', notes: '', age: '' });
        setImageUri(null);
        setAudioUri(null);
      }, 2500);
    } catch (err) {
      setIsSubmitting(false);
      const detail = err.response?.data?.detail || err.message || 'Connection to memory failed.';
      setWizardError(detail);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <HeartHandshake color={Colors.purple} size={20} />
          </View>
          <View>
            <Text style={styles.headerTitle}>CAREGIVER SANCTUARY</Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === 'team'
                ? 'CAREGIVER TEAM MANAGEMENT'
                : `STEP 0${step + 1} OF 04 // PROTOCOL WIZARD`}
            </Text>
          </View>
        </View>

        {activeTab === 'team' && (
          <TouchableOpacity
            style={styles.alertHeaderBtn}
            onPress={handleEmergencyAlert}
            activeOpacity={0.8}
          >
            <Bell color="#fff" size={14} />
          </TouchableOpacity>
        )}
      </View>

      {/* Top Tabs: Team vs Memories */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[styles.topTab, activeTab === 'team' && styles.topTabActive]}
          onPress={() => setActiveTab('team')}
        >
          <Users color={activeTab === 'team' ? Colors.purple : Colors.textMuted} size={15} />
          <Text
            style={[
              styles.topTabText,
              activeTab === 'team' && { color: Colors.purple, fontWeight: '800' },
            ]}
          >
            CAREGIVER TEAM ({caregivers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTab, activeTab === 'memories' && styles.topTabActive]}
          onPress={() => setActiveTab('memories')}
        >
          <Sparkles color={activeTab === 'memories' ? Colors.cyan : Colors.textMuted} size={15} />
          <Text
            style={[
              styles.topTabText,
              activeTab === 'memories' && { color: Colors.cyan, fontWeight: '800' },
            ]}
          >
            REMEMBER LOVED ONE
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================== */}
      {/* TAB 1: CAREGIVERS TEAM                     */}
      {/* ========================================== */}
      {activeTab === 'team' && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {teamSuccess ? (
            <View style={styles.successBox}>
              <CheckCircle2 color={Colors.emerald} size={16} />
              <Text style={styles.successText}>{teamSuccess}</Text>
            </View>
          ) : null}

          {/* Quick Actions Row */}
          <View style={styles.teamActionsRow}>
            <TouchableOpacity
              style={styles.addCgBtn}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.8}
            >
              <UserPlus color="#060a12" size={16} />
              <Text style={styles.addCgBtnText}>ADD CAREGIVER</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.refreshCgBtn}
              onPress={fetchCaregivers}
              disabled={loadingCaregivers}
            >
              {loadingCaregivers ? (
                <ActivityIndicator color={Colors.purple} size="small" />
              ) : (
                <RefreshCw color={Colors.purple} size={16} />
              )}
            </TouchableOpacity>
          </View>

          {/* Caregivers List */}
          {caregivers.length === 0 && !loadingCaregivers ? (
            <View style={styles.emptyCard}>
              <Users color={Colors.purple} size={36} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>NO CAREGIVERS ENROLLED</Text>
              <Text style={styles.emptySub}>
                Add trusted family members or medical caregivers so they receive emergency alerts and assist with memory indexing.
              </Text>
            </View>
          ) : (
            caregivers.map((cg) => {
              const cgId = cg.id || cg.uid;
              return (
                <View key={cgId} style={styles.cgCard}>
                  <View style={styles.cgHeaderRow}>
                    <View style={styles.cgAvatarBox}>
                      {cg.image_base64 || cg.photoURL ? (
                        <Image
                          source={{
                            uri: (cg.image_base64 || cg.photoURL).startsWith('data:')
                              ? cg.image_base64 || cg.photoURL
                              : `data:image/jpeg;base64,${cg.image_base64 || cg.photoURL}`,
                          }}
                          style={styles.cgAvatarImg}
                        />
                      ) : (
                        <Shield color={Colors.purple} size={20} />
                      )}
                    </View>

                    <View style={styles.cgInfoCol}>
                      <Text style={styles.cgName}>{cg.name}</Text>
                      <View style={styles.cgBadge}>
                        <Text style={styles.cgBadgeText}>{cg.relation || 'Caregiver'}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteCgBtn}
                      onPress={() => handleDeleteCaregiver(cgId, cg.name)}
                    >
                      <Trash2 color={Colors.red} size={16} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.cgDetailsStrip}>
                    {cg.email ? (
                      <View style={styles.cgDetailItem}>
                        <Mail color={Colors.textMuted} size={12} />
                        <Text style={styles.cgDetailText}>{cg.email}</Text>
                      </View>
                    ) : null}
                    {cg.phone ? (
                      <View style={styles.cgDetailItem}>
                        <Phone color={Colors.textMuted} size={12} />
                        <Text style={styles.cgDetailText}>{cg.phone}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ========================================== */}
      {/* TAB 2: REMEMBER LOVED ONE WIZARD           */}
      {/* ========================================== */}
      {activeTab === 'memories' && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Step Progress Dots */}
          <View style={styles.progressRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressBar,
                  i === step && styles.progressBarActive,
                  i < step && styles.progressBarDone,
                ]}
              />
            ))}
          </View>

          {wizardError ? (
            <View style={styles.errorBox}>
              <AlertTriangle color={Colors.red} size={16} />
              <Text style={styles.errorText}>⚠️ [ALERT]: {wizardError}</Text>
            </View>
          ) : null}

          {wizardSuccess ? (
            <View style={styles.successBox}>
              <CheckCircle2 color={Colors.emerald} size={18} />
              <Text style={styles.successText}>{wizardSuccess}</Text>
            </View>
          ) : null}

          {/* STEP 0: NAME */}
          {step === 0 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 01 // IDENTITY PROTOCOL</Text>
              </View>
              <Text style={styles.questionTitle}>What is the person's name?</Text>
              <Text style={styles.questionDesc}>
                This identifier indexes their 512-D visual & conversational vectors.
              </Text>

              <TextInput
                style={styles.largeInput}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="TYPE FULL NAME..."
                placeholderTextColor={Colors.textDark}
                autoFocus
              />

              <TouchableOpacity style={styles.proceedBtn} onPress={handleNextStep}>
                <Text style={styles.proceedBtnText}>PROCEED</Text>
                <Check color="#fff" size={16} />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 1: RELATIONSHIP */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 02 // RELATIONSHIP LINK</Text>
              </View>
              <Text style={styles.questionTitle}>What is their relationship?</Text>
              <Text style={styles.questionDesc}>
                e.g. Sister, Primary Physician, Grandchild, Neighbor...
              </Text>

              <TextInput
                style={styles.largeInput}
                value={formData.relation}
                onChangeText={(text) => setFormData({ ...formData, relation: text })}
                placeholder="TYPE RELATIONSHIP..."
                placeholderTextColor={Colors.textDark}
                autoFocus
              />

              <View style={styles.twoButtonsRow}>
                <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(0)}>
                  <ArrowLeft color={Colors.textMuted} size={16} />
                  <Text style={styles.prevBtnText}>BACK</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.proceedBtn} onPress={handleNextStep}>
                  <Text style={styles.proceedBtnText}>PROCEED</Text>
                  <Check color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: OPTICAL PHOTO */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 03 // OPTICAL ENCODING</Text>
              </View>
              <Text style={styles.questionTitle}>Provide an Optical Portrait</Text>
              <Text style={styles.questionDesc}>
                A clear facial profile ensures 99.8% precision vector matching.
              </Text>

              {imageUri ? (
                <View style={styles.photoPreviewBox}>
                  <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="cover" />
                  <View style={styles.photoActions}>
                    <TouchableOpacity style={styles.replaceBtn} onPress={() => pickWizardPhoto(true)}>
                      <Text style={styles.replaceBtnText}>CAMERA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.replaceBtn} onPress={() => pickWizardPhoto(false)}>
                      <Text style={styles.replaceBtnText}>GALLERY</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.photoChoicesGrid}>
                  <TouchableOpacity style={styles.choiceCard} onPress={() => pickWizardPhoto(true)}>
                    <Camera color={Colors.purple} size={28} />
                    <Text style={styles.choiceCardTitle}>ACQUIRE LIVE SNAP</Text>
                    <Text style={styles.choiceCardSub}>OPTICAL VIEWPORT</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.choiceCard} onPress={() => pickWizardPhoto(false)}>
                    <ImageIcon color={Colors.cyan} size={28} />
                    <Text style={styles.choiceCardTitle}>UPLOAD LOCAL PHOTO</Text>
                    <Text style={styles.choiceCardSub}>JPG, PNG, WEBP</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.twoButtonsRow}>
                <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(1)}>
                  <ArrowLeft color={Colors.textMuted} size={16} />
                  <Text style={styles.prevBtnText}>BACK</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.proceedBtn, !imageUri && { opacity: 0.5 }]}
                  onPress={handleNextStep}
                  disabled={!imageUri}
                >
                  <Text style={styles.proceedBtnText}>PROCEED</Text>
                  <Check color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: AUDIO & FINAL NOTES */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 04 // VOCAL SIGNATURE & NOTES</Text>
              </View>
              <Text style={styles.questionTitle}>Vocal Profile & Memory Context</Text>
              <Text style={styles.questionDesc}>
                Optionally record their voice greeting and add helpful memory anchors.
              </Text>

              {/* Audio Voice Recorder */}
              <View style={{ marginVertical: 12 }}>
                <AudioRecorder onRecordingComplete={(uri) => setAudioUri(uri)} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>AGE (OPTIONAL)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.age}
                  onChangeText={(text) => setFormData({ ...formData, age: text })}
                  placeholder="e.g. 72"
                  placeholderTextColor={Colors.textDark}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PERSONAL NOTES / MEMORIES</Text>
                <TextInput
                  style={[styles.fieldInput, { height: 75, textAlignVertical: 'top' }]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="e.g. Loves gardening, lived in Chicago, drinks black tea..."
                  placeholderTextColor={Colors.textDark}
                  multiline
                />
              </View>

              <View style={styles.twoButtonsRow}>
                <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(2)}>
                  <ArrowLeft color={Colors.textMuted} size={16} />
                  <Text style={styles.prevBtnText}>BACK</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.commitBtn}
                  onPress={handleWizardSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#060a12" size="small" />
                  ) : (
                    <>
                      <Text style={styles.commitBtnText}>COMMIT IDENTITY</Text>
                      <Sparkles color="#060a12" size={16} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD NEW CAREGIVER                   */}
      {/* ========================================== */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <UserPlus color={Colors.purple} size={18} />
                <Text style={styles.modalTitle}>ENROLL NEW CAREGIVER</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X color={Colors.textMuted} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CAREGIVER FULL NAME</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  placeholderTextColor={Colors.textDark}
                  value={cgName}
                  onChangeText={setCgName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL (FOR LOGIN & ALERTS)</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="sarah@domain.com"
                  placeholderTextColor={Colors.textDark}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={cgEmail}
                  onChangeText={setCgEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PHONE NUMBER (OPTIONAL)</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={Colors.textDark}
                  keyboardType="phone-pad"
                  value={cgPhone}
                  onChangeText={setCgPhone}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>RELATIONSHIP ROLE</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Primary Caregiver, Daughter, Nurse..."
                  placeholderTextColor={Colors.textDark}
                  value={cgRelation}
                  onChangeText={setCgRelation}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PORTAL PASSWORD</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Temporary password"
                  placeholderTextColor={Colors.textDark}
                  secureTextEntry
                  value={cgPassword}
                  onChangeText={setCgPassword}
                />
              </View>

              {/* Optional Face Photo */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>OPTICAL FACE PHOTO (OPTIONAL)</Text>
                <Text style={styles.inputSub}>
                  Enables the patient assistant to recognize the caregiver on sight.
                </Text>

                {cgPhotoUri ? (
                  <View style={styles.photoPreviewBox}>
                    <Image source={{ uri: cgPhotoUri }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={{ marginTop: 6 }}
                      onPress={() => setCgPhotoUri(null)}
                    >
                      <Text style={{ color: Colors.red, fontSize: 10, fontWeight: '700' }}>
                        REMOVE
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoChoicesGrid}>
                    <TouchableOpacity
                      style={styles.choiceCard}
                      onPress={() => pickCgPhoto(true)}
                    >
                      <Camera color={Colors.purple} size={20} />
                      <Text style={styles.choiceCardTitle}>CAMERA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.choiceCard}
                      onPress={() => pickCgPhoto(false)}
                    >
                      <ImageIcon color={Colors.cyan} size={20} />
                      <Text style={styles.choiceCardTitle}>GALLERY</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.saveCgBtn, savingCg && { opacity: 0.6 }]}
                onPress={handleSaveCaregiver}
                disabled={savingCg}
                activeOpacity={0.8}
              >
                {savingCg ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.saveCgBtnText}>SAVE CAREGIVER ACCOUNT</Text>
                    <Check color="#fff" size={16} />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* In-App Optical Camera Scanner Viewport */}
      {showInAppScanner && (
        <CameraScanner
          mode="person"
          onCapture={handleInAppCapture}
          onClose={() => setShowInAppScanner(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: Colors.purple,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  alertHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  topTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  topTabActive: {
    backgroundColor: Colors.surface,
  },
  topTabText: {
    color: Colors.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  teamActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  addCgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.purple,
    borderRadius: 12,
    paddingVertical: 12,
  },
  addCgBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  refreshCgBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  emptySub: {
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
  cgCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    marginBottom: 10,
  },
  cgHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cgAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cgAvatarImg: {
    width: 44,
    height: 44,
  },
  cgInfoCol: {
    flex: 1,
  },
  cgName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  cgBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
  },
  cgBadgeText: {
    color: Colors.purple,
    fontSize: 8.5,
    fontWeight: '700',
  },
  deleteCgBtn: {
    padding: 8,
  },
  cgDetailsStrip: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  cgDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cgDetailText: {
    color: Colors.textSecondary,
    fontSize: 10.5,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderSubtle,
  },
  progressBarActive: {
    backgroundColor: Colors.purple,
  },
  progressBarDone: {
    backgroundColor: Colors.emerald,
  },
  stepContainer: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 18,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  stepBadgeText: {
    color: Colors.purple,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  questionTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 4,
  },
  questionDesc: {
    color: Colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
    marginBottom: 12,
  },
  largeInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    borderRadius: 12,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  proceedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.purple,
    borderRadius: 12,
    paddingVertical: 14,
  },
  proceedBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  twoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  prevBtnText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  photoChoicesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  choiceCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  choiceCardTitle: {
    color: Colors.textPrimary,
    fontSize: 9.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  choiceCardSub: {
    color: Colors.textMuted,
    fontSize: 7.5,
  },
  photoPreviewBox: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    padding: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  photoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 10,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  replaceBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  replaceBtnText: {
    color: Colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: Colors.purple,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputSub: {
    color: Colors.textMuted,
    fontSize: 9.5,
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 10,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12.5,
  },
  commitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.cyan,
    borderRadius: 12,
    paddingVertical: 14,
  },
  commitBtnText: {
    color: '#060a12',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Colors.redBorder,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.red,
    fontSize: 11,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  successText: {
    color: Colors.emerald,
    fontSize: 11,
    flex: 1,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 12, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0c1322',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  saveCgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.purple,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  saveCgBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
