import { useRef, useEffect, useState } from 'react';

interface AudioAnalysisData {
  frequencyData: Float32Array;
  timeData: Float32Array;
  volume: number;
  pitch: number;
  harmonics: number[];
}

export const useAudioContext = (audioElement?: HTMLAudioElement) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [audioData, setAudioData] = useState<AudioAnalysisData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupAudioContext = async () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        
        // Create analyzer with high resolution
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 2048; // Higher resolution for better frequency analysis
        analyzerRef.current.smoothingTimeConstant = 0.3; // Less smoothing for more responsive visualization
        
        if (audioElement) {
          // Connect audio element to analyzer
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
          sourceRef.current.connect(analyzerRef.current);
          analyzerRef.current.connect(audioContextRef.current.destination);
          setIsConnected(true);
        }
      } catch (error) {
        console.warn('Audio context setup failed:', error);
      }
    };

    setupAudioContext();

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [audioElement]);

  const analyzeAudio = () => {
    if (!analyzerRef.current) return null;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const frequencyData = new Float32Array(bufferLength);
    const timeData = new Float32Array(bufferLength);
    
    analyzerRef.current.getFloatFrequencyData(frequencyData);
    analyzerRef.current.getFloatTimeDomainData(timeData);

    // Calculate RMS volume
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      sum += timeData[i] * timeData[i];
    }
    const volume = Math.sqrt(sum / timeData.length);

    // Detect pitch using autocorrelation
    const pitch = detectPitch(timeData, audioContextRef.current?.sampleRate || 44100);

    // Extract harmonic content
    const harmonics = extractHarmonics(frequencyData, pitch);

    const analysisData: AudioAnalysisData = {
      frequencyData,
      timeData,
      volume,
      pitch,
      harmonics
    };

    setAudioData(analysisData);
    return analysisData;
  };

  // Pitch detection using autocorrelation
  const detectPitch = (buffer: Float32Array, sampleRate: number): number => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;

    // Calculate RMS
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // Not enough signal
    if (rms < 0.01) return -1;

    // Autocorrelation
    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;

      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - (correlation / MAX_SAMPLES);

      if (correlation > bestCorrelation && correlation > lastCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
      lastCorrelation = correlation;
    }

    if (bestCorrelation > 0.01 && bestOffset > 0) {
      return sampleRate / bestOffset;
    }
    return -1;
  };

  // Extract harmonic content for richer visualization
  const extractHarmonics = (frequencyData: Float32Array, fundamentalFreq: number): number[] => {
    if (fundamentalFreq <= 0) return [];

    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / frequencyData.length;
    
    const harmonics: number[] = [];
    
    // Extract up to 8 harmonics
    for (let harmonic = 1; harmonic <= 8; harmonic++) {
      const harmonicFreq = fundamentalFreq * harmonic;
      if (harmonicFreq > nyquist) break;
      
      const bin = Math.round(harmonicFreq / binWidth);
      if (bin < frequencyData.length) {
        // Convert from dB to linear scale (0-1)
        const amplitude = Math.max(0, (frequencyData[bin] + 100) / 100);
        harmonics.push(amplitude);
      }
    }
    
    return harmonics;
  };

  // Get audio data for current frame
  const getCurrentAudioData = () => {
    return analyzeAudio();
  };

  return {
    audioData,
    isConnected,
    getCurrentAudioData,
    analyzeAudio
  };
};