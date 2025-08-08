import { VoiceProvider, SynthesisRequest, SynthesisResponse, VoiceInfo } from '../types';

interface GoogleTTSConfig {
  projectId: string;
  accessToken: string;
  apiUrl: string;
}

interface GoogleTTSRequestData {
  input: {
    text?: string;
    ssml?: string;
    markup?: string;
  };
  voice: {
    languageCode: string;
    name: string;
    voiceClone?: {};
  };
  audioConfig: {
    audioEncoding: string;
    speakingRate: number;
    pitch: number;
    volumeGainDb: number;
  };
}

export class GoogleTTSProvider implements VoiceProvider {
  name = 'google';
  private config: GoogleTTSConfig;

  constructor(config: GoogleTTSConfig) {
    this.config = config;
  }

  async isAvailable(): Promise<boolean> {
    // Check if we have the required configuration
    if (!this.config.projectId || !this.config.accessToken || !this.config.apiUrl) {
      console.warn('Google TTS: Missing configuration');
      return false;
    }

    try {
      // Test the API with a minimal request using standard voice first
      const testResponse = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-User-Project': this.config.projectId,
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        body: JSON.stringify({
          input: { text: 'test' },
          voice: { 
            languageCode: 'en-US', 
            name: 'en-US-Standard-A' 
          },
          audioConfig: {
            audioEncoding: 'LINEAR16',
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0
          }
        })
      });

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.warn('Google TTS: Test request failed', testResponse.status, errorText);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Google TTS: Availability check failed', error);
      return false;
    }
  }

  async synthesize(request: SynthesisRequest): Promise<SynthesisResponse> {
    const { text, personality, config: requestConfig } = request;
    
    // Get personality-specific voice configuration
    const voiceConfig = this.getPersonalityVoiceConfig(personality);
    
    // Override with any request-specific config
    const finalConfig = { ...voiceConfig, ...requestConfig };

    const requestData: GoogleTTSRequestData = {
      input: {
        text: this.preprocessText(text, personality)
      },
      voice: {
        languageCode: finalConfig.languageCode,
        name: finalConfig.voiceName,
        voiceClone: {}
      },
      audioConfig: {
        audioEncoding: 'LINEAR16',
        speakingRate: finalConfig.rate,
        pitch: this.convertPitchToSemitones(finalConfig.pitch),
        volumeGainDb: this.convertVolumeToDb(finalConfig.volume)
      }
    };

    try {
      console.log('Google TTS Request:', {
        url: this.config.apiUrl,
        voiceName: finalConfig.voiceName,
        data: requestData
      });

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-User-Project': this.config.projectId,
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google TTS Error Response:', errorText);
        
        // If Chirp3-HD voice fails, try fallback to standard voice
        if (finalConfig.voiceName.includes('Chirp3-HD')) {
          console.warn(`Chirp3-HD voice ${finalConfig.voiceName} failed, trying standard voice fallback`);
          const fallbackVoice = this.getFallbackVoice(personality);
          const fallbackRequest = {
            ...requestData,
            voice: {
              languageCode: finalConfig.languageCode,
              name: fallbackVoice,
              voiceClone: {}
            }
          };
          
          const fallbackResponse = await fetch(this.config.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-User-Project': this.config.projectId,
              'Authorization': `Bearer ${this.config.accessToken}`
            },
            body: JSON.stringify(fallbackRequest)
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            return this.createAudioResponse(fallbackData);
          }
        }
        
        throw new Error(`Google TTS HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return this.createAudioResponse(data);

    } catch (error) {
      console.error('Google TTS synthesis error:', error);
      throw new Error(`Google TTS synthesis failed: ${error.message}`);
    }
  }

  async getAvailableVoices(): Promise<VoiceInfo[]> {
    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/voices`, {
        headers: {
          'X-Goog-User-Project': this.config.projectId,
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      
      return data.voices.map((voice: any) => ({
        name: voice.name,
        languageCode: voice.languageCodes[0],
        gender: voice.ssmlGender.toLowerCase(),
        provider: 'google'
      }));
    } catch (error) {
      console.error('Error fetching Google TTS voices:', error);
      return [];
    }
  }

  private getPersonalityVoiceConfig(personality: string) {
    // Mix of Chirp3-HD (no pitch) and Standard voices - all with normal rates
    const personalityVoices = {
      default: {
        voiceName: 'en-US-Chirp3-HD-Achernar', // Confirmed working - no pitch
        languageCode: 'en-US',
        rate: 1.0,
        pitch: 0.0,
        volume: 0.8
      },
      roast: {
        voiceName: 'en-US-Chirp3-HD-Despina', // Use standard for pitch control
        languageCode: 'en-US',
        rate: 1.0,
        // pitch: 1.0,
        volume: 0.9
      },
      hype: {
        voiceName: 'en-US-Standard-B', // Use standard male for pitch control
        languageCode: 'en-US',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      },
      conspiracy: {
        voiceName: 'en-US-Chirp3-HD-Algieba', // Confirmed working - no pitch
        languageCode: 'en-US',
        rate: 1.0,
        pitch: 0.0,
        volume: 0.8
      },
      motivational: {
        voiceName: 'en-US-Chirp3-HD-Puck', // Confirmed working - no pitch
        languageCode: 'en-US',
        rate: 1.0,
        pitch: 0.0,
        volume: 0.9
      },
      sleepy: {
        voiceName: 'en-US-Standard-G', // Use standard for pitch control
        languageCode: 'en-US',
        rate: 1.0,
        pitch: 0.0,
        volume: 0.8
      }
    };

    return personalityVoices[personality] || personalityVoices.default;
  }

  private getFallbackVoice(personality: string): string {
    // Standard voice fallbacks for each personality
    const fallbackVoices = {
      default: 'en-US-Standard-H',
      roast: 'en-US-Standard-F',
      hype: 'en-US-Standard-B',
      conspiracy: 'en-US-Standard-D',
      motivational: 'en-US-Standard-A',
      sleepy: 'en-US-Standard-G'
    };
    return fallbackVoices[personality] || fallbackVoices.default;
  }

  private createAudioResponse(data: any): SynthesisResponse {
    // Convert base64 to blob
    const audioBytes = atob(data.audioContent);
    const audioArray = new Uint8Array(audioBytes.length);
    for (let i = 0; i < audioBytes.length; i++) {
      audioArray[i] = audioBytes.charCodeAt(i);
    }

    const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      audioUrl,
      cleanup: () => {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }

  private preprocessText(text: string, personality: string): string {
    // Remove emojis and replace with text for better pronunciation
    let processedText = text
      .replace(/🔥/g, ' fire ')
      .replace(/🎉/g, ' party ')
      .replace(/🚀/g, ' rocket ')
      .replace(/🕵️/g, ' detective ')
      .replace(/👁️/g, ' eye ')
      .replace(/🌚/g, ' moon ')
      .replace(/💪/g, ' strong ')
      .replace(/⚡/g, ' lightning ')
      .replace(/😴/g, ' sleepy ')
      .replace(/🌙/g, ' moon ')
      .replace(/💤/g, ' zzz ')
      .replace(/✨/g, ' sparkle ');

    // No SSML processing - return clean text only
    return processedText;
  }

  private convertPitchToSemitones(pitch: number): number {
    // For Chirp3-HD voices, pitch should be in range -20.0 to 20.0 semitones
    // Clamp the input to safe range
    return Math.max(-20.0, Math.min(20.0, pitch));
  }

  private convertVolumeToDb(volume: number): number {
    // Convert 0.0-1.0 volume to dB gain (-96 to +16)
    if (volume <= 0) return -96;
    if (volume >= 1) return 0;
    
    // Logarithmic conversion
    return 20 * Math.log10(volume);
  }
}

// Factory function to create Google TTS provider with environment config
export function createGoogleTTSProvider(): GoogleTTSProvider {
  const config = {
    projectId: import.meta.env.VITE_GOOGLE_PROJECT_ID || 'ouluva-50a13',
    accessToken: import.meta.env.VITE_GOOGLE_ACCESS_TOKEN || '',
    apiUrl: 'https://texttospeech.googleapis.com/v1/text:synthesize'
  };

  return new GoogleTTSProvider(config);
}