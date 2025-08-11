import React from 'react';
import { BaseVisualizerProps } from '../types/visualizer';
import { WaveVisualizer } from './WaveVisualizer';
import { Avatar3D } from './Avatar3D';
import { Avatar3DAdvanced } from './Avatar3DAdvanced';
import { Avatar3DWorking } from './Avatar3DWorking';
import { useVoiceAudioSync } from '../hooks/useVoiceAudioSync';

// TOGGLE CONFIGURATION - Change this to switch between visualizers
const USE_3D_AVATAR = false; // Set to true to use 3D avatar, false for wave visualizer
const USE_ADVANCED_3D = true; // Set to true for full Ready Player Me integration, false for simple fallback

interface VisualizerSelectorProps extends Omit<BaseVisualizerProps, 'audioData'> {
  audioData?: Float32Array;
}

export const VisualizerSelector: React.FC<VisualizerSelectorProps> = ({ 
  personality, 
  isListening, 
  isSpeaking, 
  isSynthesizing,
  audioData: providedAudioData,
  width,
  height
}) => {
  const { audioData: realTimeAudioData, isConnected } = useVoiceAudioSync();
  
  // Use real-time audio data when available and speaking, otherwise fall back to provided data
  const audioData = (isSpeaking && isConnected && realTimeAudioData) 
    ? realTimeAudioData 
    : providedAudioData;

  const commonProps = {
    personality,
    isListening,
    isSpeaking,
    isSynthesizing,
    audioData,
    width,
    height
  };

  // Toggle between visualizers based on configuration
  if (USE_3D_AVATAR) {
    // Use the working Three.js implementation that bypasses Visage library issues
    return <Avatar3DWorking {...commonProps} />;
  } else {
    return <WaveVisualizer {...commonProps} />;
  }
};