import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Colors } from '../theme/colors';
import {
  Send,
  Eye,
  Package,
  UserPlus,
  PackagePlus,
  Mic,
  Volume2,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Activity,
  Radio,
  Gamepad2,
} from 'lucide-react-native';

import AvatarView from '../components/AvatarView';
import CameraScanner from '../components/CameraScanner';
import EnrollmentModal from '../components/EnrollmentModal';
import {
  chatQueryApi,
  recognizePersonApi,
  findObjectApi,
  setLLMProviderApi,
  transcribeVoiceApi,
} from '../api/client';

export default function PatientCortexScreen({
  onNavigate,
  currentUser,
  llmProvider: globalLlmProvider,
  onToggleLLM: globalToggleLLM,
}) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'bot',
      text: 'Hello! Show me a face or object, or ask me a question.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState(null);
  const [llmProvider, setLlmProvider] = useState(globalLlmProvider || 'groq');
  const [currentPerson, setCurrentPerson] = useState(null);

  // De-congesting: Collapsible Avatar HUD
  const [isAvatarCollapsed, setIsAvatarCollapsed] = useState(false);

  // Modals & Camera
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState('person'); // 'person' | 'object'
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollType, setEnrollType] = useState('person');

  // Mic state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const recordingRef = useRef(null);

  // Suggestions
  const [suggestions, setSuggestions] = useState([
    'Play Memory Game',
    'Start Task Guide',
    'Where is my wallet?',
    'Enroll new person',
    'Enroll new object',
  ]);

  const flatListRef = useRef(null);
  const soundRef = useRef(null);

  useEffect(() => {
    if (globalLlmProvider) setLlmProvider(globalLlmProvider);
  }, [globalLlmProvider]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Speak response aloud via Expo Speech
  const speakText = (text) => {
    if (!text) return;
    setIsSpeaking(true);
    setAvatarMessage(text);
    Speech.stop();
    Speech.speak(text, {
      rate: 0.95,
      pitch: 1.0,
      onDone: () => {
        setIsSpeaking(false);
        setAvatarMessage(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setAvatarMessage(null);
      },
    });
  };

  // Play audio sample from base64 or URI
  const playVoiceSample = async (rawAudio) => {
    if (!rawAudio) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const uri = rawAudio.startsWith('data:')
        ? rawAudio
        : `data:audio/webm;base64,${rawAudio}`;
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
    } catch (err) {
      console.warn('Audio play note:', err);
    }
  };

  // Add bot message
  const addBotMessage = (text, imageUri = null, audioBase64 = null) => {
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        role: 'bot',
        text,
        imageUri,
        audioBase64,
        provider: llmProvider,
      },
    ]);
  };

  // Send query
  const handleSend = async (overrideText = null) => {
    const text = (overrideText || inputText).trim();
    if (!text) return;

    setInputText('');
    setMessages((prev) => [...prev, { id: String(Date.now()), role: 'user', text }]);

    const lower = text.toLowerCase();
    if (lower.includes('play game') || lower.includes('memory game') || lower.includes('open game')) {
      addBotMessage('Opening your Cognitive Memory Gym now!');
      speakText('Opening your Cognitive Memory Gym now.');
      setTimeout(() => {
        onNavigate('game');
      }, 800);
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Accessing Memory Bank...');

    try {
      const res = await chatQueryApi(text, llmProvider);
      const reply = res.text || 'I could not find information on that in memory.';
      addBotMessage(reply, res.image_base64, res.audio_base64);
      speakText(reply);

      if (res.audio_base64 && (lower.includes('voice') || lower.includes('talk') || lower.includes('sound'))) {
        playVoiceSample(res.audio_base64);
      }

      if (res.person) {
        setCurrentPerson(res.person);
        updateSuggestions(res.person, res.entity_type);
      }
    } catch (err) {
      console.warn('Chat error:', err);
      const errMsg = 'Error connecting to memory service.';
      addBotMessage(errMsg);
      speakText(errMsg);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Dynamic suggestions update
  const updateSuggestions = (entity, explicitType) => {
    if (!entity || !entity.name || entity.name === 'Memory') {
      setSuggestions([
        'Play Memory Game',
        'Where is my wallet?',
        'Who is Sachin?',
        'Start Task Guide',
      ]);
      return;
    }
    const name = entity.name;
    const isObject = explicitType === 'object' || entity.type === 'object';
    if (isObject) {
      setSuggestions([
        `Where is my ${name}?`,
        `I moved my ${name} to table`,
        `When was ${name} last seen?`,
      ]);
    } else {
      setSuggestions([
        `Who is ${name}?`,
        `How do I know ${name}?`,
        `Any notes on ${name}?`,
      ]);
    }
  };

  const handleSuggestionClick = (text) => {
    if (text === 'Start Task Guide') {
      onNavigate('task_guide');
    } else if (text === 'Play Memory Game') {
      onNavigate('game');
    } else if (text === 'Enroll new person') {
      setEnrollType('person');
      setShowEnrollModal(true);
    } else if (text === 'Enroll new object') {
      setEnrollType('object');
      setShowEnrollModal(true);
    } else {
      handleSend(text);
    }
  };

  // Handle Camera Capture
  const handleCameraCapture = async (uri) => {
    setShowCamera(false);
    setIsProcessing(true);
    setProcessingStatus(`Analyzing Optical ${cameraMode === 'person' ? 'Face' : 'Object'}...`);

    try {
      if (cameraMode === 'person') {
        const data = await recognizePersonApi(uri);
        if (data.status === 'identified' && data.person) {
          setCurrentPerson(data.person);
          const reply = `I see ${data.person.name}. Confidence: ${(data.person.confidence * 100).toFixed(1)}%.`;
          addBotMessage(reply, data.person.image_base64 || uri);
          speakText(`Hello ${data.person.name}.`);
          updateSuggestions(data.person, 'person');
        } else if (data.status === 'no_face_detected') {
          const reply = "I couldn't detect a face clearly. Please look straight at the camera and try again.";
          addBotMessage(reply);
          speakText(reply);
        } else {
          const reply = "I don't recognize that person in my memory.";
          addBotMessage(reply, uri);
          speakText(reply);
        }
      } else {
        const data = await findObjectApi(uri);
        if (data.status === 'identified' && data.object) {
          const loc = data.object.location || 'unknown location';
          const reply = `I found your ${data.object.name}. Location: ${loc}.`;
          addBotMessage(reply, data.object.image || uri);
          speakText(reply);
          updateSuggestions(data.object, 'object');
        } else if (data.status === 'generic_detection') {
          const objects = (data.objects || []).map((o) => o.object).join(', ');
          const reply = `I see: ${objects} (Not in my personal memory).`;
          addBotMessage(reply, uri);
          speakText(reply);
        } else {
          const reply = "I don't recognize that object in my memory.";
          addBotMessage(reply, uri);
          speakText(reply);
        }
      }
    } catch (err) {
      console.warn('Scanner error:', err);
      addBotMessage('Optical analysis error. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Record Voice Query & Transcribe via Whisper
  const startVoiceRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permission', 'Mic access needed.');

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecordingVoice(true);
    } catch (err) {
      console.warn('Voice recording start error:', err);
    }
  };

  const stopVoiceRecording = async () => {
    if (!recordingRef.current) return;
    try {
      setIsRecordingVoice(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      setIsProcessing(true);
      setProcessingStatus('Transcribing Vocal Speech via Whisper...');
      const res = await transcribeVoiceApi(uri);
      if (res && res.text) {
        handleSend(res.text);
      } else {
        addBotMessage("Could not hear speech clearly.");
      }
    } catch (err) {
      console.warn('Voice transcribe error:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ========================================== */}
      {/* COLLAPSIBLE / COMPACT AVATAR HUD           */}
      {/* ========================================== */}
      <View style={styles.avatarHeaderWrapper}>
        {!isAvatarCollapsed ? (
          <View>
            <AvatarView
              isSpeaking={isSpeaking}
              isProcessing={isProcessing}
              message={avatarMessage}
              processingStatus={processingStatus}
            />
            {/* Collapse Pill Button */}
            <TouchableOpacity
              style={styles.collapseToggleBar}
              onPress={() => setIsAvatarCollapsed(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.collapseToggleText}>COLLAPSE AVATAR</Text>
              <ChevronUp color={Colors.cyan} size={13} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.collapsedHudBar}
            onPress={() => setIsAvatarCollapsed(false)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsedLeft}>
              <View style={styles.livePulseDot} />
              <Radio color={Colors.cyan} size={14} />
              <Text style={styles.collapsedTitle}>
                {isProcessing
                  ? processingStatus || 'PROCESSING CORTEX...'
                  : isSpeaking
                  ? 'SPEAKING RESPONSE...'
                  : 'HOLO-CORTEX STANDBY'}
              </Text>
            </View>
            <View style={styles.expandPrompt}>
              <Text style={styles.expandPromptText}>EXPAND</Text>
              <ChevronDown color={Colors.cyan} size={13} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Camera Viewport Overlay */}
      {showCamera && (
        <CameraScanner
          mode={cameraMode}
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* ========================================== */}
      {/* CHAT MESSAGES FEED (SPACIOUS & EXPANDED)   */}
      {/* ========================================== */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isUser = item.role === 'user';
          return (
            <View style={[styles.msgWrapper, isUser ? styles.msgWrapperUser : styles.msgWrapperBot]}>
              <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleBot]}>
                <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextBot]}>
                  {item.text}
                </Text>

                {/* Attached photo thumbnail */}
                {item.imageUri ? (
                  <Image
                    source={{
                      uri: item.imageUri.startsWith('data:')
                        ? item.imageUri
                        : `data:image/jpeg;base64,${item.imageUri}`,
                    }}
                    style={styles.msgImage}
                    resizeMode="cover"
                  />
                ) : null}

                {/* Audio Sample button */}
                {item.audioBase64 ? (
                  <TouchableOpacity
                    style={styles.audioSampleBox}
                    onPress={() => playVoiceSample(item.audioBase64)}
                  >
                    <Volume2 color={Colors.cyan} size={14} />
                    <Text style={styles.audioSampleText}>Play Voice Sample</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      {/* Suggested Chips Carousel */}
      <View style={styles.suggestionsStrip}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={suggestions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => handleSuggestionClick(item)}
            >
              <Sparkles color={Colors.cyan} size={11} />
              <Text style={styles.suggestionText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ========================================== */}
      {/* ERGONOMIC QUICK OPTICAL TOOLBAR            */}
      {/* ========================================== */}
      <View style={styles.quickBar}>
        <TouchableOpacity
          style={[styles.quickBarBtn, { borderColor: Colors.cyanBorder }]}
          onPress={() => {
            setCameraMode('person');
            setShowCamera(true);
          }}
        >
          <Eye color={Colors.cyan} size={14} />
          <Text style={[styles.quickBarText, { color: Colors.cyan }]}>SCAN FACE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBarBtn, { borderColor: Colors.amberBorder }]}
          onPress={() => {
            setCameraMode('object');
            setShowCamera(true);
          }}
        >
          <Package color={Colors.amber} size={14} />
          <Text style={[styles.quickBarText, { color: Colors.amber }]}>SCAN OBJECT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBarBtn, { borderColor: Colors.emeraldBorder }]}
          onPress={() => {
            setEnrollType('person');
            setShowEnrollModal(true);
          }}
        >
          <UserPlus color={Colors.emerald} size={14} />
          <Text style={[styles.quickBarText, { color: Colors.emerald }]}>ENROLL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBarBtn, { borderColor: 'rgba(255,255,255,0.1)' }]}
          onPress={() => onNavigate('game')}
        >
          <Gamepad2 color={Colors.textMuted} size={14} />
          <Text style={[styles.quickBarText, { color: Colors.textMuted }]}>GAMES</Text>
        </TouchableOpacity>
      </View>

      {/* ========================================== */}
      {/* CHAT INPUT BAR                             */}
      {/* ========================================== */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={[styles.micBtn, isRecordingVoice && styles.micBtnRecording]}
          onPressIn={startVoiceRecording}
          onPressOut={stopVoiceRecording}
        >
          <Mic color={isRecordingVoice ? '#fff' : Colors.amber} size={18} />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask a question or share a memory..."
          placeholderTextColor={Colors.textDark}
          onSubmitEditing={() => handleSend()}
        />

        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#111318" size="small" />
          ) : (
            <Send color="#111318" size={16} />
          )}
        </TouchableOpacity>
      </View>

      {/* Enrollment Modal */}
      <EnrollmentModal
        visible={showEnrollModal}
        initialType={enrollType}
        onClose={() => setShowEnrollModal(false)}
        onEnrollSuccess={(res) => {
          addBotMessage(`I've remembered ${res.name}.`);
          speakText(`I have remembered ${res.name}.`);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  avatarHeaderWrapper: {
    backgroundColor: '#16181f',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  collapseToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  collapseToggleText: {
    color: Colors.cyan,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  collapsedHudBar: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#0c1322',
  },
  collapsedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.amber,
  },
  collapsedTitle: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  expandPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandPromptText: {
    color: Colors.amber,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  chatList: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 8,
  },
  msgWrapper: {
    marginBottom: 12,
    maxWidth: '82%',
  },
  msgWrapperUser: {
    alignSelf: 'flex-end',
  },
  msgWrapperBot: {
    alignSelf: 'flex-start',
  },
  msgBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgBubbleUser: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  msgBubbleBot: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgTextUser: {
    color: Colors.textPrimary,
  },
  msgTextBot: {
    color: Colors.textPrimary,
  },
  msgImage: {
    width: 180,
    height: 120,
    borderRadius: 10,
    marginTop: 8,
  },
  audioSampleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  audioSampleText: {
    color: Colors.amber,
    fontSize: 10,
    fontWeight: '700',
  },
  suggestionsStrip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
  },
  suggestionText: {
    color: Colors.textPrimary,
    fontSize: 10.5,
    fontWeight: '600',
  },
  quickBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  quickBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
  },
  quickBarText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#16181f',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnRecording: {
    backgroundColor: Colors.red,
    borderColor: Colors.red,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    color: Colors.textPrimary,
    fontSize: 12.5,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
