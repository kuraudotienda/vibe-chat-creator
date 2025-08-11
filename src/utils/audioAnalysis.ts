import { AudioAnalysis } from '../types/visualizer';

// Shared audio analysis utility for both visualizers
export const analyzeAudio = (data: Float32Array): AudioAnalysis => {
  if (!data || data.length === 0) return { volume: 0, frequencies: [], isSpeaking: false };

  // Calculate RMS volume with improved normalization for TTS audio
  let sum = 0;
  let peak = 0;
  let zeroCrossings = 0;
  
  for (let i = 0; i < data.length; i++) {
    const sample = data[i];
    sum += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
    
    // Count zero crossings for voice activity detection
    if (i > 0 && ((data[i-1] >= 0) !== (sample >= 0))) {
      zeroCrossings++;
    }
  }
  
  const rmsVolume = Math.sqrt(sum / data.length);
  const normalizedRMS = Math.min(1, rmsVolume * 50); // Better scaling for TTS
  const normalizedPeak = Math.min(1, peak * 30);
  
  // Combine RMS, peak, and zero-crossing rate for better voice detection
  const zcr = zeroCrossings / data.length;
  const voiceActivity = (normalizedRMS * 0.6 + normalizedPeak * 0.3 + Math.min(zcr * 10, 0.3) * 0.1);
  
  // Adaptive silence threshold based on recent activity
  const adaptiveThreshold = Math.max(0.005, Math.min(0.02, voiceActivity * 0.1));
  const isSpeaking = voiceActivity > adaptiveThreshold;
  const actualVolume = isSpeaking ? voiceActivity : 0;

  // Extract frequency bands focused on human voice range (80Hz - 8kHz)
  const voiceBands = 10; // More bands for better resolution
  const frequencies = [];
  const bandSize = Math.floor(data.length / voiceBands);
  
  for (let band = 0; band < voiceBands; band++) {
    let bandSum = 0;
    let bandPeak = 0;
    const start = band * bandSize;
    const end = Math.min((band + 1) * bandSize, data.length);
    
    for (let i = start; i < end; i++) {
      const sample = Math.abs(data[i]);
      bandSum += sample;
      bandPeak = Math.max(bandPeak, sample);
    }
    
    const bandRMS = bandSum / (end - start);
    const bandValue = (bandRMS * 0.7 + bandPeak * 0.3) * 20; // Scale for visibility
    frequencies.push(isSpeaking ? Math.min(1, bandValue) : 0);
  }

  return { 
    volume: actualVolume, 
    frequencies, 
    isSpeaking,
    zeroCrossingRate: zcr,
    peakLevel: normalizedPeak
  };
};

// Generate procedural wave data for idle/speaking states
export const generateProceduralWave = (time: number, state: string): AudioAnalysis => {
  if (state === 'speaking') {
    // Active speaking pattern
    const baseFrequency = 8;
    const baseAmplitude = 0.6;
    
    const frequencies = [];
    for (let i = 0; i < 10; i++) {
      const freq = baseFrequency * (1 + Math.sin(time * (i + 1) * 0.4) * 0.2);
      frequencies.push(baseAmplitude * (0.6 + Math.sin(time * freq) * 0.4));
    }

    return {
      volume: baseAmplitude * (0.8 + Math.sin(time * baseFrequency) * 0.2),
      frequencies,
      isSpeaking: true
    };
  } else {
    // Gentle idle breathing animation
    const idleAmplitude = 0.08;
    const breathingFreq = 0.3;
    
    const frequencies = [];
    for (let i = 0; i < 10; i++) {
      const gentle = idleAmplitude * (0.5 + Math.sin(time * breathingFreq + i * 0.2) * 0.3);
      frequencies.push(gentle);
    }

    return {
      volume: idleAmplitude * (0.6 + Math.sin(time * breathingFreq) * 0.4),
      frequencies,
      isSpeaking: false
    };
  }
};