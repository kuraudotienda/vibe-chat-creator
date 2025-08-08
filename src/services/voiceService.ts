import { PersonalityMode } from '../types';

export interface VoiceConfig {
  rate: number;
  pitch: number;
  volume: number;
  voiceName?: string;
  language: string;
}

export interface SpeechState {
  isSpeaking: boolean;
  currentUtterance: SpeechSynthesisUtterance | null;
  isPaused: boolean;
}

class VoiceService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  
  // Personality-specific voice configurations
  private personalityConfigs: Record<PersonalityMode, VoiceConfig> = {
    default: {
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      language: 'en-US'
    },
    roast: {
      rate: 1.3,
      pitch: 1.2,
      volume: 0.9,
      language: 'en-US'
    },
    hype: {
      rate: 1.4,
      pitch: 1.3,
      volume: 1.0,
      language: 'en-US'
    },
    conspiracy: {
      rate: 1.0,
      pitch: 0.8,
      volume: 0.6,
      language: 'en-US'
    },
    motivational: {
      rate: 1.1,
      pitch: 1.1,
      volume: 0.95,
      language: 'en-US'
    },
    sleepy: {
      rate: 0.9,
      pitch: 0.7,
      volume: 0.5,
      language: 'en-US'
    }
  };

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    
    // Handle voice loading (some browsers load voices asynchronously)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    this.voices = this.synthesis.getVoices();
  }

  private getVoiceForPersonality(personality: PersonalityMode): SpeechSynthesisVoice | null {
    // Preferred voices for each personality
    const voicePreferences: Record<PersonalityMode, string[]> = {
      default: ['Google US English', 'Alex', 'Microsoft David', 'English (US)'],
      roast: ['Google US English Female', 'Samantha', 'Microsoft Zira', 'English (US)'],
      hype: ['Google US English', 'Fred', 'Microsoft Mark', 'English (US)'],
      conspiracy: ['Google UK English Male', 'Daniel', 'Microsoft George', 'English (UK)'],
      motivational: ['Google US English', 'Alex', 'Microsoft David', 'English (US)'],
      sleepy: ['Google US English Female', 'Samantha', 'Microsoft Zira', 'English (US)']
    };

    const preferences = voicePreferences[personality];
    
    // Try to find a preferred voice
    for (const preference of preferences) {
      const voice = this.voices.find(v => 
        v.name.includes(preference) || 
        v.voiceURI.includes(preference)
      );
      if (voice) return voice;
    }

    // Fallback to first available voice for the language
    const config = this.personalityConfigs[personality];
    return this.voices.find(v => v.lang.startsWith(config.language.split('-')[0])) || null;
  }

  
  public speak(text: string, personality: PersonalityMode): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any current speech
      this.stop();

      if (!text.trim()) {
        resolve();
        return;
      }

      // Process text for personality
      // const processedText = this.processTextForPersonality(text, personality);
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      const config = this.personalityConfigs[personality];
      
      // Apply voice configuration
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.volume = config.volume;
      utterance.lang = config.language;
      
      // Set voice if available
      const voice = this.getVoiceForPersonality(personality);
      if (voice) {
        utterance.voice = voice;
      }

      // Set up event listeners
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Store reference and speak
      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  public stop(): void {
    if (this.currentUtterance) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  public resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  public isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  public isPaused(): boolean {
    return this.synthesis.paused;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public updatePersonalityConfig(personality: PersonalityMode, config: Partial<VoiceConfig>): void {
    this.personalityConfigs[personality] = {
      ...this.personalityConfigs[personality],
      ...config
    };
  }

  public getPersonalityConfig(personality: PersonalityMode): VoiceConfig {
    return { ...this.personalityConfigs[personality] };
  }

  // Method to check if speech synthesis is supported
  public isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
export default voiceService;