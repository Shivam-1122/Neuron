import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import {
  UserPlus,
  PackagePlus,
  X,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react-native';
import AudioRecorder from './AudioRecorder';
import CameraScanner from './CameraScanner';
import { rememberPersonApi, rememberObjectApi } from '../api/client';
import sound from '../utils/soundEngine';

export default function EnrollmentModal({
  visible,
  onClose,
  initialType = 'person',
  onEnrollSuccess,
}) {
  const [enrollType, setEnrollType] = useState(initialType);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Family');
  const [age, setAge] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showInAppCamera, setShowInAppCamera] = useState(false);

  const isPerson = enrollType === 'person';

  // Pick photo from gallery or launch system camera
  const pickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        setShowInAppCamera(true);
        return;
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Denied', 'Gallery access is needed to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setErrorMessage(null);
      }
    } catch (err) {
      console.warn('Image picker note:', err);
    }
  };

  const handleInAppCapture = (uri) => {
    setImageUri(uri);
    setShowInAppCamera(false);
    setErrorMessage(null);
  };

  const handleEnroll = async () => {
    if (!name.trim()) {
      setErrorMessage('Please specify an identifier name.');
      return;
    }
    if (!imageUri) {
      setErrorMessage('Please capture or choose an optical portrait.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    sound.playCardFlip();

    try {
      if (isPerson) {
        const res = await rememberPersonApi({
          name: name.trim(),
          relation: relation.trim(),
          age: age ? parseInt(age) : null,
          notes: notes.trim(),
          imageUri,
          audioUri,
        });
        sound.playMatchSuccess();
        setStatusMessage(`Successfully encoded 512-D vectors for ${name}.`);
        if (onEnrollSuccess) onEnrollSuccess(res);
      } else {
        const res = await rememberObjectApi({
          name: name.trim(),
          notes: notes.trim(),
          imageUri,
        });
        sound.playMatchSuccess();
        setStatusMessage(`Successfully registered ${name} in spatial memory.`);
        if (onEnrollSuccess) onEnrollSuccess(res);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setStatusMessage(null);
        setName('');
        setNotes('');
        setAge('');
        setImageUri(null);
        setAudioUri(null);
        onClose();
      }, 1400);
    } catch (err) {
      setIsSubmitting(false);
      sound.playTryAgain();
      const detail = err.response?.data?.detail || err.message || 'Connection to memory core failed.';
      setErrorMessage(detail);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              {isPerson ? (
                <UserPlus color={Colors.cyan} size={15} />
              ) : (
                <PackagePlus color={Colors.amber} size={15} />
              )}
              <Text style={styles.title}>
                {isPerson ? 'ENROLL NEW LOVED ONE' : 'REGISTER ITEM MEMORY'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X color={Colors.textMuted} size={15} />
            </TouchableOpacity>
          </View>

          {/* Type Toggle Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, isPerson && styles.tabActive]}
              onPress={() => {
                setEnrollType('person');
                setErrorMessage(null);
              }}
            >
              <Text style={[styles.tabText, isPerson && { color: Colors.cyan, fontWeight: '800' }]}>
                Loved One / Caregiver
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isPerson && styles.tabActive]}
              onPress={() => {
                setEnrollType('object');
                setErrorMessage(null);
              }}
            >
              <Text style={[styles.tabText, !isPerson && { color: Colors.amber, fontWeight: '800' }]}>
                Everyday Item (Keys/Wallet)
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* Feedback Banners */}
            {errorMessage ? (
              <View style={styles.bannerError}>
                <AlertTriangle color={Colors.red} size={12} />
                <Text style={styles.bannerErrorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {statusMessage ? (
              <View style={styles.bannerSuccess}>
                <CheckCircle2 color={Colors.emerald} size={12} />
                <Text style={styles.bannerSuccessText}>{statusMessage}</Text>
              </View>
            ) : null}

            {/* Input Fields */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {isPerson ? 'FULL NAME / IDENTITY' : 'ITEM NAME'}
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={isPerson ? 'e.g. Sarah Vance' : 'e.g. Leather Wallet'}
                placeholderTextColor={Colors.textDark}
              />
            </View>

            {isPerson ? (
              <>
                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>RELATIONSHIP</Text>
                    <TextInput
                      style={styles.input}
                      value={relation}
                      onChangeText={setRelation}
                      placeholder="e.g. Daughter"
                      placeholderTextColor={Colors.textDark}
                    />
                  </View>
                  <View style={[styles.fieldGroup, { width: 70 }]}>
                    <Text style={styles.fieldLabel}>AGE</Text>
                    <TextInput
                      style={styles.input}
                      value={age}
                      onChangeText={setAge}
                      placeholder="42"
                      placeholderTextColor={Colors.textDark}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {isPerson ? 'NOTES (VOICE NARRATION)' : 'USUAL LOCATION & NOTES'}
              </Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder={
                  isPerson
                    ? 'e.g. Lives in Seattle, visits every Sunday at 2 PM.'
                    : 'e.g. Kept on the wooden hallway credenza by the front door.'
                }
                placeholderTextColor={Colors.textDark}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Photo Attachment */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>OPTICAL PORTRAIT / ITEM PHOTO</Text>
              {imageUri ? (
                <View style={styles.imagePreviewRow}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={styles.photoActionBtn}
                      onPress={() => pickImage(true)}
                    >
                      <Camera size={11} color={Colors.cyan} />
                      <Text style={styles.photoActionBtnText}>RETAKE CAMERA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoActionBtn}
                      onPress={() => pickImage(false)}
                    >
                      <ImageIcon size={11} color={Colors.cyan} />
                      <Text style={styles.photoActionBtnText}>FROM GALLERY</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.photoBtnGrid}>
                  <TouchableOpacity
                    style={[styles.photoCard, { borderColor: Colors.cyanBorder }]}
                    onPress={() => pickImage(true)}
                    activeOpacity={0.8}
                  >
                    <Camera size={20} color={Colors.cyan} />
                    <Text style={[styles.photoCardTitle, { color: Colors.cyan }]}>
                      LIVE CAMERA
                    </Text>
                    <Text style={styles.photoCardSub}>Take snapshot now</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.photoCard, { borderColor: Colors.borderSubtle }]}
                    onPress={() => pickImage(false)}
                    activeOpacity={0.8}
                  >
                    <ImageIcon size={20} color={Colors.textMuted} />
                    <Text style={styles.photoCardTitle}>DEVICE GALLERY</Text>
                    <Text style={styles.photoCardSub}>Choose existing</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Audio Voice Signature (For Persons) */}
            {isPerson && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>VOICE SIGNATURE (OPTIONAL)</Text>
                <AudioRecorder onRecordingComplete={(uri) => setAudioUri(uri)} />
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleEnroll}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isPerson ? 'INDEX TO NEURAL MEMORY' : 'REGISTER ITEM TO MEMORY'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* In-App Camera Scanner Viewport */}
          {showInAppCamera && (
            <CameraScanner
              mode={isPerson ? 'person' : 'object'}
              onCapture={handleInAppCapture}
              onClose={() => setShowInAppCamera(false)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#111318',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    maxHeight: '90%',
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
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0c0e14',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.cyan,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 14,
    gap: 10,
    paddingBottom: 28,
  },
  bannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  bannerErrorText: {
    color: Colors.red,
    fontSize: 9,
    fontWeight: '700',
    flex: 1,
  },
  bannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  bannerSuccessText: {
    color: Colors.emerald,
    fontSize: 9,
    fontWeight: '700',
    flex: 1,
  },
  fieldGroup: {
    gap: 4,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  input: {
    height: 36,
    backgroundColor: '#16181f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    color: Colors.textPrimary,
    fontSize: 10.5,
    paddingHorizontal: 10,
  },
  multilineInput: {
    height: 52,
    textAlignVertical: 'top',
    paddingVertical: 7,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#16181f',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  previewImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  imageActions: {
    flex: 1,
    gap: 4,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  photoActionBtnText: {
    color: Colors.cyan,
    fontSize: 8,
    fontWeight: '800',
  },
  photoBtnGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  photoCard: {
    flex: 1,
    backgroundColor: '#16181f',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 3,
  },
  photoCardTitle: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  photoCardSub: {
    color: Colors.textMuted,
    fontSize: 7.5,
  },
  submitBtn: {
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
