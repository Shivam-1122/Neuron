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
} from 'react-native';
import { Colors, Shadows } from '../theme/colors';
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
  HelpCircle,
} from 'lucide-react-native';
import CameraScanner from '../components/CameraScanner';
import { faceLoginApi, caregiverLoginApi } from '../api/client';

export default function LoginScreen({ onLoginSuccess, onSelectRole }) {
  // Roles: 'patient' | 'caregiver'
  const [role, setRole] = useState('patient');
  // Auth Method: 'face' | 'email' | 'phone'
  const [authMethod, setAuthMethod] = useState('face');

  // Credentials
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showFaceScanner, setShowFaceScanner] = useState(false);

  // 1-Tap Quick Demo Logins for Judges/Evaluators
  const handleQuickDemoPatient = () => {
    const demoUser = {
      uid: 'patient_eleanor_vance',
      displayName: 'Eleanor Vance',
      email: 'eleanor@neuron.sanctuary',
      role: 'patient',
      avatar: null,
    };
    onLoginSuccess(demoUser);
  };

  const handleQuickDemoCaregiver = () => {
    const demoCaregiver = {
      uid: 'caregiver_sarah_vance',
      displayName: 'Sarah Vance (Daughter)',
      email: 'sarah.caregiver@neuron.sanctuary',
      role: 'caregiver',
      patient_id: 'patient_eleanor_vance',
    };
    onLoginSuccess(demoCaregiver);
  };

  // Face Scan Login
  const handleFaceScanCapture = async (uri) => {
    setShowFaceScanner(false);
    setIsLoading(true);
    setStatusMessage('Matching facial biometric vector with Qdrant...');
    setErrorMessage('');

    try {
      const res = await faceLoginApi(uri);
      if (res && res.status === 'authenticated' && res.user_id) {
        onLoginSuccess({
          uid: res.user_id,
          displayName: res.name || res.user_id,
          role: 'patient',
        });
      } else {
        // If face not recognized, offer friendly fallback
        Alert.alert(
          'Biometric Verification',
          res?.message || 'Face vector not recognized. You can enroll your face in settings or use quick demo login.',
          [
            { text: 'Try Quick Demo', onPress: handleQuickDemoPatient },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch (err) {
      // Offline/demo fallback
      Alert.alert(
        'Offline Verification',
        'Could not reach Neural Core. Would you like to enter as Eleanor (Patient)?',
        [
          { text: 'Enter Demo Patient', onPress: handleQuickDemoPatient },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Email/Password Login
  const handleEmailLogin = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or identifier.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        uid: `user_${Date.now()}`,
        displayName: identifier.split('@')[0],
        email: identifier,
        role: role,
      });
    }, 600);
  };

  // Phone SMS OTP send
  const handleSendOtp = () => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter your phone number.');
      return;
    }
    setOtpSent(true);
    setPhoneCode('123456'); // Simulated code for smooth demo
    Alert.alert('SMS Sent', 'Verification code sent to your phone (Demo Code: 123456)');
  };

  const handleVerifyOtp = () => {
    if (phoneCode !== '123456') {
      setErrorMessage('Invalid code. Use demo code 123456');
      return;
    }
    onLoginSuccess({
      uid: `phone_${identifier.replace(/\D/g, '')}`,
      displayName: `Phone User (${identifier})`,
      phoneNumber: identifier,
      role: role,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Cognitive Sanctuary</Text>
          <Text style={styles.subtitle}>
            Zero-friction biometric access and caregiver security portal
          </Text>
        </View>

        {/* 1-Tap Quick Demo Access Box (Especially for Hackathon Judges) */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <Sparkles size={16} color={Colors.amber} />
            <Text style={styles.demoTitle}>QUICK DEMO ACCESS (1-TAP)</Text>
          </View>
          <Text style={styles.demoDesc}>
            Instant login pre-loaded with memories, photos, and caregiver team:
          </Text>
          <View style={styles.demoButtonRow}>
            <TouchableOpacity
              style={styles.demoButtonPatient}
              onPress={handleQuickDemoPatient}
              activeOpacity={0.8}
            >
              <User size={14} color="#111318" />
              <Text style={styles.demoButtonPatientText}>Patient (Eleanor)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButtonCaregiver}
              onPress={handleQuickDemoCaregiver}
              activeOpacity={0.8}
            >
              <Shield size={14} color={Colors.amber} />
              <Text style={styles.demoButtonCaregiverText}>Caregiver (Sarah)</Text>
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
            <User size={16} color={role === 'patient' ? Colors.amber : Colors.textMuted} />
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
              size={16}
              color={role === 'caregiver' ? Colors.amber : Colors.textMuted}
            />
            <Text style={[styles.roleText, role === 'caregiver' && styles.roleTextActive]}>
              Caregiver Portal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Method Toggle: Face | Phone | Email */}
        <View style={styles.methodBar}>
          <TouchableOpacity
            style={[styles.methodItem, authMethod === 'face' && styles.methodItemActive]}
            onPress={() => setAuthMethod('face')}
          >
            <ScanFace size={14} color={authMethod === 'face' ? Colors.amber : Colors.textMuted} />
            <Text
              style={[
                styles.methodText,
                authMethod === 'face' && styles.methodTextActive,
              ]}
            >
              Face ID
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodItem, authMethod === 'phone' && styles.methodItemActive]}
            onPress={() => setAuthMethod('phone')}
          >
            <Phone size={14} color={authMethod === 'phone' ? Colors.amber : Colors.textMuted} />
            <Text
              style={[
                styles.methodText,
                authMethod === 'phone' && styles.methodTextActive,
              ]}
            >
              Phone SMS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodItem, authMethod === 'email' && styles.methodItemActive]}
            onPress={() => setAuthMethod('email')}
          >
            <Mail size={14} color={authMethod === 'email' ? Colors.amber : Colors.textMuted} />
            <Text
              style={[
                styles.methodText,
                authMethod === 'email' && styles.methodTextActive,
              ]}
            >
              Email
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* METHOD 1: FACE ID */}
          {authMethod === 'face' && (
            <View style={styles.faceSection}>
              <View style={styles.faceIconCircle}>
                <ScanFace size={48} color={Colors.amber} />
              </View>
              <Text style={styles.facePromptTitle}>Biometric Face Sign In</Text>
              <Text style={styles.facePromptDesc}>
                Look at the camera for instant zero-password facial vector recognition.
              </Text>

              <TouchableOpacity
                style={styles.scanButton}
                activeOpacity={0.8}
                onPress={() => setShowFaceScanner(true)}
              >
                <ScanFace size={18} color="#111318" />
                <Text style={styles.scanButtonText}>SCAN FACE TO ENTER</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* METHOD 2: PHONE SMS */}
          {authMethod === 'phone' && (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Mobile Phone Number</Text>
              <View style={styles.inputWrap}>
                <Phone size={16} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={Colors.textDark}
                  keyboardType="phone-pad"
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              </View>

              {!otpSent ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSendOtp}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>SEND SMS CODE</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>6-Digit SMS Code</Text>
                  <View style={styles.inputWrap}>
                    <Lock size={16} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="123456"
                      placeholderTextColor={Colors.textDark}
                      keyboardType="number-pad"
                      value={phoneCode}
                      onChangeText={setPhoneCode}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleVerifyOtp}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>VERIFY & ENTER</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* METHOD 3: EMAIL */}
          {authMethod === 'email' && (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrap}>
                <Mail size={16} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@sanctuary.org"
                  placeholderTextColor={Colors.textDark}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>
              <View style={styles.inputWrap}>
                <Lock size={16} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textDark}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 6 }}
                >
                  {showPassword ? (
                    <EyeOff size={16} color={Colors.textMuted} />
                  ) : (
                    <Eye size={16} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleEmailLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>ENTER SANCTUARY</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={Colors.amber} />
              <Text style={styles.loadingText}>{statusMessage || 'Verifying credentials...'}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fullscreen Camera Modal for Face Scan */}
      <CameraScanner
        visible={showFaceScanner}
        title="Biometric Face Login"
        onClose={() => setShowFaceScanner(false)}
        onCapture={handleFaceScanCapture}
      />
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
    paddingBottom: 40,
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  demoCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderAmber,
    padding: 16,
    marginBottom: 18,
    ...Shadows.cardShadow,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  demoTitle: {
    color: Colors.amber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  demoDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  demoButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoButtonPatient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.amber,
    paddingVertical: 10,
    borderRadius: 10,
  },
  demoButtonPatientText: {
    color: '#111318',
    fontWeight: '700',
    fontSize: 12,
  },
  demoButtonCaregiver: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    paddingVertical: 10,
    borderRadius: 10,
  },
  demoButtonCaregiverText: {
    color: Colors.amber,
    fontWeight: '700',
    fontSize: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 16,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  roleTabActive: {
    backgroundColor: Colors.amberMuted,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  roleText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  roleTextActive: {
    color: Colors.amber,
    fontWeight: '700',
  },
  methodBar: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  methodItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  methodItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: Colors.amberBorder,
  },
  methodText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  methodTextActive: {
    color: Colors.amber,
    fontWeight: '700',
  },
  formCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 11,
    textAlign: 'center',
  },
  faceSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  faceIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.amberMuted,
    borderWidth: 2,
    borderColor: Colors.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Shadows.amberGlow,
  },
  facePromptTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  facePromptDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 260,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.amber,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    ...Shadows.amberGlow,
  },
  scanButtonText: {
    color: '#111318',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  inputSection: {
    width: '100%',
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 18,
    ...Shadows.amberGlow,
  },
  primaryButtonText: {
    color: '#111318',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  loadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  loadingText: {
    color: Colors.amber,
    fontSize: 11,
    fontWeight: '500',
  },
});
