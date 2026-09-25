import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { Colors } from '../theme/colors';
import {
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Eye,
  Camera,
  Flame,
  ArrowLeft,
  X,
  Crosshair,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { startTaskApi, sendTaskLiveFrameApi, setTaskStepApi, endTaskApi } from '../api/client';
import sound from '../utils/soundEngine';

const PRESET_TASKS = [
  {
    id: 'tea',
    title: 'Making a Warm Cup of Tea',
    desc: 'Show tea bag, boil kettle, pour water, steep, and enjoy safely',
    query: 'How to make a warm cup of tea step by step',
    icon: '🫖',
    badge: '5 Mins • Kitchen',
  },
  {
    id: 'meds',
    title: 'Evening Medication Routine',
    desc: 'Verify pill bottle, prepare fresh water, take doses safely',
    query: 'Guide me through taking evening prescribed medication safely with water',
    icon: '💊',
    badge: '3 Mins • Health',
  },
  {
    id: 'toast',
    title: 'Making Breakfast Toast',
    desc: 'Show bread, operate toaster, check golden crust, apply spread',
    query: 'How to safely prepare breakfast toast with toaster and butter',
    icon: '🍞',
    badge: '4 Mins • Kitchen',
  },
  {
    id: 'soup',
    title: 'Making a Warm Bowl of Soup',
    desc: 'Verify soup can/pot, heat safely, stir, and serve in bowl',
    query: 'How to prepare a warm bowl of soup safely step by step',
    icon: '🥣',
    badge: '6 Mins • Cooking',
  },
];

export default function TaskGuideScreen({ onBack }) {
  const [activeSession, setActiveSession] = useState(null);
  const [customQuery, setCustomQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Live Multimodal state
  const [warningAlert, setWarningAlert] = useState(null);
  const [feedbackBadge, setFeedbackBadge] = useState('Standby');
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [ingredientStatus, setIngredientStatus] = useState(null); // 'yes' | 'no'
  const [ingredientName, setIngredientName] = useState('');
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCameraView, setShowCameraView] = useState(true);

  // Camera & Loop
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const lastSpokenRef = useRef('');

  // Silence speech on mount and unmount
  useEffect(() => {
    Speech.stop();
    return () => {
      Speech.stop();
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, []);

  // Voice narration helper
  const speakText = (text) => {
    if (!text) return;
    lastSpokenRef.current = text;
    Speech.stop();
    Speech.speak(text, {
      rate: 0.92,
      pitch: 1.05,
    });
  };

  // Start task session
  const handleStartTask = async (queryText) => {
    const query = (queryText || customQuery).trim();
    if (!query) return;

    Speech.stop();
    setIsLoading(true);
    setErrorMessage(null);
    setWarningAlert(null);
    setElapsedSeconds(0);
    sound.playCardFlip();

    try {
      const res = await startTaskApi(query);
      if (res && res.session) {
        setActiveSession(res.session);
        sound.playMatchSuccess();

        const firstStep = res.session.steps && res.session.steps[0];
        const initialNarration = firstStep
          ? firstStep.narration || firstStep.verify_prompt || `First step: ${firstStep.instruction}`
          : `Starting ${res.session.task_title}.`;

        speakText(initialNarration);
      }
    } catch (err) {
      console.warn('Start task error:', err);
      setErrorMessage('Could not initialize multimodal task session.');
      sound.playTryAgain();
    } finally {
      setIsLoading(false);
    }
  };

  // Elapsed timer
  useEffect(() => {
    if (activeSession && activeSession.status === 'in_progress') {
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    }

    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [activeSession]);

  // Capture frame on-demand (avoids camera blinking)
  const captureAndAnalyzeFrame = async () => {
    if (!cameraRef.current || isProcessingFrame || !activeSession) return;
    try {
      setIsProcessingFrame(true);
      sound.playCardFlip();
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        shutterSound: false,
        skipProcessing: true,
      });

      if (photo && photo.base64) {
        const imageB64 = `data:image/jpeg;base64,${photo.base64}`;
        const res = await sendTaskLiveFrameApi({
          sessionId: activeSession.session_id,
          imageB64,
          elapsedSeconds,
        });

        const data = res.data;
        if (data) {
          if (data.feedback_badge) setFeedbackBadge(data.feedback_badge);
          if (data.detected_objects) setDetectedObjects(data.detected_objects);
          if (data.ingredient_confirmed !== undefined) {
            setIngredientStatus(data.ingredient_confirmed ? 'yes' : 'no');
          }
          if (data.ingredient_detected_name) {
            setIngredientName(data.ingredient_detected_name);
          }

          // Safety Alert
          if (data.warning_alert) {
            setWarningAlert(data.warning_alert);
            speakText(`Warning: ${data.warning_alert}`);
          } else {
            setWarningAlert(null);
          }

          // Spoken guidance
          if (data.spoken_response && data.spoken_response !== lastSpokenRef.current && !data.warning_alert) {
            speakText(data.spoken_response);
          }

          // Advance step
          if (data.current_step_index !== activeSession.current_step_index) {
            sound.playMatchSuccess();
            setActiveSession((prev) => ({
              ...prev,
              current_step_index: data.current_step_index,
              status: data.status,
            }));
            setElapsedSeconds(0);
          }
        }
      }
    } catch (err) {
      console.warn('Frame analysis cycle note:', err);
    } finally {
      setIsProcessingFrame(false);
    }
  };

  // Step change manually
  const handleStepChange = async (newIndex) => {
    if (!activeSession || newIndex < 0 || newIndex >= activeSession.steps.length) return;
    try {
      sound.playStepPlace();
      await setTaskStepApi(activeSession.session_id, newIndex);
      setActiveSession((prev) => ({ ...prev, current_step_index: newIndex }));
      setElapsedSeconds(0);

      const step = activeSession.steps[newIndex];
      if (step) {
        speakText(step.narration || step.instruction);
      }
    } catch (err) {
      console.warn('Step change error:', err);
    }
  };

  const handleEndTask = async () => {
    if (!activeSession) return;
    Speech.stop();
    try {
      await endTaskApi(activeSession.session_id);
    } catch (e) {}
    setActiveSession(null);
  };

  // ==========================================
  // LAUNCHER VIEW (WHEN NO ACTIVE SESSION)
  // ==========================================
  if (!activeSession) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.launcherContent}>
        {/* Header */}
        <View style={styles.launcherHeader}>
          <View style={styles.headerTitleRow}>
            <Sparkles color={Colors.cyan} size={15} />
            <Text style={styles.screenTitle}>MULTIMODAL TASK GUIDE</Text>
          </View>
          <Text style={styles.screenSubtitle}>
            Step-by-step visual guidance with AI safety verification.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <AlertTriangle color={Colors.red} size={13} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Custom Task Input */}
        <View style={styles.customInputBox}>
          <Text style={styles.inputLabel}>CUSTOM ASSISTANCE QUERY</Text>
          <View style={styles.customInputRow}>
            <TextInput
              style={styles.customInput}
              value={customQuery}
              onChangeText={setCustomQuery}
              placeholder="e.g. Help me prepare coffee safely"
              placeholderTextColor={Colors.textDark}
            />
            <TouchableOpacity
              style={[styles.customStartBtn, !customQuery.trim() && { opacity: 0.5 }]}
              onPress={() => handleStartTask()}
              disabled={!customQuery.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <ChevronRight color="#000" size={15} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Presets List */}
        <Text style={styles.sectionHeader}>RECOMMENDED DAILY PROTOCOLS</Text>
        <View style={styles.presetsGrid}>
          {PRESET_TASKS.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.presetCard}
              onPress={() => handleStartTask(task.query)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={styles.presetTopRow}>
                <Text style={styles.presetIcon}>{task.icon}</Text>
                <View style={styles.presetBadge}>
                  <Text style={styles.presetBadgeText}>{task.badge}</Text>
                </View>
              </View>
              <Text style={styles.presetTitle}>{task.title}</Text>
              <Text style={styles.presetDesc}>{task.desc}</Text>
              <View style={styles.presetFooter}>
                <Text style={styles.startGuidanceText}>START PROTOCOL</Text>
                <ChevronRight color={Colors.cyan} size={12} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ==========================================
  // ACTIVE TASK GUIDANCE SESSION VIEW
  // ==========================================
  const currentStepIndex = activeSession.current_step_index || 0;
  const totalSteps = activeSession.steps ? activeSession.steps.length : 0;
  const currentStep = activeSession.steps ? activeSession.steps[currentStepIndex] : null;

  return (
    <View style={styles.container}>
      {/* Session Header */}
      <View style={styles.sessionHeader}>
        <TouchableOpacity style={styles.endBtn} onPress={handleEndTask} activeOpacity={0.7}>
          <X color="#fff" size={14} />
          <Text style={styles.endBtnText}>END</Text>
        </TouchableOpacity>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTaskTitle} numberOfLines={1}>
            {activeSession.task_title || 'Multimodal Protocol'}
          </Text>
          <Text style={styles.sessionStepCount}>
            STEP {currentStepIndex + 1} OF {totalSteps} • {elapsedSeconds}s
          </Text>
        </View>

        <TouchableOpacity
          style={styles.camToggleBtn}
          onPress={() => setShowCameraView(!showCameraView)}
        >
          <Camera size={13} color={showCameraView ? Colors.cyan : Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Safety Alert Watchdog Banner */}
      {warningAlert && (
        <View style={styles.safetyAlertBanner}>
          <Flame color="#fff" size={15} />
          <Text style={styles.safetyAlertText}>HAZARD DETECTED: {warningAlert}</Text>
        </View>
      )}

      {/* Live Compact Camera Viewport (140px, non-blinking) */}
      {showCameraView && (
        <View style={styles.cameraBox}>
          {permission && permission.granted ? (
            <CameraView style={styles.camera} ref={cameraRef} facing="back">
              <View style={styles.cameraOverlay}>
                <View style={styles.squareReticle}>
                  <Crosshair size={22} color="rgba(6, 182, 212, 0.6)" />
                </View>

                {/* On-Demand Scan & Verify Button */}
                <TouchableOpacity
                  style={[styles.verifyButton, isProcessingFrame && { opacity: 0.6 }]}
                  onPress={captureAndAnalyzeFrame}
                  disabled={isProcessingFrame}
                  activeOpacity={0.8}
                >
                  {isProcessingFrame ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Crosshair size={11} color="#000" />
                      <Text style={styles.verifyButtonText}>VERIFY SENSOR</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </CameraView>
          ) : (
            <View style={styles.noCameraBox}>
              <Eye color={Colors.cyan} size={22} />
              <Text style={styles.noCameraText}>Grant camera access for live assistance</Text>
              <TouchableOpacity style={styles.grantCameraBtn} onPress={requestPermission}>
                <Text style={styles.grantCameraBtnText}>ENABLE CAMERA</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Current Step Instruction Card (PROMINENT & VISIBLE) */}
      <ScrollView style={styles.stepDetailsCard} showsVerticalScrollIndicator={false}>
        {currentStep && (
          <View style={styles.stepCardContent}>
            {/* Step Header */}
            <View style={styles.stepTitleRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{currentStepIndex + 1}</Text>
              </View>
              <Text style={styles.stepTitleText}>
                {currentStep.step_title || currentStep.instruction}
              </Text>
            </View>

            {/* Instruction Body */}
            <Text style={styles.stepDetailInstruction}>{currentStep.instruction}</Text>

            {/* Expected Item verification status */}
            {currentStep.expected_item ? (
              <View style={styles.itemVerifyRow}>
                <Text style={styles.itemVerifyLabel}>EXPECTED ITEM:</Text>
                <Text style={styles.itemVerifyValue}>{currentStep.expected_item}</Text>
                {ingredientStatus === 'yes' ? (
                  <View style={styles.verifiedPill}>
                    <CheckCircle2 color={Colors.emerald} size={11} />
                    <Text style={styles.verifiedPillText}>CONFIRMED</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Steps Checklist Overview */}
            <Text style={styles.checklistTitle}>ALL PROTOCOL STEPS:</Text>
            <View style={styles.stepsListProgress}>
              {activeSession.steps.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.miniStepItem,
                    idx === currentStepIndex && styles.miniStepItemActive,
                    idx < currentStepIndex && styles.miniStepItemDone,
                  ]}
                  onPress={() => handleStepChange(idx)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.miniStepText,
                      idx === currentStepIndex && { color: Colors.cyan, fontWeight: '800' },
                      idx < currentStepIndex && { color: Colors.emerald },
                    ]}
                  >
                    {idx + 1}. {s.step_title || s.instruction}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Step Navigation Controls */}
      <View style={styles.stepControlsRow}>
        <TouchableOpacity
          style={[styles.stepNavBtn, currentStepIndex === 0 && { opacity: 0.3 }]}
          onPress={() => handleStepChange(currentStepIndex - 1)}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft color="#fff" size={14} />
          <Text style={styles.stepNavBtnText}>PREV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepNavBtn, styles.stepNavBtnNext]}
          onPress={() => handleStepChange(currentStepIndex + 1)}
          disabled={currentStepIndex >= totalSteps - 1}
        >
          <Text style={styles.stepNavBtnNextText}>NEXT STEP</Text>
          <ChevronRight color="#000" size={14} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111318',
  },
  launcherContent: {
    padding: 14,
    paddingBottom: 28,
  },
  launcherHeader: {
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  screenSubtitle: {
    color: Colors.textMuted,
    fontSize: 9.5,
    lineHeight: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorText: {
    color: Colors.red,
    fontSize: 9,
    fontWeight: '700',
  },
  customInputBox: {
    backgroundColor: '#16181f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 10,
    marginBottom: 12,
  },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 6,
  },
  customInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#0c0e14',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    color: Colors.textPrimary,
    fontSize: 10.5,
    paddingHorizontal: 10,
  },
  customStartBtn: {
    width: 36,
    height: 36,
    borderRadius: 7,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    color: Colors.textMuted,
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  presetsGrid: {
    gap: 8,
  },
  presetCard: {
    backgroundColor: '#16181f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 11,
    gap: 4,
  },
  presetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetIcon: {
    fontSize: 18,
  },
  presetBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  presetBadgeText: {
    color: Colors.cyan,
    fontSize: 8,
    fontWeight: '800',
  },
  presetTitle: {
    color: Colors.textPrimary,
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 2,
  },
  presetDesc: {
    color: Colors.textMuted,
    fontSize: 9,
    lineHeight: 13,
  },
  presetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 4,
  },
  startGuidanceText: {
    color: Colors.cyan,
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sessionHeader: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#16181f',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  endBtnText: {
    color: '#fff',
    fontSize: 8.5,
    fontWeight: '800',
  },
  sessionInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  sessionTaskTitle: {
    color: Colors.textPrimary,
    fontSize: 10.5,
    fontWeight: '800',
  },
  sessionStepCount: {
    color: Colors.cyan,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  camToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#0c0e14',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.red,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  safetyAlertText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  cameraBox: {
    height: 140,
    backgroundColor: '#000',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  squareReticle: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButton: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.amber,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  verifyButtonText: {
    color: '#000',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  noCameraBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  noCameraText: {
    color: Colors.textMuted,
    fontSize: 9.5,
  },
  grantCameraBtn: {
    backgroundColor: Colors.cyan,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  grantCameraBtnText: {
    color: '#000',
    fontSize: 8.5,
    fontWeight: '800',
  },
  stepDetailsCard: {
    flex: 1,
    padding: 12,
  },
  stepCardContent: {
    gap: 8,
    paddingBottom: 20,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: Colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 10,
  },
  stepTitleText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  stepDetailInstruction: {
    color: Colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },
  itemVerifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16181f',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  itemVerifyLabel: {
    color: Colors.cyan,
    fontSize: 8,
    fontWeight: '800',
  },
  itemVerifyValue: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontWeight: '700',
    flex: 1,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  verifiedPillText: {
    color: Colors.emerald,
    fontSize: 7.5,
    fontWeight: '800',
  },
  checklistTitle: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 6,
  },
  stepsListProgress: {
    gap: 5,
  },
  miniStepItem: {
    backgroundColor: '#16181f',
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  miniStepItemActive: {
    borderColor: Colors.cyanBorder,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  miniStepItemDone: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  miniStepText: {
    color: Colors.textMuted,
    fontSize: 9,
  },
  stepControlsRow: {
    height: 48,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#16181f',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  stepNavBtn: {
    flex: 1,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 6,
    backgroundColor: '#262933',
  },
  stepNavBtnText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  stepNavBtnNext: {
    backgroundColor: Colors.amber,
  },
  stepNavBtnNextText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
});
