import { VoiceProvider, SynthesisRequest, SynthesisResponse, VoiceInfo } from '../types';

export class WebSpeechAPIProvider implements VoiceProvider {
  name = 'web';
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.loadVoices();
    
    // Handle voice loading (some browsers load voices asynchronously)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  async isAvailable(): Promise<boolean> {
    return 'speechSynthesis' in window;
  }

  async synthesize(request: SynthesisRequest): Promise<SynthesisResponse> {
    const { text, personality, config: requestConfig } = request;
    
    if (!this.isAvailable()) {
      throw new Error('Web Speech API not available');
    }

    return new Promise((resolve, reject) => {
      // Get personality-specific voice configuration
      const voiceConfig = this.getPersonalityVoiceConfig(personality);
      
      // Override with any request-specific config
      const finalConfig = { ...voiceConfig, ...requestConfig };

      // Process text for personality
      const processedText = this.preprocessText(text, personality);
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(processedText);
      
      // Apply voice configuration
      utterance.rate = finalConfig.rate;
      utterance.pitch = finalConfig.pitch;
      utterance.volume = finalConfig.volume;
      utterance.lang = finalConfig.languageCode;
      
      // Set voice if available
      const voice = this.getVoiceForPersonality(personality);
      if (voice) {
        utterance.voice = voice;
      }

      // Create a promise that resolves when speech starts
      // This simulates having an audio URL immediately available
      utterance.onstart = () => {
        // For Web Speech API, we don't have a real audio URL
        // We return a placeholder that represents the speaking state
        resolve({
          audioUrl: 'web-speech-active',
          cleanup: () => {
            speechSynthesis.cancel();
          }
        });
      };
      
      utterance.onerror = (event) => {
        reject(new Error(`Web Speech API error: ${event.error}`));
      };

      // Start speaking
      speechSynthesis.speak(utterance);
    });
  }

  async getAvailableVoices(): Promise<VoiceInfo[]> {
    return this.voices.map(voice => ({
      name: voice.name,
      languageCode: voice.lang,
      gender: this.inferGenderFromName(voice.name),
      provider: 'web'
    }));
  }

  private loadVoices(): void {
    this.voices = speechSynthesis.getVoices();
  }

  private getPersonalityVoiceConfig(personality: string) {
    const configs = {
      default: {
        rate: 1.0,
        pitch: 1.0,
        volume: 0.8,
        voiceName: 'Google US English',
        languageCode: 'en-US'
      },
      roast: {
        rate: 1.3,
        pitch: 1.2,
        volume: 0.9,
        voiceName: 'Google US English Female',
        languageCode: 'en-US'
      },
      hype: {
        rate: 1.4,
        pitch: 1.3,
        volume: 1.0,
        voiceName: 'Google US English',
        languageCode: 'en-US'
      },
      conspiracy: {
        rate: 0.7,
        pitch: 0.8,
        volume: 0.6,
        voiceName: 'Google UK English Male',
        languageCode: 'en-GB'
      },
      motivational: {
        rate: 1.1,
        pitch: 1.1,
        volume: 0.95,
        voiceName: 'Google US English',
        languageCode: 'en-US'
      },
      sleepy: {
        rate: 0.6,
        pitch: 0.7,
        volume: 0.5,
        voiceName: 'Google US English Female',
        languageCode: 'en-US'
      }
    };

    return configs[personality] || configs.default;
  }

  private getVoiceForPersonality(personality: string): SpeechSynthesisVoice | null {
    const config = this.getPersonalityVoiceConfig(personality);
    const voicePreferences = [config.voiceName];
    
    // Try to find a preferred voice
    for (const preference of voicePreferences) {
      const voice = this.voices.find(v => 
        v.name.includes(preference) || 
        v.voiceURI.includes(preference)
      );
      if (voice) return voice;
    }

    // Fallback to first available voice for the language
    return this.voices.find(v => v.lang.startsWith(config.languageCode.split('-')[0])) || null;
  }

  private preprocessText(text: string, personality: string): string {
    // Add personality-specific text modifications for more expressive speech
    switch (personality) {
      case 'roast':
        return text.replace(/(\w+!)(\s|$)/g, '$1... ')
                  .replace(/🔥/g, ' FIRE ')
                  .replace(/🌶️/g, ' SPICY ');
      
      case 'hype':
        return text.replace(/(\b(?:YES|WOW|AMAZING|FIRE|EPIC|GOOO)\b)/gi, '$1!')
                  .replace(/🎉/g, ' PARTY ')
                  .replace(/🚀/g, ' ROCKET ');
      
      case 'conspiracy':
        return text.replace(/\.\.\./g, '... ... ...')
                  .replace(/🕵️/g, ' secret agent ')
                  .replace(/👁️/g, ' the eye ');
      
      case 'motivational':
        return text.replace(/(\b(?:CHAMPION|BELIEVE|FIRE|INSPIRE|DOMINATE)\b)/gi, '$1!')
                  .replace(/💪/g, ' STRENGTH ')
                  .replace(/⚡/g, ' POWER ');
      
      case 'sleepy':
        return text.replace(/\./g, '... ')
                  .replace(/😴/g, ' sleepy ')
                  .replace(/💤/g, ' dreams ');
      
      default:
        return text.replace(/✨/g, ' sparkle ');
    }
  }

  private inferGenderFromName(name: string): 'male' | 'female' | 'neutral' {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('female') || lowerName.includes('woman') || 
        lowerName.includes('samantha') || lowerName.includes('zira') ||
        lowerName.includes('susan') || lowerName.includes('karen')) {
      return 'female';
    }
    
    if (lowerName.includes('male') || lowerName.includes('man') ||
        lowerName.includes('david') || lowerName.includes('mark') ||
        lowerName.includes('alex') || lowerName.includes('daniel')) {
      return 'male';
    }
    
    return 'neutral';
  }
}