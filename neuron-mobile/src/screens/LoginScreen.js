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
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Colors } from '../theme/colors';
import {
  User,
  HeartHandshake,
  ArrowRight,
  ScanFace,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Shield,
  Camera,
  RotateCcw,
} from 'lucide-react-native';
import CameraScanner from '../components/CameraScanner';
import { faceLoginApi, registerFaceApi } from '../api/client';
import sound from '../utils/soundEngine';

export default function LoginScreen({ onLoginSuccess, onSelectRole }) {
  // Modes: 'signin' | 'signup' | 'face'
  const [mode, setMode] = useState('signin');
  // Roles: 'patient' | 'caregiver'
  const [role, setRole] = useState('patient');

  // Fields
  const [displayName, setDisplayName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupPhoto, setSignupPhoto] = useState(null);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPurpose, setCameraPurpose] = useState('face_login'); // 'face_login' | 'signup_portrait'

  // Quick 1-Tap Demo Logins
  const handleQuickDemoPatient = () => {
    sound.playHarmonicChord();
    const demoUser = {
      uid: 'patient_eleanor_vance',
      displayName: 'Eleanor Vance',
      email: 'eleanor@neuron.sanctuary',
      role: 'patient',
    };
    onLoginSuccess(demoUser);
  };

  const handleQuickDemoCaregiver = () => {
    sound.playHarmonicChord();
    const demoCaregiver = {
      uid: 'caregiver_sarah_vance',
      displayName: 'Sarah Vance',
      email: 'sarah.caregiver@neuron.sanctuary',
      role: 'caregiver',
      patient_id: 'patient_eleanor_vance',
    };
    onLoginSuccess(demoCaregiver);
  };

  // Sign In handler (Email or Phone + Password, NO OTP)
  const handleSignIn = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or phone number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    sound.playCardFlip();

    try {
      setTimeout(() => {
        setIsLoading(false);
        sound.playMatchSuccess();
        const isPhone = !identifier.includes('@');
        onLoginSuccess({
          uid: `user_${identifier.replace(/[^a-zA-Z0-9]/g, '_')}`,
          displayName: isPhone ? `Member (${identifier})` : identifier.split('@')[0],
          email: !isPhone ? identifier : '',
          phoneNumber: isPhone ? identifier : '',
          role,
        });
      }, 500);
    } catch (e) {
      setIsLoading(false);
      setErrorMessage('Could not complete sign in.');
    }
  };

  // Sign Up handler
  const handleSignUp = async () => {
    if (!displayName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or phone number.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    sound.playCardFlip();

    try {
      const uid = `user_${Date.now()}`;
      const isPhone = !identifier.includes('@');

      if (signupPhoto) {
        setStatusMessage('Registering biometric face vector in Qdrant...');
        try {
          await registerFaceApi({
            userId: uid,
            name: displayName.trim(),
            email: !isPhone ? identifier.trim() : undefined,
            phone: isPhone ? identifier.trim() : undefined,
            imageUri: signupPhoto,
          });
        } catch (faceErr) {
          console.warn('Face embedding note:', faceErr);
        }
      }

      setIsLoading(false);
      sound.playVictory();
      Alert.alert('Account Created', `Welcome to Neuron, ${displayName}!`, [
        {
          text: 'Enter Sanctuary',
          onPress: () => {
            onLoginSuccess({
              uid,
              displayName: displayName.trim(),
              email: !isPhone ? identifier.trim() : '',
              phoneNumber: isPhone ? identifier.trim() : '',
              role,
              photoUri: signupPhoto,
            });
          },
        },
      ]);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Account creation failed.');
    }
  };

  // Face Scan Login
  const handleCameraCapture = async (uri) => {
    setShowCamera(false);

    if (cameraPurpose === 'signup_portrait') {
      setSignupPhoto(uri);
      return;
    }

    setIsLoading(true);
    setStatusMessage('Matching facial biometric vector with Neural Core...');
    setErrorMessage('');

    try {
      const res = await faceLoginApi(uri);
      if (res && res.status === 'authenticated' && res.user_id) {
        sound.playMatchSuccess();
        onLoginSuccess({
          uid: res.user_id,
          displayName: res.name || res.user_id,
          role: 'patient',
        });
      } else {
        sound.playTryAgain();
        Alert.alert(
          'Biometric Verification',
          res?.message || 'Face not recognized in memory core. You can sign in with password or use quick demo.',
          [
            { text: 'Try Quick Demo', onPress: handleQuickDemoPatient },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch (err) {
      sound.playTryAgain();
      Alert.alert('Verification Note', 'Cortex unreachable or face not found. Enter demo patient?', [
        { text: 'Enter Demo', onPress: handleQuickDemoPatient },
        { text: 'Cancel', style: 'cancel' },
      ]);
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Title Header */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Cognitive Sanctuary</Text>
          <Text style={styles.subtitle}>
            Secure biometric access and caregiver support core
          </Text>
        </View>

        {/* 1-Tap Quick Demo Box */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <Sparkles size={12} color={Colors.amber} />
            <Text style={styles.demoTitle}>QUICK DEMO ACCESS (1-TAP)</Text>
          </View>
          <Text style={styles.demoDesc}>
            Instant login pre-loaded with memories, photos, and caregiver team:
          </Text>
          <View style={styles.demoBtnRow}>
            <TouchableOpacity
              style={styles.demoBtnPatient}
              onPress={handleQuickDemoPatient}
              activeOpacity={0.8}
            >
              <User size={11} color="#000" />
              <Text style={styles.demoBtnPatientText}>Patient (Eleanor)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoBtnCaregiver}
              onPress={handleQuickDemoCaregiver}
              activeOpacity={0.8}
            >
              <Shield size={11} color={Colors.amber} />
              <Text style={styles.demoBtnCaregiverText}>Caregiver (Sarah)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Role Toggle: Patient vs Caregiver */}
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'patient' && styles.roleTabActive]}
            onPress={() => setRole('patient')}
            activeOpacity={0.8}
          >
            <User size={12} color={role === 'patient' ? Colors.amber : Colors.textMuted} />
            <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>
              Patient Sanctuary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, role === 'caregiver' && styles.roleTabActive]}
            onPress={() => setRole('caregiver')}
            activeOpacity={0.8}
          >
            <HeartHandshake
              size={12}
              color={role === 'caregiver' ? Colors.purple : Colors.textMuted}
            />
            <Text style={[styles.roleText, role === 'caregiver' && { color: Colors.purple, fontWeight: '800' }]}>
              Caregiver Portal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode Toggle: Sign In vs Sign Up vs Face ID */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'signin' && styles.modeTabActive]}
            onPress={() => {
              setMode('signin');
              setErrorMessage('');
            }}
          >
            <Text style={[styles.modeTabText, mode === 'signin' && styles.modeTabTextActive]}>
              SIGN IN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
            onPress={() => {
              setMode('signup');
              setErrorMessage('');
            }}
          >
            <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
              SIGN UP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'face' && styles.modeTabActive]}
            onPress={() => {
              setCameraPurpose('face_login');
              setShowCamera(true);
            }}
          >
            <ScanFace size={11} color={Colors.cyan} />
            <Text style={[styles.modeTabText, { color: Colors.cyan, marginLeft: 3 }]}>
              FACE ID
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error / Status Messages */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {statusMessage ? (
          <View style={styles.statusBox}>
            <ActivityIndicator size="small" color={Colors.cyan} />
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}

        {/* ========================================== */}
        {/* SIGN IN FORM                               */}
        {/* ========================================== */}
        {mode === 'signin' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL OR PHONE NUMBER</Text>
              <View style={styles.inputRow}>
                <Mail size={13} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="name@example.com or phone"
                  placeholderTextColor={Colors.textDark}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputRow}>
                <Lock size={13} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={Colors.textDark}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={13} color={Colors.textMuted} />
                  ) : (
                    <Eye size={13} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, isLoading && { opacity: 0.6 }]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>SIGN IN TO SANCTUARY</Text>
                  <ArrowRight size={13} color="#000" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================== */}
        {/* SIGN UP FORM                               */}
        {/* ========================================== */}
        {mode === 'signup' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>YOUR FULL NAME</Text>
              <View style={styles.inputRow}>
                <User size={13} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="e.g. Eleanor Vance"
                  placeholderTextColor={Colors.textDark}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL OR PHONE NUMBER</Text>
              <View style={styles.inputRow}>
                <Mail size={13} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="name@example.com or phone"
                  placeholderTextColor={Colors.textDark}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CREATE PASSWORD (MIN 6 CHARS)</Text>
              <View style={styles.inputRow}>
                <Lock size={13} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create secure password"
                  placeholderTextColor={Colors.textDark}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={13} color={Colors.textMuted} />
                  ) : (
                    <Eye size={13} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <View style={styles.inputRow}>
                <Lock size={13} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter password"
                  placeholderTextColor={Colors.textDark}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            {/* Optional Face Enrollment Snapshot */}
            <View style={styles.photoCaptureRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>BIOMETRIC FACE SNAPSHOT (OPTIONAL)</Text>
                <Text style={styles.photoCaptureDesc}>
                  Allows instant 1-tap Face ID biometric login
                </Text>
              </View>
              {signupPhoto ? (
                <View style={styles.signupPhotoThumb}>
                  <Image source={{ uri: signupPhoto }} style={styles.thumbImg} />
                  <TouchableOpacity
                    style={styles.retakeIcon}
                    onPress={() => {
                      setCameraPurpose('signup_portrait');
                      setShowCamera(true);
                    }}
                  >
                    <RotateCcw size={10} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.snapPhotoBtn}
                  onPress={() => {
                    setCameraPurpose('signup_portrait');
                    setShowCamera(true);
                  }}
                >
                  <Camera size={13} color={Colors.cyan} />
                  <Text style={styles.snapPhotoBtnText}>TAKE SNAP</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, isLoading && { opacity: 0.6 }]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>CREATE SANCTUARY ACCOUNT</Text>
                  <ArrowRight size={13} color="#000" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Camera Modal */}
        {showCamera && (
          <CameraScanner
            mode="person"
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111318',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 28,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 9.5,
    marginTop: 2,
    textAlign: 'center',
  },
  demoCard: {
    backgroundColor: '#16181f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 10,
    marginBottom: 12,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  demoTitle: {
    color: Colors.amber,
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  demoDesc: {
    color: Colors.textMuted,
    fontSize: 8.5,
    lineHeight: 12,
    marginBottom: 8,
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtnPatient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.amber,
    paddingVertical: 7,
    borderRadius: 6,
  },
  demoBtnPatientText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
  },
  demoBtnCaregiver: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    paddingVertical: 7,
    borderRadius: 6,
  },
  demoBtnCaregiverText: {
    color: Colors.amber,
    fontSize: 9,
    fontWeight: '800',
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#0c0e14',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 3,
    marginBottom: 10,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: 6,
  },
  roleTabActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  roleText: {
    color: Colors.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
  },
  roleTextActive: {
    color: Colors.amber,
    fontWeight: '800',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#16181f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 2,
    marginBottom: 10,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: '#262933',
  },
  modeTabText: {
    color: Colors.textMuted,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modeTabTextActive: {
    color: Colors.textPrimary,
  },
  formCard: {
    backgroundColor: '#16181f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 12,
    gap: 9,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0e14',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 9,
    height: 38,
    gap: 8,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 10.5,
  },
  photoCaptureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  photoCaptureDesc: {
    color: Colors.textDark,
    fontSize: 8,
    marginTop: 1,
  },
  snapPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  snapPhotoBtnText: {
    color: Colors.cyan,
    fontSize: 8.5,
    fontWeight: '800',
  },
  signupPhotoThumb: {
    width: 34,
    height: 34,
    borderRadius: 17,
    position: 'relative',
  },
  thumbImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  retakeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#000',
    borderRadius: 6,
    padding: 2,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.amber,
    height: 38,
    borderRadius: 8,
    marginTop: 4,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 6,
    padding: 7,
    marginBottom: 8,
  },
  errorText: {
    color: Colors.red,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 6,
    padding: 7,
    marginBottom: 8,
  },
  statusText: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '700',
  },
});
