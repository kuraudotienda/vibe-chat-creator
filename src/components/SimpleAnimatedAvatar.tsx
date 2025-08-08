import React from 'react';
import { PersonalityMode } from '../types';
import { WaveVisualizer } from './WaveVisualizer';
import { useVoiceAudioSync } from '../hooks/useVoiceAudioSync';

interface SimpleAnimatedAvatarProps {
  personality: PersonalityMode;
  isListening: boolean;
  isSpeaking: boolean;
  isSynthesizing: boolean;
  audioData?: Float32Array;
}

export const SimpleAnimatedAvatar = ({ 
  personality, 
  isListening, 
  isSpeaking, 
  isSynthesizing,
  audioData: providedAudioData
}: SimpleAnimatedAvatarProps) => {
  const { audioData: realTimeAudioData, isConnected } = useVoiceAudioSync();
  
  // Use real-time audio data when available and speaking, otherwise fall back to provided data
  const audioData = (isSpeaking && isConnected && realTimeAudioData) 
    ? realTimeAudioData 
    : providedAudioData;

  return (
    <WaveVisualizer
      personality={personality}
      isListening={isListening}
      isSpeaking={isSpeaking}
      isSynthesizing={isSynthesizing}
      audioData={audioData}
    />
  );
};