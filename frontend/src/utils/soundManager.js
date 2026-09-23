// Singleton Sound & Background Music Manager for Neuron Cognitive Sanctuary

class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMusicPlaying = false;
        // Check if user has explicitly disabled music in Settings (defaults to true)
        const savedEnabled = localStorage.getItem('neuron_music_enabled');
        this.musicEnabled = savedEnabled !== 'false';
        this.musicGain = null;
        this.musicInterval = null;
        this.currentNodes = [];
        this.listeners = new Set();
        // Increased volume for rich, audible harmonium resonance
        this.volume = 0.50;
        const savedFx = localStorage.getItem('neuron_sound_fx_enabled');
        this.soundFxEnabled = savedFx !== 'false';
    }

    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    subscribe(listener) {
        this.listeners.add(listener);
        // Call immediately with current state
        listener({
            isMusicPlaying: this.isMusicPlaying,
            musicEnabled: this.musicEnabled,
            soundFxEnabled: this.soundFxEnabled,
            volume: this.volume
        });
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(fn => fn({
            isMusicPlaying: this.isMusicPlaying,
            musicEnabled: this.musicEnabled,
            soundFxEnabled: this.soundFxEnabled,
            volume: this.volume
        }));
    }

    isMusicEnabled() {
        return this.musicEnabled;
    }

    setMusicEnabled(enabled, autoStartIfInGame = false) {
        this.musicEnabled = Boolean(enabled);
        localStorage.setItem('neuron_music_enabled', this.musicEnabled ? 'true' : 'false');
        if (!this.musicEnabled) {
            this.stopBackgroundMusic();
        } else if (autoStartIfInGame) {
            this.startBackgroundMusic();
        }
        this.notify();
    }

    // Stop all active background oscillators and timers
    stopBackgroundMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }

        if (this.currentNodes && this.currentNodes.length > 0) {
            const now = this.ctx ? this.ctx.currentTime : 0;
            this.currentNodes.forEach(node => {
                try {
                    if (node.gain && node.gain.gain) {
                        node.gain.gain.setValueAtTime(node.gain.gain.value, now);
                        node.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
                    }
                    if (node.osc) {
                        setTimeout(() => {
                            try { node.osc.stop(); node.osc.disconnect(); } catch (e) {}
                        }, 350);
                    }
                } catch (e) {}
            });
            this.currentNodes = [];
        }

        this.isMusicPlaying = false;
        this.notify();
    }

    // Play serene, rich harmonium ambient chord progression (432 Hz Solfeggio tuning)
    startBackgroundMusic() {
        // Only play if user has not disabled music in settings
        if (!this.musicEnabled) {
            this.isMusicPlaying = false;
            this.notify();
            return;
        }

        this.init();
        if (!this.ctx) return;

        // Ensure any running music is stopped first to avoid duplicate sounds
        this.stopBackgroundMusic();

        this.isMusicPlaying = true;
        this.notify();

        // Authentic Indian Classical / Solfeggio meditative chord progressions tuned around 432Hz
        const chords = [
            [216, 270, 324, 432],       // A-major / Sa-Ga-Pa 432Hz root
            [240, 288, 360, 480],       // Calm F#m / D-major harmonic warmth
            [192, 240, 288, 384],       // Warm G-major resonance
            [216, 259.2, 324, 432]      // Gentle meditative return resolution
        ];

        let chordIndex = 0;

        const playChord = () => {
            if (!this.isMusicPlaying || !this.ctx || !this.musicEnabled) return;

            const now = this.ctx.currentTime;
            const freqs = chords[chordIndex % chords.length];
            chordIndex++;

            freqs.forEach((freq, i) => {
                try {
                    // Fundamental oscillator (triangle wave for natural harmonium reed body)
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();

                    osc.type = i % 2 === 0 ? 'triangle' : 'sine';
                    osc.frequency.setValueAtTime(freq, now);

                    // Richer, increased volume for relaxing harmonium warmth
                    const targetVol = (0.16 / freqs.length) * (this.volume / 0.50);
                    gain.gain.setValueAtTime(0.0001, now + (i * 0.15));
                    gain.gain.linearRampToValueAtTime(targetVol, now + 1.2 + (i * 0.15));
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.6);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);

                    osc.start(now + (i * 0.15));
                    osc.stop(now + 6.0);

                    const nodeRef = { osc, gain };
                    this.currentNodes.push(nodeRef);

                    setTimeout(() => {
                        const idx = this.currentNodes.indexOf(nodeRef);
                        if (idx !== -1) this.currentNodes.splice(idx, 1);
                    }, 6200);
                } catch (e) {}
            });
        };

        // Play initial chord immediately
        playChord();
        // Schedule next chord every 5.2 seconds
        this.musicInterval = setInterval(() => {
            playChord();
        }, 5200);
    }

    toggleMusic() {
        if (this.isMusicPlaying) {
            this.stopBackgroundMusic();
        } else {
            this.startBackgroundMusic();
        }
    }

    // Play a gentle UI interaction tone
    playChime(type = 'click') {
        if (!this.soundFxEnabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(432, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.stop(now + 0.14);
            } else if (type === 'send') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(528, now);
                osc.frequency.exponentialRampToValueAtTime(741, now + 0.18);
                gain.gain.setValueAtTime(0.14, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.stop(now + 0.24);
            }

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
        } catch (e) {}
    }

    isSoundFxEnabled() {
        return this.soundFxEnabled;
    }

    setSoundFx(enabled) {
        this.soundFxEnabled = Boolean(enabled);
        try {
            localStorage.setItem('neuron_sound_fx_enabled', this.soundFxEnabled ? 'true' : 'false');
        } catch (e) {}
        this.notify();
    }
}

export const soundManager = new SoundManager();
export default soundManager;
