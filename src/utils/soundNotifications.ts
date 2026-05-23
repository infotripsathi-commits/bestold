// Sound notification utility for payout events

export type EventSoundType = 'new_request' | 'approved' | 'completed' | 'rejected';

// Sound frequencies for different event types (using Web Audio API)
const SOUND_FREQUENCIES: Record<EventSoundType, number[]> = {
  new_request: [800, 1000], // Rising tone
  approved: [600, 800, 1000], // Success chime
  completed: [1000, 800, 600], // Completion chime
  rejected: [400, 300], // Warning tone
};

const SOUND_DURATIONS: Record<EventSoundType, number> = {
  new_request: 200,
  approved: 150,
  completed: 150,
  rejected: 300,
};

class SoundNotificationManager {
  private audioContext: AudioContext | null = null;
  private volume: number = 0.5; // Default 50%
  private enabled: boolean = true;

  constructor() {
    // Initialize AudioContext on first user interaction
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async playSound(eventType: EventSoundType) {
    if (!this.enabled || this.volume === 0) {
      return;
    }

    if (!this.audioContext) {
      this.initAudioContext();
    }

    if (!this.audioContext) {
      console.warn('AudioContext not available');
      return;
    }

    try {
      const frequencies = SOUND_FREQUENCIES[eventType];
      const duration = SOUND_DURATIONS[eventType];
      const noteGap = 50; // Gap between notes in ms

      for (let i = 0; i < frequencies.length; i++) {
        await this.playTone(frequencies[i], duration, this.volume);
        if (i < frequencies.length - 1) {
          await this.sleep(noteGap);
        }
      }
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  private playTone(frequency: number, duration: number, volume: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext) {
        resolve();
        return;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // Envelope for smooth sound
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + 0.01); // Attack
      gainNode.gain.linearRampToValueAtTime(volume * 0.2, now + duration / 1000 - 0.01); // Sustain
      gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000); // Release

      oscillator.start(now);
      oscillator.stop(now + duration / 1000);

      oscillator.onended = () => {
        resolve();
      };
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const soundManager = new SoundNotificationManager();

// Helper function to play event sound
export function playEventSound(eventType: EventSoundType, volume?: number) {
  if (volume !== undefined) {
    soundManager.setVolume(volume);
  }
  soundManager.playSound(eventType);
}

// Helper function to set sound preferences
export function setSoundPreferences(enabled: boolean, volume: number) {
  soundManager.setEnabled(enabled);
  soundManager.setVolume(volume);
}
