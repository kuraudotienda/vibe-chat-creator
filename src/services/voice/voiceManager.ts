import { PersonalityMode } from '../types';
import { 
  VoiceProvider, 
  VoiceServiceConfig, 
  SynthesisRequest, 
  SynthesisResponse, 
  QueuedSynthesis 
} from './types';
import { createGoogleTTSProvider } from './providers/googleTTS';
import { WebSpeechAPIProvider } from './providers/webSpeechAPI';

export class VoiceManager {
  private providers: Map<string, VoiceProvider> = new Map();
  private config: VoiceServiceConfig;
  private synthesisQueue: QueuedSynthesis[] = [];
  private isProcessingQueue = false;
  private currentAudio: HTMLAudioElement | null = null;

  constructor(config: Partial<VoiceServiceConfig> = {}) {
    this.config = {
      defaultProvider: 'web',
      fallbackProviders: ['web'],
      enableQueue: true,
      maxRetries: 2,
      personalityConfigs: {
        default: {
          rate: 1.0,
          pitch: 0.0,
          volume: 0.8,
          voiceName: 'en-US-Chirp3-HD-Achernar',
          languageCode: 'en-US',
          provider: 'google'
        },
        roast: {
          rate: 1.0,
          pitch: 1.0,
          volume: 0.9,
          voiceName: 'en-US-Standard-F',
          languageCode: 'en-US',
          provider: 'google'
        },
        hype: {
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          voiceName: 'en-US-Standard-B',
          languageCode: 'en-US',
          provider: 'google'
        },
        conspiracy: {
          rate: 1.0,
          pitch: 0.0,
          volume: 0.8,
          voiceName: 'en-US-Chirp3-HD-Algieba',
          languageCode: 'en-US',
          provider: 'google'
        },
        motivational: {
          rate: 1.0,
          pitch: 0.0,
          volume: 0.9,
          voiceName: 'en-US-Chirp3-HD-Puck',
          languageCode: 'en-US',
          provider: 'google'
        },
        sleepy: {
          rate: 1.0,
          pitch: 0.0,
          volume: 0.8,
          voiceName: 'en-US-Standard-G',
          languageCode: 'en-US',
          provider: 'google'
        }
      },
      ...config
    };

    this.initializeProviders();
  }

  private async initializeProviders() {
    // Initialize Google TTS provider
    try {
      const googleProvider = createGoogleTTSProvider();
      this.providers.set('google', googleProvider);
    } catch (error) {
      console.warn('Failed to initialize Google TTS provider:', error);
    }

    // Initialize Web Speech API provider (always available as fallback)
    try {
      const webProvider = new WebSpeechAPIProvider();
      this.providers.set('web', webProvider);
    } catch (error) {
      console.warn('Failed to initialize Web Speech API provider:', error);
    }

    // Auto-detect best available provider
    await this.detectBestProvider();
  }

  private async detectBestProvider() {
    const providersToTest = [this.config.defaultProvider, ...this.config.fallbackProviders];
    
    for (const providerName of providersToTest) {
      const provider = this.providers.get(providerName);
      if (provider && await provider.isAvailable()) {
        this.config.defaultProvider = providerName as any;
        console.log(`Voice Manager: Using ${providerName} as primary provider`);
        return;
      }
    }

    console.warn('Voice Manager: No providers available');
  }

  public async synthesize(
    text: string, 
    personality: PersonalityMode,
    options: {
      priority?: 'high' | 'normal' | 'low';
      onSynthesisStart?: () => void;
      onSynthesisComplete?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<SynthesisResponse> {
    if (!this.config.enableQueue) {
      return this.synthesizeImmediate(text, personality, options);
    }

    return new Promise((resolve, reject) => {
      const queueItem: QueuedSynthesis = {
        id: `synthesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        request: { text, personality },
        resolve,
        reject,
        retries: 0,
        timestamp: Date.now()
      };

      // Add to queue based on priority
      if (options.priority === 'high') {
        this.synthesisQueue.unshift(queueItem);
      } else {
        this.synthesisQueue.push(queueItem);
      }

      // Start processing queue if not already running
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  private async synthesizeImmediate(
    text: string, 
    personality: PersonalityMode,
    options: {
      onSynthesisStart?: () => void;
      onSynthesisComplete?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<SynthesisResponse> {
    const request: SynthesisRequest = { text, personality };
    
    // Get the preferred provider for this personality
    const personalityConfig = this.config.personalityConfigs[personality];
    const providerName = personalityConfig?.provider || this.config.defaultProvider;
    
    const providersToTry = [
      providerName,
      ...this.config.fallbackProviders.filter(p => p !== providerName)
    ];

    let lastError: Error | null = null;

    options.onSynthesisStart?.();

    for (const providerName of providersToTry) {
      const provider = this.providers.get(providerName);
      
      if (!provider) {
        console.warn(`Provider ${providerName} not found`);
        continue;
      }

      try {
        if (!(await provider.isAvailable())) {
          console.warn(`Provider ${providerName} not available`);
          continue;
        }

        console.log(`Attempting synthesis with ${providerName} provider`);
        const response = await provider.synthesize(request);
        
        options.onSynthesisComplete?.();
        return response;

      } catch (error) {
        console.warn(`Synthesis failed with ${providerName}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    const finalError = lastError || new Error('All voice providers failed');
    options.onError?.(finalError);
    throw finalError;
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.synthesisQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.synthesisQueue.length > 0) {
      const queueItem = this.synthesisQueue.shift()!;

      try {
        const response = await this.synthesizeImmediate(
          queueItem.request.text,
          queueItem.request.personality
        );
        
        queueItem.resolve(response);

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        // Retry logic
        if (queueItem.retries < this.config.maxRetries) {
          queueItem.retries++;
          console.warn(`Retrying synthesis (${queueItem.retries}/${this.config.maxRetries}):`, err.message);
          
          // Add back to queue with exponential backoff
          setTimeout(() => {
            this.synthesisQueue.unshift(queueItem);
          }, Math.pow(2, queueItem.retries) * 1000);
        } else {
          console.error('Synthesis failed after all retries:', err);
          queueItem.reject(err);
        }
      }

      // Small delay between queue items
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessingQueue = false;
  }

  public async speak(
    text: string, 
    personality: PersonalityMode,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stop();

      const response = await this.synthesize(text, personality, {
        onSynthesisStart: options.onStart,
        onError: options.onError
      });

      // For Web Speech API, synthesis starts immediately
      if (response.audioUrl === 'web-speech-active') {
        // Web Speech API handles playback internally
        return;
      }

      // For other providers, create and play audio element
      const audio = new Audio(response.audioUrl);
      this.currentAudio = audio;

      audio.onloadeddata = () => {
        options.onStart?.();
      };

      audio.onended = () => {
        options.onEnd?.();
        response.cleanup?.();
        this.currentAudio = null;
      };

      audio.onerror = (event) => {
        const error = new Error('Audio playback failed');
        options.onError?.(error);
        response.cleanup?.();
        this.currentAudio = null;
      };

      await audio.play();

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      options.onError?.(err);
      throw err;
    }
  }

  public stop(): void {
    // Stop Web Speech API
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    // Stop audio element
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  public clearQueue(): void {
    this.synthesisQueue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.synthesisQueue = [];
  }

  public getQueueLength(): number {
    return this.synthesisQueue.length;
  }

  public getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  public getCurrentAudio(): HTMLAudioElement | null {
    return this.currentAudio;
  }

  public async getAvailableVoices(providerName?: string) {
    if (providerName) {
      const provider = this.providers.get(providerName);
      return provider?.getAvailableVoices?.() || [];
    }

    // Get voices from all providers
    const allVoices = [];
    for (const [name, provider] of this.providers) {
      if (provider.getAvailableVoices) {
        try {
          const voices = await provider.getAvailableVoices();
          allVoices.push(...voices);
        } catch (error) {
          console.warn(`Failed to get voices from ${name}:`, error);
        }
      }
    }

    return allVoices;
  }

  public updatePersonalityConfig(personality: PersonalityMode, config: Partial<typeof this.config.personalityConfigs[PersonalityMode]>) {
    this.config.personalityConfigs[personality] = {
      ...this.config.personalityConfigs[personality],
      ...config
    };
  }

  public setDefaultProvider(providerName: 'google' | 'amazon' | 'web') {
    if (this.providers.has(providerName)) {
      this.config.defaultProvider = providerName;
    } else {
      console.warn(`Provider ${providerName} not available`);
    }
  }
}

// Export singleton instance
export const voiceManager = new VoiceManager();
export default voiceManager;