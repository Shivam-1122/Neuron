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
} from 'lucide-react-native';
import { startTaskApi, sendTaskLiveFrameApi, setTaskStepApi, endTaskApi } from '../api/client';

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
  const [feedbackBadge, setFeedbackBadge] = useState('Cortex Synchronizing...');
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [ingredientStatus, setIngredientStatus] = useState(null); // 'yes' | 'no'
  const [ingredientName, setIngredientName] = useState('');
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Camera & Loop
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const frameTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const lastSpokenRef = useRef('');

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

    setIsLoading(true);
    setErrorMessage(null);
    setWarningAlert(null);
    setElapsedSeconds(0);

    try {
      const res = await startTaskApi(query);
      if (res && res.session) {
        setActiveSession(res.session);

        const firstStep = res.session.steps && res.session.steps[0];
        const initialNarration = firstStep
          ? firstStep.narration || firstStep.verify_prompt || `First, please show me your ${firstStep.expected_item}.`
          : `Starting ${res.session.task_title}.`;

        speakText(initialNarration);
      }
    } catch (err) {
      console.warn('Start task error:', err);
      setErrorMessage('Could not initialize multimodal task session.');
    } finally {
      setIsLoading(false);
    }
  };

  // Frame analyzer loop (captures every 3.5s)
  useEffect(() => {
    if (activeSession && activeSession.status === 'in_progress') {
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      frameTimerRef.current = setInterval(() => {
        captureAndAnalyzeFrame();
      }, 3500);
    }

    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    };
  }, [activeSession, isProcessingFrame]);

  // Capture frame & send to backend
  const captureAndAnalyzeFrame = async () => {
    if (!cameraRef.current || isProcessingFrame || !activeSession) return;
    try {
      setIsProcessingFrame(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
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
    try {
      await endTaskApi(activeSession.session_id);
    } catch (e) {}
    setActiveSession(null);
    Speech.stop();
  };

  // IF NO ACTIVE SESSION -> SHOW LAUNCHER PRESETS
  if (!activeSession) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.launcherContent}>
        <View style={styles.launcherHeader}>
          <View style={styles.headerTitleRow}>
            <Sparkles color={Colors.cyan} size={20} />
            <Text style={styles.screenTitle}>MULTIMODAL TASK GUIDE</Text>
          </View>
          <Text style={styles.screenSubtitle}>
            AI camera guidance with safety watchdog monitoring each step in real time.
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.errorBox}>
            <AlertTriangle color={Colors.red} size={16} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

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
                <ActivityIndicator color="#060a12" size="small" />
              ) : (
                <Text style={styles.customStartBtnText}>START</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Presets List */}
        <Text style={styles.presetsHeading}>PRESET DEMENTIA-SAFE ROUTINES</Text>
        <View style={styles.presetList}>
          {PRESET_TASKS.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.presetCard}
              activeOpacity={0.8}
              onPress={() => handleStartTask(task.query)}
              disabled={isLoading}
            >
              <View style={styles.presetIconBox}>
                <Text style={{ fontSize: 24 }}>{task.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.presetTitleRow}>
                  <Text style={styles.presetTitle}>{task.title}</Text>
                  <Text style={styles.presetBadge}>{task.badge}</Text>
                </View>
                <Text style={styles.presetDesc}>{task.desc}</Text>
              </View>
              <ChevronRight color={Colors.cyan} size={18} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ACTIVE TASK GUIDANCE SESSION VIEW
  const currentStepIndex = activeSession.current_step_index || 0;
  const currentStep = activeSession.steps && activeSession.steps[currentStepIndex];
  const totalSteps = activeSession.steps ? activeSession.steps.length : 0;

  return (
    <View style={styles.sessionContainer}>
      {/* Top Session HUD Header */}
      <View style={styles.sessionHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={handleEndTask}>
          <ArrowLeft color="#fff" size={16} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={styles.sessionTaskTitle} numberOfLines={1}>
            {activeSession.task_title}
          </Text>
          <Text style={styles.sessionStepCount}>
            STEP {currentStepIndex + 1} OF {totalSteps} • {elapsedSeconds}s
          </Text>
        </View>
        <View style={styles.feedbackPill}>
          <Text style={styles.feedbackPillText}>{feedbackBadge}</Text>
        </View>
      </View>

      {/* Safety Alert Watchdog Banner */}
      {warningAlert && (
        <View style={styles.safetyAlertBanner}>
          <Flame color="#fff" size={18} />
          <Text style={styles.safetyAlertText}>HAZARD DETECTED: {warningAlert}</Text>
        </View>
      )}

      {/* Live Camera Viewport */}
      <View style={styles.cameraBox}>
        {permission && permission.granted ? (
          <CameraView style={styles.camera} ref={cameraRef} facing="back">
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraReticle} />
              {isProcessingFrame && (
                <View style={styles.analyzingBadge}>
                  <ActivityIndicator color={Colors.cyan} size="small" />
                  <Text style={styles.analyzingText}>AI WATCHDOG INSPECTING</Text>
                </View>
              )}
            </View>
          </CameraView>
        ) : (
          <View style={styles.noCameraBox}>
            <Eye color={Colors.cyan} size={32} />
            <Text style={styles.noCameraText}>Grant camera access for live assistance</Text>
            <TouchableOpacity style={styles.grantCameraBtn} onPress={requestPermission}>
              <Text style={styles.grantCameraBtnText}>ENABLE CAMERA</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Current Step Instruction Card */}
      <ScrollView style={styles.stepDetailsCard} showsVerticalScrollIndicator={false}>
        {currentStep && (
          <>
            <View style={styles.stepTitleRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{currentStepIndex + 1}</Text>
              </View>
              <Text style={styles.stepTitleText}>{currentStep.step_title || currentStep.instruction}</Text>
            </View>

            <Text style={styles.stepDetailInstruction}>{currentStep.instruction}</Text>

            {/* Expected Item verification status */}
            {currentStep.expected_item && (
              <View style={styles.itemVerifyRow}>
                <Text style={styles.itemVerifyLabel}>EXPECTED ITEM:</Text>
                <Text style={styles.itemVerifyValue}>{currentStep.expected_item}</Text>
                {ingredientStatus === 'yes' ? (
                  <View style={styles.verifiedPill}>
                    <CheckCircle2 color={Colors.emerald} size={14} />
                    <Text style={styles.verifiedPillText}>VERIFIED</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Step Checklist */}
            <View style={styles.stepsListProgress}>
              {activeSession.steps.map((s, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.miniStepItem,
                    idx === currentStepIndex && styles.miniStepItemActive,
                    idx < currentStepIndex && styles.miniStepItemDone,
                  ]}
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
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Step Navigation Controls */}
      <View style={styles.stepControlsRow}>
        <TouchableOpacity
          style={[styles.stepNavBtn, currentStepIndex === 0 && { opacity: 0.4 }]}
          onPress={() => handleStepChange(currentStepIndex - 1)}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft color="#fff" size={18} />
          <Text style={styles.stepNavBtnText}>PREV STEP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepNavBtn, styles.stepNavBtnNext]}
          onPress={() => handleStepChange(currentStepIndex + 1)}
          disabled={currentStepIndex >= totalSteps - 1}
        >
          <Text style={styles.stepNavBtnNextText}>NEXT STEP</Text>
          <ChevronRight color="#060a12" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  launcherContent: {
    padding: 20,
    paddingBottom: 40,
  },
  launcherHeader: {
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  screenTitle: {
    color: Colors.cyan,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  screenSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.red,
    fontSize: 11,
    fontWeight: '700',
  },
  customInputBox: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    padding: 16,
    marginBottom: 24,
  },
  inputLabel: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  customStartBtn: {
    backgroundColor: Colors.cyan,
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customStartBtnText: {
    color: '#060a12',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },
  presetsHeading: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  presetList: {
    gap: 12,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    gap: 12,
  },
  presetIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  presetTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  presetBadge: {
    color: Colors.cyan,
    fontSize: 8,
    fontWeight: '700',
  },
  presetDesc: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  sessionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cyanBorder,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sessionTaskTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  sessionStepCount: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  feedbackPill: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  feedbackPillText: {
    color: Colors.cyan,
    fontSize: 8,
    fontWeight: '800',
  },
  safetyAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.red,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  safetyAlertText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  cameraBox: {
    height: 220,
    backgroundColor: '#000',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraReticle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.cyan,
  },
  analyzingBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 10, 18, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  analyzingText: {
    color: Colors.cyan,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noCameraBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  noCameraText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  grantCameraBtn: {
    backgroundColor: Colors.cyan,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  grantCameraBtnText: {
    color: '#060a12',
    fontSize: 10,
    fontWeight: '800',
  },
  stepDetailsCard: {
    flex: 1,
    padding: 16,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#060a12',
    fontWeight: '900',
    fontSize: 12,
  },
  stepTitleText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  stepDetailInstruction: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  itemVerifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  itemVerifyLabel: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '800',
  },
  itemVerifyValue: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedPillText: {
    color: Colors.emerald,
    fontSize: 9,
    fontWeight: '800',
  },
  stepsListProgress: {
    gap: 6,
    paddingBottom: 20,
  },
  miniStepItem: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  miniStepItemActive: {
    borderColor: Colors.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  miniStepItemDone: {
    borderColor: Colors.emeraldBorder,
    opacity: 0.7,
  },
  miniStepText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  stepControlsRow: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    gap: 12,
  },
  stepNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    paddingVertical: 12,
  },
  stepNavBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepNavBtnNext: {
    backgroundColor: Colors.cyan,
    borderColor: Colors.cyan,
  },
  stepNavBtnNextText: {
    color: '#060a12',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
