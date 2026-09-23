// Web Audio API Synthesizer for Soothing, Therapeutic Auditory Feedback
// Zero external sound asset dependencies; 100% offline and low latency.

class SoundSynth {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    setMuted(muted) {
        this.muted = muted;
    }

    isMuted() {
        return this.muted;
    }

    playTone(freq, type = 'sine', duration = 0.3, volume = 0.2, fadeOut = true) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            if (fadeOut) {
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
            }

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.debug('Audio synth play error', e);
        }
    }

    // Card Flip Tick: Gentle tactile click
    playCardFlip() {
        this.playTone(480, 'triangle', 0.08, 0.15);
    }

    // Pair Match Chime: Warm, uplifting two-note chime (C5 -> G5)
    playMatchSuccess() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.playNoteWithDelay(523.25, now, 0.3, 0.25); // C5
        this.playNoteWithDelay(783.99, now + 0.12, 0.45, 0.3); // G5
    }

    // Gentle Try-Again: Soft, comforting neutral chime (not a harsh buzzer)
    playTryAgain() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.playNoteWithDelay(329.63, now, 0.25, 0.15); // E4
        this.playNoteWithDelay(293.66, now + 0.14, 0.35, 0.15); // D4
    }

    // Sequence Node Chimes: 4 distinct, harmonious marimba-like notes
    playNodeTone(index) {
        const tones = [
            261.63, // C4
            329.63, // E4
            392.00, // G4
            523.25  // C5
        ];
        const freq = tones[index % tones.length];
        this.playTone(freq, 'sine', 0.45, 0.28);
    }

    // Victory Celebration: Harmonic C Major chord flourish
    playVictory() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
            this.playNoteWithDelay(freq, now + idx * 0.1, 0.5, 0.25);
        });
    }

    playNoteWithDelay(freq, startTime, duration, volume) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        } catch (e) {
            console.debug(e);
        }
    }
}

export const sound = new SoundSynth();
export default sound;
