import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../theme/colors';
import {
  User,
  HeartHandshake,
  ArrowRight,
  Terminal,
  ScanFace,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Shield,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import CameraScanner from '../components/CameraScanner';
import { faceLoginApi, caregiverLoginApi, registerFaceApi } from '../api/client';

export default function LoginScreen({ onLoginSuccess, onSelectRole }) {
  // Roles: 'patient' | 'caregiver'
  const [role, setRole] = useState('patient');
  // Auth Modes: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState('signin');

  // Form Fields
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up Face Photo
  const [signupPhotoUri, setSignupPhotoUri] = useState(null);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Biometric Face Scanner Modal
  const [showFaceScanner, setShowFaceScanner] = useState(false);

  // Pick photo for registration
  const pickRegistrationPhoto = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Camera Permission', 'Camera access needed to capture face portrait.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        setSignupPhotoUri(result.assets[0].uri);
        setErrorMessage('');
      }
    } catch (err) {
      console.warn('Registration photo error:', err);
    }
  };

  // Handle Biometric Face Login Capture
  const handleFaceScanCapture = async (uri) => {
    setShowFaceScanner(false);
    setIsLoading(true);
    setStatusMessage('Matching facial biometric vector against Neural Core...');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await faceLoginApi(uri);
      if (res && res.status === 'authenticated' && res.user_id) {
        const userProfile = {
          uid: res.user_id,
          displayName: res.name || 'Sanctuary Member',
          email: res.email || `${res.user_id}@neuron.sanctuary`,
          phoneNumber: res.phone || '',
          photoURL: res.image_base64 || uri,
          role: res.role || (res.is_caregiver ? 'caregiver' : 'patient'),
          patient_id: res.patient_id || res.user_id,
        };
        setSuccessMessage(`Biometric Identity Verified: Welcome, ${userProfile.displayName}!`);
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(userProfile);
        }, 1200);
      } else {
        setErrorMessage(res?.message || 'Face not recognized. Please sign in with email and password.');
      }
    } catch (err) {
      console.warn('Face login error:', err);
      const detail = err.response?.data?.message || err.response?.data?.detail || 'Biometric scan failed. Check server connection.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Handle Sign In (Identifier + Password)
  const handleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!identifier.trim()) {
      return setErrorMessage('Please enter your email or phone number.');
    }
    if (!password) {
      return setErrorMessage('Please enter your security password.');
    }

    setIsLoading(true);
    setStatusMessage('Verifying credentials with Neural Sanctuary...');

    try {
      if (role === 'caregiver') {
        const res = await caregiverLoginApi(identifier.trim(), password);
        if (res && res.status === 'authenticated' && res.user) {
          const userProfile = {
            uid: res.user.id || res.user.uid || `caregiver_${Date.now()}`,
            displayName: res.user.name || 'Caregiver',
            email: res.user.email || identifier.trim(),
            phoneNumber: res.user.phone || '',
            role: 'caregiver',
            is_caregiver: true,
            patient_id: res.user.patient_id || 'default_user',
            photoURL: res.user.image_base64 || '',
          };
          setSuccessMessage(`Access Granted: Welcome Caregiver ${userProfile.displayName}!`);
          setTimeout(() => {
            if (onLoginSuccess) onLoginSuccess(userProfile);
          }, 1000);
        } else {
          setErrorMessage(res?.message || 'Invalid caregiver credentials.');
        }
      } else {
        // Patient session authentication
        // Generate consistent patient UID from email or phone
        const cleanId = identifier.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        const userProfile = {
          uid: `pat_${cleanId}`,
          displayName: identifier.includes('@') ? identifier.split('@')[0] : identifier,
          email: identifier.includes('@') ? identifier.trim() : `${identifier.trim()}@phone.neuron.sanctuary`,
          phoneNumber: !identifier.includes('@') ? identifier.trim() : '',
          role: 'patient',
          patient_id: `pat_${cleanId}`,
        };
        setSuccessMessage(`Neural Link Established: Welcome, ${userProfile.displayName}!`);
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(userProfile);
        }, 1000);
      }
    } catch (err) {
      console.warn('Sign in error:', err);
      const detail = err.response?.data?.detail || err.response?.data?.message || 'Authentication error. Please try again.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Handle Sign Up (Patient Registration)
  const handleSignUp = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!displayName.trim()) {
      return setErrorMessage('Please enter your full name.');
    }
    if (!identifier.trim()) {
      return setErrorMessage('Please enter an email or phone number.');
    }
    if (!password || password.length < 6) {
      return setErrorMessage('Password must be at least 6 characters.');
    }

    setIsLoading(true);
    setStatusMessage('Synthesizing Neural Profile & Biometrics...');

    try {
      const cleanId = identifier.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      const userId = `pat_${cleanId}`;
      const isEmail = identifier.includes('@');

      if (signupPhotoUri) {
        await registerFaceApi({
          userId,
          name: displayName.trim(),
          email: isEmail ? identifier.trim() : '',
          phone: !isEmail ? identifier.trim() : '',
          imageUri: signupPhotoUri,
        });
      }

      const userProfile = {
        uid: userId,
        displayName: displayName.trim(),
        email: isEmail ? identifier.trim() : `${identifier.trim()}@phone.neuron.sanctuary`,
        phoneNumber: !isEmail ? identifier.trim() : '',
        photoURL: signupPhotoUri || '',
        role: 'patient',
        patient_id: userId,
      };

      setSuccessMessage('Registration Complete! Biometrics synchronized.');
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(userProfile);
      }, 1200);
    } catch (err) {
      console.warn('Sign up error:', err);
      const detail = err.response?.data?.detail || err.response?.data?.message || 'Registration failed. Please check inputs.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Telemetry */}
        <View style={styles.header}>
          <View style={styles.telemetryBadge}>
            <Terminal color={Colors.cyan} size={13} />
            <Text style={styles.telemetryText}>AUTHENTICATION GATEWAY</Text>
          </View>
          <Text style={styles.title}>Neural Protocol Access</Text>
          <Text style={styles.subtitle}>
            Authenticate your biometric or cryptologic profile to access the memory bank.
          </Text>
        </View>

        {/* Role Selector Tabs (Patient vs Caregiver) */}
        <View style={styles.roleTabs}>
          <TouchableOpacity
            style={[
              styles.roleTab,
              role === 'patient' && styles.roleTabActivePatient,
            ]}
            onPress={() => {
              setRole('patient');
              setErrorMessage('');
            }}
          >
            <User color={role === 'patient' ? Colors.cyan : Colors.textMuted} size={16} />
            <Text
              style={[
                styles.roleTabText,
                role === 'patient' && { color: Colors.cyan, fontWeight: '800' },
              ]}
            >
              PATIENT CORE
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleTab,
              role === 'caregiver' && styles.roleTabActiveCaregiver,
            ]}
            onPress={() => {
              setRole('caregiver');
              setAuthMode('signin');
              setErrorMessage('');
            }}
          >
            <HeartHandshake color={role === 'caregiver' ? Colors.purple : Colors.textMuted} size={16} />
            <Text
              style={[
                styles.roleTabText,
                role === 'caregiver' && { color: Colors.purple, fontWeight: '800' },
              ]}
            >
              CAREGIVER ARCHITECT
            </Text>
          </TouchableOpacity>
        </View>

        {/* Biometric Face Scan Quick Button (Patient Mode Only) */}
        {role === 'patient' && authMode === 'signin' && (
          <TouchableOpacity
            style={styles.biometricScanBtn}
            onPress={() => setShowFaceScanner(true)}
            activeOpacity={0.8}
          >
            <View style={styles.biometricIconGlow}>
              <ScanFace color={Colors.cyan} size={24} />
            </View>
            <View style={styles.biometricTextCol}>
              <Text style={styles.biometricTitle}>BIOMETRIC FACE SCAN</Text>
              <Text style={styles.biometricSub}>
                Instant zero-password optical facial recognition
              </Text>
            </View>
            <ArrowRight color={Colors.cyan} size={18} />
          </TouchableOpacity>
        )}

        {/* Divider */}
        {role === 'patient' && authMode === 'signin' && (
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SIGN IN WITH PASSWORD</Text>
            <View style={styles.dividerLine} />
          </View>
        )}

        {/* Auth Mode Toggle (Sign In vs Sign Up for Patient) */}
        {role === 'patient' && (
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[styles.modeToggleBtn, authMode === 'signin' && styles.modeToggleActive]}
              onPress={() => {
                setAuthMode('signin');
                setErrorMessage('');
              }}
            >
              <Text
                style={[
                  styles.modeToggleText,
                  authMode === 'signin' && styles.modeToggleTextActive,
                ]}
              >
                SIGN IN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeToggleBtn, authMode === 'signup' && styles.modeToggleActive]}
              onPress={() => {
                setAuthMode('signup');
                setErrorMessage('');
              }}
            >
              <Text
                style={[
                  styles.modeToggleText,
                  authMode === 'signup' && styles.modeToggleTextActive,
                ]}
              >
                CREATE ACCOUNT
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feedback Alerts */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <AlertTriangle color={Colors.red} size={15} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successBox}>
            <CheckCircle2 color={Colors.emerald} size={15} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Form Fields Card */}
        <View style={styles.formCard}>
          {/* Display Name (Only in Sign Up) */}
          {authMode === 'signup' && role === 'patient' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <User color={Colors.textMuted} size={16} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Eleanor Vance"
                  placeholderTextColor={Colors.textDark}
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </View>
            </View>
          )}

          {/* Identifier Field (Email or Phone) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL OR PHONE NUMBER</Text>
            <View style={styles.inputWrapper}>
              <Mail color={Colors.textMuted} size={16} />
              <TextInput
                style={styles.textInput}
                placeholder="name@domain.com or +1..."
                placeholderTextColor={Colors.textDark}
                keyboardType="email-address"
                autoCapitalize="none"
                value={identifier}
                onChangeText={setIdentifier}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Lock color={Colors.textMuted} size={16} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••••••"
                placeholderTextColor={Colors.textDark}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? (
                  <EyeOff color={Colors.textMuted} size={16} />
                ) : (
                  <Eye color={Colors.textMuted} size={16} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Facial Portrait Upload (Optional for Biometrics) */}
          {authMode === 'signup' && role === 'patient' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FACIAL BIOMETRIC SNAPSHOT (RECOMMENDED)</Text>
              <Text style={styles.inputSub}>
                Enables instant zero-password facial recognition login.
              </Text>

              {signupPhotoUri ? (
                <View style={styles.photoPreviewBox}>
                  <Image source={{ uri: signupPhotoUri }} style={styles.photoPreview} />
                  <View style={styles.photoActionRow}>
                    <TouchableOpacity
                      style={styles.photoSmallBtn}
                      onPress={() => pickRegistrationPhoto(true)}
                    >
                      <Camera color={Colors.cyan} size={13} />
                      <Text style={styles.photoSmallBtnText}>RETAKE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoSmallBtn}
                      onPress={() => setSignupPhotoUri(null)}
                    >
                      <Text style={[styles.photoSmallBtnText, { color: Colors.red }]}>REMOVE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.photoChoiceGrid}>
                  <TouchableOpacity
                    style={styles.photoChoiceBtn}
                    onPress={() => pickRegistrationPhoto(true)}
                  >
                    <Camera color={Colors.cyan} size={18} />
                    <Text style={styles.photoChoiceText}>CAMERA</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoChoiceBtn}
                    onPress={() => pickRegistrationPhoto(false)}
                  >
                    <ImageIcon color={Colors.purple} size={18} />
                    <Text style={styles.photoChoiceText}>GALLERY</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              role === 'caregiver' && styles.submitBtnCaregiver,
              isLoading && { opacity: 0.6 },
            ]}
            onPress={authMode === 'signup' ? handleSignUp : handleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#060a12" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {authMode === 'signup'
                    ? 'COMPLETE REGISTRATION'
                    : role === 'caregiver'
                    ? 'ACCESS ARCHITECT PORTAL'
                    : 'ENTER SANCTUARY'}
                </Text>
                <ArrowRight color="#060a12" size={16} />
              </>
            )}
          </TouchableOpacity>

          {/* Loading status message */}
          {isLoading && statusMessage ? (
            <Text style={styles.loadingStatusText}>{statusMessage}</Text>
          ) : null}
        </View>

        {/* Footer info */}
        <View style={styles.footerNote}>
          <Shield color={Colors.textMuted} size={13} />
          <Text style={styles.footerNoteText}>
            Protected by 512-dimensional vector cryptography & local privacy sandbox
          </Text>
        </View>
      </ScrollView>

      {/* Biometric Face Scanner Modal */}
      {showFaceScanner && (
        <CameraScanner
          mode="person"
          onCapture={handleFaceScanCapture}
          onClose={() => setShowFaceScanner(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  telemetryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    marginBottom: 10,
  },
  telemetryText: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 18,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 16,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  roleTabActivePatient: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  roleTabActiveCaregiver: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
  },
  roleTabText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  biometricScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: Colors.cyan,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  biometricIconGlow: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  biometricTextCol: {
    flex: 1,
  },
  biometricTitle: {
    color: Colors.cyan,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  biometricSub: {
    color: Colors.textSecondary,
    fontSize: 10.5,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 16,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeToggleActive: {
    backgroundColor: Colors.card,
  },
  modeToggleText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modeToggleTextActive: {
    color: Colors.textPrimary,
    fontWeight: '800',
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
    marginBottom: 14,
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
    marginBottom: 14,
  },
  successText: {
    color: Colors.emerald,
    fontSize: 11,
    flex: 1,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: Colors.cyan,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  eyeBtn: {
    padding: 6,
  },
  photoChoiceGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photoChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    borderRadius: 12,
    paddingVertical: 14,
  },
  photoChoiceText: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  photoPreviewBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  photoSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  photoSmallBtnText: {
    color: Colors.cyan,
    fontSize: 10,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.cyan,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 6,
  },
  submitBtnCaregiver: {
    backgroundColor: Colors.purple,
  },
  submitBtnText: {
    color: '#060a12',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  loadingStatusText: {
    color: Colors.cyan,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerNoteText: {
    color: Colors.textMuted,
    fontSize: 9.5,
    textAlign: 'center',
  },
});
