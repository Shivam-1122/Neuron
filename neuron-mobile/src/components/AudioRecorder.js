import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Colors } from '../theme/colors';
import { Mic, Square, Play, RefreshCw, CheckCircle2 } from 'lucide-react-native';

export default function AudioRecorder({ onRecordingComplete, label = 'Record Voice Sample' }) {
  const [recording, setRecording] = useState(null);
  const [recordedUri, setRecordedUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Start Audio Recording
  const startRecording = async () => {
    try {
      setIsProcessing(true);
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        alert('Microphone permission required for audio recording.');
        setIsProcessing(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
    } catch (err) {
      console.warn('Failed to start recording:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Stop Audio Recording
  const stopRecording = async () => {
    if (!recording) return;
    try {
      setIsProcessing(true);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      setRecording(null);
      setRecordedUri(uri);
      if (onRecordingComplete) onRecordingComplete(uri);
    } catch (err) {
      console.warn('Failed to stop recording:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Play Sample
  const playSample = async () => {
    if (!recordedUri || isPlaying) return;
    try {
      setIsPlaying(true);
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedUri });
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
      await newSound.playAsync();
    } catch (err) {
      console.warn('Playback error:', err);
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    setRecordedUri(null);
    if (onRecordingComplete) onRecordingComplete(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {recordedUri ? (
        <View style={styles.recordedBox}>
          <View style={styles.successRow}>
            <CheckCircle2 color={Colors.emerald} size={18} />
            <Text style={styles.successText}>VOICE SIGNATURE CAPTURED</Text>
          </View>
          <View style={styles.playbackButtons}>
            <TouchableOpacity style={styles.playBtn} onPress={playSample} disabled={isPlaying}>
              <Play color={Colors.cyan} size={15} />
              <Text style={styles.playBtnText}>{isPlaying ? 'PLAYING...' : 'PLAY SAMPLE'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={resetRecording}>
              <RefreshCw color={Colors.textMuted} size={15} />
            </TouchableOpacity>
          </View>
        </View>
      ) : recording ? (
        <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
          <Square color="#fff" size={16} />
          <Text style={styles.stopBtnText}>STOP RECORDING</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.recordBtn} onPress={startRecording} disabled={isProcessing}>
          {isProcessing ? (
            <ActivityIndicator color={Colors.cyan} size="small" />
          ) : (
            <>
              <Mic color={Colors.cyan} size={16} />
              <Text style={styles.recordBtnText}>START RECORDING</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    borderRadius: 12,
    paddingVertical: 12,
  },
  recordBtnText: {
    color: Colors.cyan,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.red,
    borderRadius: 12,
    paddingVertical: 12,
  },
  stopBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recordedBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    borderRadius: 12,
    padding: 12,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  successText: {
    color: Colors.emerald,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playbackButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  playBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    borderRadius: 8,
    paddingVertical: 8,
  },
  playBtnText: {
    color: Colors.cyan,
    fontSize: 10,
    fontWeight: '700',
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
});
