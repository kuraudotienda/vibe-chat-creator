import { useRef, useEffect, useState } from 'react';
import { voiceManager } from '../services/voice/voiceManager';

export const useVoiceAudioSync = () => {
  const [audioData, setAudioData] = useState<Float32Array | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const monitorAudio = () => {
      const currentAudio = voiceManager.getCurrentAudio();
      
      if (currentAudio && currentAudio !== currentAudioRef.current) {
        // New audio element detected
        currentAudioRef.current = currentAudio;
        setIsConnected(true);
        
        // Generate smooth, captivating audio visualization data
        let lastAmplitude = 0;
        let transitionPhase = 0;
        
        const generateCaptivatingAudioData = () => {
          if (!currentAudio || currentAudio.paused || currentAudio.ended) {
            // Smooth fade out instead of abrupt stop
            if (lastAmplitude > 0.01) {
              const bufferLength = 512;
              const timeData = new Float32Array(bufferLength);
              lastAmplitude *= 0.92; // Gentle fade
              
              for (let i = 0; i < bufferLength; i++) {
                timeData[i] = Math.sin(i * 0.1) * lastAmplitude;
              }
              setAudioData(timeData);
            } else {
              setAudioData(null);
              lastAmplitude = 0;
            }
            return;
          }

          const bufferLength = 512;
          const timeData = new Float32Array(bufferLength);
          const audioTime = currentAudio.currentTime;
          const duration = currentAudio.duration || 10;
          
          // Smooth speech envelope - no abrupt changes
          const progress = audioTime / duration;
          const speechIntensity = 0.6 + 0.4 * Math.sin(progress * Math.PI * 8 + Math.sin(audioTime * 3) * 0.3);
          
          // Create multiple wave layers for richness
          for (let i = 0; i < bufferLength; i++) {
            const sampleIndex = i / bufferLength;
            const timeOffset = sampleIndex * 0.01;
            
            // Primary speech wave (smooth, continuous)
            const primary = Math.sin(2 * Math.PI * 180 * (audioTime + timeOffset) + Math.sin(audioTime * 2) * 0.5);
            
            // Secondary harmonics for depth
            const harmonic1 = Math.sin(2 * Math.PI * 360 * (audioTime + timeOffset)) * 0.4;
            const harmonic2 = Math.sin(2 * Math.PI * 540 * (audioTime + timeOffset)) * 0.25;
            
            // Subtle formant-like resonances
            const formant = Math.sin(2 * Math.PI * 1200 * (audioTime + timeOffset) + Math.sin(audioTime * 1.5) * 0.3) * 0.15;
            
            // Breathing rhythm (very smooth, no jarring cuts)
            const breathingPattern = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.4 * audioTime);
            
            // Natural speech modulation (smooth transitions)
            const voiceModulation = Math.sin(2 * Math.PI * 0.8 * audioTime + Math.cos(audioTime * 0.6) * 0.4);
            
            // Combine all elements smoothly
            const combined = (primary + harmonic1 + harmonic2 + formant) * speechIntensity * breathingPattern;
            
            // Apply gentle voice modulation
            timeData[i] = combined * (0.8 + voiceModulation * 0.2) * 0.25;
          }
          
          // Smooth transitions between frames
          const currentAmplitude = Math.abs(timeData[0]);
          if (Math.abs(currentAmplitude - lastAmplitude) > 0.1) {
            const blend = 0.85; // Smooth blending
            for (let i = 0; i < bufferLength; i++) {
              timeData[i] = timeData[i] * (1 - blend) + (timeData[i] > 0 ? lastAmplitude : -lastAmplitude) * blend;
            }
          }
          lastAmplitude = currentAmplitude;
          
          setAudioData(timeData);
        };

        // Set up interval for regular updates
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        intervalRef.current = setInterval(generateCaptivatingAudioData, 16); // ~60fps
        
        // Clean up when audio ends
        const handleEnded = () => {
          setAudioData(null);
          setIsConnected(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
          }
        };

        currentAudio.addEventListener('ended', handleEnded);
        currentAudio.addEventListener('pause', () => setAudioData(null));
        currentAudio.addEventListener('play', generateCaptivatingAudioData);
        
        console.log('Connected to TTS audio for visualization sync');
        
      } else if (!currentAudio && currentAudioRef.current) {
        // Audio was removed
        currentAudioRef.current = null;
        setIsConnected(false);
        setAudioData(null);
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
      }
    };

    // Monitor for audio changes
    const monitorInterval = setInterval(monitorAudio, 100);
    
    return () => {
      clearInterval(monitorInterval);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsConnected(false);
      setAudioData(null);
    };
  }, []);

  return {
    audioData,
    isConnected
  };
};