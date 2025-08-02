import { PersonalityMode } from '../../components/ChatInterface';

export interface VoiceConfig {
  rate: number;
  pitch: number;
  volume: number;
  voiceName: string;
  languageCode: string;
  provider: 'google' | 'amazon' | 'web';
}

export interface SynthesisRequest {
  text: string;
  personality: PersonalityMode;
  config?: Partial<VoiceConfig>;
}

export interface SynthesisResponse {
  audioUrl: string;
  duration?: number;
  cleanup: () => void;
}

export interface VoiceProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  synthesize(request: SynthesisRequest): Promise<SynthesisResponse>;
  getAvailableVoices?(): Promise<VoiceInfo[]>;
}

export interface VoiceInfo {
  name: string;
  languageCode: string;
  gender: 'male' | 'female' | 'neutral';
  provider: string;
}

export interface VoiceServiceConfig {
  defaultProvider: 'google' | 'amazon' | 'web';
  fallbackProviders: ('google' | 'amazon' | 'web')[];
  personalityConfigs: Record<PersonalityMode, VoiceConfig>;
  enableQueue: boolean;
  maxRetries: number;
}

export interface QueuedSynthesis {
  id: string;
  request: SynthesisRequest;
  resolve: (response: SynthesisResponse) => void;
  reject: (error: Error) => void;
  retries: number;
  timestamp: number;
}