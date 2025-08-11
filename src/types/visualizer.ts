import { PersonalityMode } from './index';

export interface BaseVisualizerProps {
  personality: PersonalityMode;
  isListening: boolean;
  isSpeaking: boolean;
  isSynthesizing: boolean;
  audioData?: Float32Array;
  width?: number;
  height?: number;
}

export interface AudioAnalysis {
  volume: number;
  frequencies: number[];
  isSpeaking: boolean;
  zeroCrossingRate?: number;
  peakLevel?: number;
}

export type VisualizerType = 'wave' | 'avatar3d';