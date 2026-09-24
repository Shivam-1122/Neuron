// Neuron Audio Synthesizer for Mobile
// Generates low-latency therapeutic chimes using expo-av and base64 PCM WAV synthesis
import { Audio } from 'expo-av';

// Helper to convert array buffer to base64 string
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Generates a valid 8-bit mono PCM WAV data URI
function generateToneWav(frequency, durationSec = 0.25, volume = 0.5, fadeOut = true) {
  const sampleRate = 11025;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // "fmt " chunk
  view.setUint32(12, 0x666d7420, false);
  view.setUint16(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // byte rate (sampleRate * 1 * 1)
  view.setUint16(32, 1, true); // block align
  view.setUint16(34, 8, true); // bits per sample

  // "data" chunk
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const env = fadeOut ? Math.max(0, 1 - progress) : 1;
    const sampleVal = Math.sin(2 * Math.PI * frequency * t);
    // Convert -1..1 to 0..255 (8-bit PCM centered at 128)
    const byteVal = Math.floor(128 + sampleVal * 127 * volume * env);
    view.setUint8(44 + i, Math.max(0, Math.min(255, byteVal)));
  }

  return 'data:audio/wav;base64,' + arrayBufferToBase64(buffer);
}

class SoundEngine {
  constructor() {
    this.isMuted = false;
    this.soundCache = {};
    this.isAudioConfigured = false;
  }

  async initAudio() {
    if (!this.isAudioConfigured) {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        this.isAudioConfigured = true;
      } catch (e) {
        console.warn('AudioMode config note:', e);
      }
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  async playTone(freq, duration = 0.25, volume = 0.4) {
    if (this.isMuted) return;
    try {
      await this.initAudio();
      const uri = generateToneWav(freq, duration, volume);
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (e) {
      // Audio playback fallback
    }
  }

  // Card Flip tactile tick
  playCardFlip() {
    this.playTone(480, 0.08, 0.3);
  }

  // Match success: Uplifting two-tone chime (C5 -> G5)
  playMatchSuccess() {
    if (this.isMuted) return;
    this.playTone(523.25, 0.2, 0.4);
    setTimeout(() => {
      this.playTone(783.99, 0.35, 0.45);
    }, 120);
  }

  // Soft try-again chime (E4 -> D4)
  playTryAgain() {
    if (this.isMuted) return;
    this.playTone(329.63, 0.18, 0.25);
    setTimeout(() => {
      this.playTone(293.66, 0.25, 0.25);
    }, 140);
  }

  // 4 Harmonious Sequence Node Tones (Simon style)
  playNodeTone(index) {
    const tones = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const freq = tones[index % tones.length];
    this.playTone(freq, 0.35, 0.4);
  }

  // Victory celebration chime flourish
  playVictory() {
    if (this.isMuted) return;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 0.35);
      }, idx * 110);
    });
  }

  // Daily Routine step place click
  playStepPlace() {
    this.playTone(587.33, 0.12, 0.35); // D5
  }

  // Number Sort tile slide click
  playTileSlide() {
    this.playTone(440, 0.09, 0.3); // A4
  }
}

export const sound = new SoundEngine();
export default sound;
