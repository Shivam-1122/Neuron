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
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import { UserPlus, PackagePlus, X, Camera, Image as ImageIcon, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import AudioRecorder from './AudioRecorder';
import { rememberPersonApi, rememberObjectApi } from '../api/client';

export default function EnrollmentModal({ visible, onClose, initialType = 'person', onEnrollSuccess }) {
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

  const isPerson = enrollType === 'person';

  // Photo from camera or gallery
  const pickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Denied', 'Camera access needed.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          base64: true,
        });
      } else {
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
        setStatusMessage(`Successfully encoded 512-D vectors for ${name}.`);
        if (onEnrollSuccess) onEnrollSuccess(res);
      } else {
        const res = await rememberObjectApi({
          name: name.trim(),
          notes: notes.trim(),
          imageUri,
        });
        setStatusMessage(`Successfully registered ${name} in spatial memory.`);
        if (onEnrollSuccess) onEnrollSuccess(res);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setStatusMessage(null);
        resetForm();
        onClose();
      }, 1800);
    } catch (err) {
      setIsSubmitting(false);
      const detail = err.response?.data?.detail || err.message || 'Enrollment failed. Ensure face is clearly visible.';
      setErrorMessage(detail);
    }
  };

  const resetForm = () => {
    setName('');
    setRelation('Family');
    setAge('');
    setNotes('');
    setImageUri(null);
    setAudioUri(null);
    setErrorMessage(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              {isPerson ? <UserPlus color={Colors.cyan} size={20} /> : <PackagePlus color={Colors.amber} size={20} />}
              <Text style={[styles.title, { color: isPerson ? Colors.cyan : Colors.amber }]}>
                {isPerson ? 'BIOMETRIC IDENTITY ENROLLMENT' : 'OBJECT TELEMETRY ENROLLMENT'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={Colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          {/* Type Selector Tabs */}
          <View style={styles.typeTabsRow}>
            <TouchableOpacity
              style={[styles.typeTab, isPerson && styles.typeTabActivePerson]}
              onPress={() => setEnrollType('person')}
            >
              <Text style={[styles.typeTabText, isPerson && { color: Colors.cyan }]}>PERSON / CONTACT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeTab, !isPerson && styles.typeTabActiveObject]}
              onPress={() => setEnrollType('object')}
            >
              <Text style={[styles.typeTabText, !isPerson && { color: Colors.amber }]}>OBJECT / MEDICINE</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Error / Status banners */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <AlertTriangle color={Colors.red} size={16} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {statusMessage && (
              <View style={styles.successBanner}>
                <CheckCircle2 color={Colors.emerald} size={16} />
                <Text style={styles.successText}>{statusMessage}</Text>
              </View>
            )}

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{isPerson ? 'FULL NAME / IDENTITY' : 'OBJECT NAME'}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={isPerson ? 'e.g. Dr. Sarah Miller, Sister Emily' : 'e.g. Heart Pill Bottle, House Keys'}
                placeholderTextColor={Colors.textDark}
              />
            </View>

            {/* Relation / Category (if Person) */}
            {isPerson && (
              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.inputLabel}>RELATIONSHIP</Text>
                  <TextInput
                    style={styles.input}
                    value={relation}
                    onChangeText={setRelation}
                    placeholder="e.g. Daughter, Doctor, Caregiver"
                    placeholderTextColor={Colors.textDark}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>AGE (OPT)</Text>
                  <TextInput
                    style={styles.input}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    placeholder="e.g. 42"
                    placeholderTextColor={Colors.textDark}
                  />
                </View>
              </View>
            )}

            {/* Notes / Context */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MEMORY CONTEXT & NOTES</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder={isPerson ? 'e.g. Visits on Tuesdays, brings fresh flowers, likes jazz' : 'e.g. Usually kept in nightstand drawer'}
                placeholderTextColor={Colors.textDark}
              />
            </View>

            {/* Photo Acquisition */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>OPTICAL PORTRAIT</Text>
              {imageUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                  <View style={styles.previewButtonsRow}>
                    <TouchableOpacity style={styles.retakeBtn} onPress={() => pickImage(true)}>
                      <Text style={styles.retakeBtnText}>RETAKE CAMERA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.retakeBtn} onPress={() => pickImage(false)}>
                      <Text style={styles.retakeBtnText}>REPLACE FILE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.photoActionRow}>
                  <TouchableOpacity style={styles.photoChoiceBtn} onPress={() => pickImage(true)}>
                    <Camera color={Colors.cyan} size={22} />
                    <Text style={styles.photoChoiceText}>LIVE SNAP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoChoiceBtn} onPress={() => pickImage(false)}>
                    <ImageIcon color={Colors.cyan} size={22} />
                    <Text style={styles.photoChoiceText}>GALLERY</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Audio Voice Sample (Person only) */}
            {isPerson && (
              <AudioRecorder
                label="AUDIO SIGNATURE (OPTIONAL VOICE SAMPLE)"
                onRecordingComplete={setAudioUri}
              />
            )}
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
            onPress={handleEnroll}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#060a12" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>COMMIT TO VECTOR MEMORY</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    padding: 20,
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  typeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  typeTabActivePerson: {
    borderColor: Colors.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  typeTabActiveObject: {
    borderColor: Colors.amber,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  typeTabText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    maxHeight: 420,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.red,
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  successText: {
    color: Colors.emerald,
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoChoiceBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.cyanBorder,
    gap: 6,
  },
  photoChoiceText: {
    color: Colors.cyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  previewContainer: {
    alignItems: 'center',
    gap: 8,
  },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cyan,
  },
  previewButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  retakeBtnText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Colors.cyan,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  submitBtnText: {
    color: '#060a12',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
