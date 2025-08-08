class KeyboardSoundService {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.3;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Generate different sound variations for more natural typing
  private createKeySound(variation: number = 0): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.08; // Shorter duration for snappier sound
    const samples = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    // More realistic mechanical keyboard frequencies (much lower)
    const baseFreq = 200 + (variation * 30); // Lower base frequency
    const clickFreq = 800 + (variation * 100); // Lower click frequency
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      // Sharp attack with faster decay for mechanical click
      const envelope = Math.exp(-t * 25) * (1 - Math.exp(-t * 120));
      
      // Mix deeper thunk with crisp click (more balanced)
      const thunk = Math.sin(2 * Math.PI * baseFreq * t) * 0.6;
      const click = Math.sin(2 * Math.PI * clickFreq * t) * 0.4;
      
      // Minimal noise for cleaner sound
      const noise = (Math.random() - 0.5) * 0.03;
      
      data[i] = (thunk + click + noise) * envelope * this.volume;
    }

    return buffer;
  }

  // Create special sounds for different key types
  private createSpacebarSound(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1; // Shorter, more consistent with other keys
    const samples = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      // Lower pitched, deeper sound for spacebar
      const envelope = Math.exp(-t * 20) * (1 - Math.exp(-t * 100));
      const thunk = Math.sin(2 * Math.PI * 150 * t) * 0.7;
      const click = Math.sin(2 * Math.PI * 600 * t) * 0.3;
      const noise = (Math.random() - 0.5) * 0.02;
      
      data[i] = (thunk + click + noise) * envelope * this.volume;
    }

    return buffer;
  }

  private createEnterSound(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.09;
    const samples = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      // Deeper and more satisfying for Enter key
      const envelope = Math.exp(-t * 22) * (1 - Math.exp(-t * 110));
      const thunk = Math.sin(2 * Math.PI * 180 * t) * 0.6;
      const click = Math.sin(2 * Math.PI * 750 * t) * 0.4;
      const noise = (Math.random() - 0.5) * 0.02;
      
      data[i] = (thunk + click + noise) * envelope * this.volume;
    }

    return buffer;
  }

  async playKeySound(keyType: 'normal' | 'space' | 'enter' = 'normal') {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      await this.resumeAudioContext();

      let buffer: AudioBuffer | null = null;
      
      switch (keyType) {
        case 'space':
          buffer = this.createSpacebarSound();
          break;
        case 'enter':
          buffer = this.createEnterSound();
          break;
        default:
          // Use limited variation for normal keys (0-2 instead of 0-4)
          const variation = Math.floor(Math.random() * 3);
          buffer = this.createKeySound(variation);
          break;
      }

      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Reduced random variation for more consistent sound
      const timeVariation = Math.random() * 0.002; // Up to 2ms variation
      const volumeVariation = 0.9 + (Math.random() * 0.2); // 0.9-1.1x volume
      gainNode.gain.value = volumeVariation;
      
      source.start(this.audioContext.currentTime + timeVariation);
      
    } catch (error) {
      console.warn('Error playing keyboard sound:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isKeyboardSoundsEnabled(): boolean {
    return this.isEnabled;
  }
}

export const keyboardSounds = new KeyboardSoundService();