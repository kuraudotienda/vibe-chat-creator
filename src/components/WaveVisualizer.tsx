import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, useAnimationFrame, useSpring } from 'framer-motion';
import { scaleLinear, scalePow } from 'd3-scale';
import { interpolateRgb, interpolateHsl } from 'd3-interpolate';
import { PersonalityMode } from '../types';

interface WaveVisualizerProps {
  personality: PersonalityMode;
  isListening: boolean;
  isSpeaking: boolean;
  isSynthesizing: boolean;
  audioData?: Float32Array;
  width?: number;
  height?: number;
}

interface WavePoint {
  x: number;
  y: number;
  amplitude: number;
  frequency: number;
  phase: number;
  targetAmplitude: number;
  velocity: number;
  harmonics: number[];
}

interface ParticleSystem {
  particles: Particle[];
  lastEmitTime: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  opacity: number;
}

export const WaveVisualizer: React.FC<WaveVisualizerProps> = ({
  personality,
  isListening,
  isSpeaking,
  isSynthesizing,
  audioData,
  width = 320,
  height = 320
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationTimeRef = useRef(0);
  const wavePointsRef = useRef<WavePoint[]>([]);
  const particleSystemRef = useRef<ParticleSystem>({ particles: [], lastEmitTime: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentEnergy, setCurrentEnergy] = useState(0);
  
  // Smooth energy transition with spring physics
  const energySpring = useSpring(0, { 
    stiffness: 300, 
    damping: 20,
    mass: 1
  });

  // Enhanced personality-based color schemes with gradients
  const getPersonalityColors = useCallback(() => {
    const schemes = {
      default: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#60A5FA',
        glow: '#DBEAFE',
        gradient: ['#3B82F6', '#60A5FA', '#93C5FD'],
        particle: '#BFDBFE'
      },
      roast: {
        primary: '#EF4444',
        secondary: '#DC2626',
        accent: '#F87171',
        glow: '#FEE2E2',
        gradient: ['#DC2626', '#EF4444', '#FCA5A5'],
        particle: '#FECACA'
      },
      hype: {
        primary: '#EC4899',
        secondary: '#BE185D',
        accent: '#F472B6',
        glow: '#FCE7F3',
        gradient: ['#BE185D', '#EC4899', '#F9A8D4'],
        particle: '#FBCFE8'
      },
      conspiracy: {
        primary: '#8B5CF6',
        secondary: '#7C3AED',
        accent: '#A78BFA',
        glow: '#EDE9FE',
        gradient: ['#7C3AED', '#8B5CF6', '#C4B5FD'],
        particle: '#DDD6FE'
      },
      motivational: {
        primary: '#F59E0B',
        secondary: '#D97706',
        accent: '#FBBF24',
        glow: '#FEF3C7',
        gradient: ['#D97706', '#F59E0B', '#FCD34D'],
        particle: '#FDE68A'
      },
      sleepy: {
        primary: '#6B7280',
        secondary: '#4B5563',
        accent: '#9CA3AF',
        glow: '#F3F4F6',
        gradient: ['#4B5563', '#6B7280', '#D1D5DB'],
        particle: '#E5E7EB'
      }
    };
    return schemes[personality] || schemes.default;
  }, [personality]);

  // Initialize enhanced wave points
  useEffect(() => {
    const numPoints = 120; // More points for smoother curves
    const points: WavePoint[] = [];
    
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * width;
      points.push({
        x,
        y: height / 2,
        amplitude: 0,
        frequency: 0.015 + Math.random() * 0.025,
        phase: Math.random() * Math.PI * 2,
        targetAmplitude: 0,
        velocity: 0,
        harmonics: [0, 0, 0, 0, 0] // Track multiple frequency bands
      });
    }
    
    wavePointsRef.current = points;
    setIsInitialized(true);
  }, [width, height]);

  // Particle system management
  const updateParticles = useCallback((ctx: CanvasRenderingContext2D, time: number, energy: number, colors: any) => {
    const particles = particleSystemRef.current.particles;
    
    // Emit new particles based on energy
    if (energy > 0.3 && time - particleSystemRef.current.lastEmitTime > 50) {
      const numNewParticles = Math.floor(energy * 3);
      
      for (let i = 0; i < numNewParticles; i++) {
        const centerY = height / 2;
        const spread = energy * 100;
        
        particles.push({
          x: Math.random() * width,
          y: centerY + (Math.random() - 0.5) * spread,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 0,
          maxLife: 60 + Math.random() * 40,
          size: 1 + Math.random() * 3,
          color: colors.particle,
          opacity: 0.8
        });
      }
      
      particleSystemRef.current.lastEmitTime = time;
    }
    
    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      // Update physics
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life++;
      particle.opacity = (1 - particle.life / particle.maxLife) * 0.8;
      
      // Remove dead particles
      if (particle.life >= particle.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      
      // Draw particle
      ctx.globalAlpha = particle.opacity;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  }, [width, height]);

  // Enhanced audio analysis for precise lip-sync detection
  const analyzeAudio = (data: Float32Array) => {
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

  // Generate smooth wave data with gentle idle animation
  const generateProceduralWave = (time: number, state: string) => {
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
        frequencies
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
        frequencies
      };
    }
  };

  // Animation loop
  useAnimationFrame((time) => {
    if (!isInitialized || !canvasRef.current) return;
    
    animationTimeRef.current = time * 0.001; // Convert to seconds
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get current state
    const currentState = isSpeaking ? 'speaking' : isListening ? 'listening' : isSynthesizing ? 'synthesizing' : 'idle';
    
    // Analyze audio or generate procedural data
    let waveData;
    if (audioData && audioData.length > 0) {
      waveData = analyzeAudio(audioData);
    } else {
      waveData = generateProceduralWave(animationTimeRef.current, currentState);
    }

    // Update energy smoothing
    const targetEnergy = waveData.volume;
    energySpring.set(targetEnergy);
    const smoothEnergy = energySpring.get();
    setCurrentEnergy(smoothEnergy);

    // Update wave points with enhanced physics
    const points = wavePointsRef.current;
    const colors = getPersonalityColors();
    
    points.forEach((point, i) => {
      const normalizedX = i / (points.length - 1);
      const frequencyBand = Math.floor(normalizedX * waveData.frequencies.length);
      const bandValue = waveData.frequencies[frequencyBand] || 0;
      
      // Store harmonic data
      point.harmonics = waveData.frequencies.slice(
        Math.max(0, frequencyBand - 2), 
        Math.min(waveData.frequencies.length, frequencyBand + 3)
      );
      
      // Calculate target amplitude - REDUCED for user preference
      let targetAmp = bandValue * height * 0.08; // Reduced from 0.2 to 0.08
      
      // Add harmonic richness - also reduced
      const harmonicSum = point.harmonics.reduce((sum, val) => sum + val, 0);
      targetAmp += harmonicSum * height * 0.02; // Reduced from 0.05 to 0.02
      
        // Only apply modulation when actually speaking
      const personalityModifier = personality === 'hype' ? 1.8 : 
                                 personality === 'roast' ? 1.4 :
                                 personality === 'sleepy' ? 0.6 : 1.0;
      
      // ONLY animate when speaking and there's actual audio - with reduced amplitude
      if (currentState === 'speaking' && smoothEnergy > 0.005) {
        const speechPattern = Math.sin(animationTimeRef.current * 15 + i * 0.2) * 
                             Math.cos(animationTimeRef.current * 8 + i * 0.12);
        targetAmp *= (1.2 + speechPattern * 0.4) * personalityModifier; // Reduced multipliers
      } else {
        // Smooth decay to silence instead of instant cut
        targetAmp *= 0.92; // Gradual fade
      }
      
      // Physics-based amplitude updating with improved responsiveness
      const dampingFactor = smoothEnergy > 0.005 ? 0.88 : 0.96; // Better damping curve
      const force = (targetAmp - point.amplitude) * (smoothEnergy > 0.005 ? 0.25 : 0.4); // More responsive
      
      point.velocity += force;
      point.velocity *= dampingFactor;
      point.amplitude += point.velocity;
      
      // Only update phase when there's audio - more sensitive threshold
      if (smoothEnergy > 0.005) {
        point.phase += point.frequency * (1 + smoothEnergy * 1.5);
      }
      
      // Wave calculation - more sensitive to subtle changes
      if (point.amplitude > 0.0005) {
        const primaryWave = Math.sin(point.phase) * point.amplitude;
        const harmonicWave = Math.sin(point.phase * 2.1 + animationTimeRef.current * 2.5) * point.amplitude * 0.25;
        const detailWave = Math.sin(point.phase * 0.8 + animationTimeRef.current * 1.8) * point.amplitude * 0.15;
        const noiseWave = (Math.random() - 0.5) * point.amplitude * 0.05 * smoothEnergy;
        
        point.y = height / 2 + primaryWave + harmonicWave + detailWave + noiseWave;
      } else {
        // Smooth transition to center line
        point.y = point.y * 0.95 + (height / 2) * 0.05;
      }
    });

    // Enhanced background effects
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Smooth animated background glow
    if (smoothEnergy > 0.03 && isSpeaking) {
      const pulseIntensity = Math.sin(animationTimeRef.current * 4) * 0.3 + 0.7;
      const glowSize = (smoothEnergy * 0.8 + 0.2) * width * 0.8 * pulseIntensity;
      
      const backgroundGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, glowSize
      );
      
      backgroundGradient.addColorStop(0, `${colors.glow}${Math.floor(smoothEnergy * 30).toString(16).padStart(2, '0')}`);
      backgroundGradient.addColorStop(0.5, `${colors.accent}${Math.floor(smoothEnergy * 15).toString(16).padStart(2, '0')}`);
      backgroundGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw wave layers with advanced effects
    const layers = [
      { 
        colors: [colors.gradient[0], colors.gradient[1]], 
        width: 4, 
        opacity: 0.9, 
        offset: 0,
        blur: 0
      },
      { 
        colors: [colors.gradient[1], colors.gradient[2]], 
        width: 2, 
        opacity: 0.6, 
        offset: 8,
        blur: 2
      },
      { 
        colors: [colors.accent, colors.primary], 
        width: 6, 
        opacity: 0.4, 
        offset: -12,
        blur: 4
      }
    ];

    // Always draw wave layers, vary intensity for smooth visuals
    const drawIntensity = Math.max(0.1, smoothEnergy); // Never completely disappear
    
    layers.forEach((layer, layerIndex) => {
        // Create gradient along the wave
        const waveGradient = ctx.createLinearGradient(0, 0, width, 0);
        waveGradient.addColorStop(0, layer.colors[0]);
        waveGradient.addColorStop(0.5, layer.colors[1]);
        waveGradient.addColorStop(1, layer.colors[0]);
        
        ctx.beginPath();
        ctx.strokeStyle = waveGradient;
        ctx.lineWidth = layer.width * Math.max(0.6, (1 + drawIntensity * 0.4)); // Proportional to intensity
        ctx.globalAlpha = layer.opacity * (0.3 + drawIntensity * 0.7);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Add shadow/glow effect
        if (layer.blur > 0) {
          ctx.shadowColor = layer.colors[1];
          ctx.shadowBlur = layer.blur * (1 + smoothEnergy);
        }

      // Create flowing curve with catmull-rom spline approximation
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const timeOffset = Math.sin(animationTimeRef.current * 1.2 + i * 0.06) * layer.offset * (1 + drawIntensity * 0.5);
        const yPos = point.y + timeOffset;
        
        if (i === 0) {
          ctx.moveTo(point.x, yPos);
        } else if (i === 1) {
          const midX = (points[0].x + point.x) / 2;
          const midY = (points[0].y + timeOffset + yPos) / 2;
          ctx.quadraticCurveTo(points[0].x, points[0].y + timeOffset, midX, midY);
        } else {
          const prev1 = points[i - 1];
          const prev2 = points[i - 2];
          
          // Catmull-rom spline control points
          const cp1x = prev1.x + (point.x - prev2.x) / 6;
          const cp1y = prev1.y + Math.sin(animationTimeRef.current * 1.5 + (i-1) * 0.08) * layer.offset * (1 + smoothEnergy) + (yPos - (prev2.y + Math.sin(animationTimeRef.current * 1.5 + (i-2) * 0.08) * layer.offset * (1 + smoothEnergy))) / 6;
          
          const cp2x = point.x - (points[Math.min(i + 1, points.length - 1)].x - prev1.x) / 6;
          const cp2y = yPos - (points[Math.min(i + 1, points.length - 1)].y - prev1.y + Math.sin(animationTimeRef.current * 1.5 + Math.min(i + 1, points.length - 1) * 0.08) * layer.offset * (1 + smoothEnergy) - Math.sin(animationTimeRef.current * 1.5 + (i-1) * 0.08) * layer.offset * (1 + smoothEnergy)) / 6;
          
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, point.x, yPos);
        }
      }
      
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
      });

    // Update particle system - only when speaking
    if (isSpeaking) {
      updateParticles(ctx, animationTimeRef.current * 1000, smoothEnergy, colors);
    }

    // Smooth energy burst effects
    if (smoothEnergy > 0.5 && isSpeaking) {
      const burstIntensity = (smoothEnergy - 0.7) * 3.33; // 0 to 1 range
      
      // Radial energy lines
      ctx.globalAlpha = burstIntensity * 0.6;
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + animationTimeRef.current * 2;
        const innerRadius = 20 + Math.sin(animationTimeRef.current * 8 + i) * 10;
        const outerRadius = innerRadius + burstIntensity * 60;
        
        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(angle) * innerRadius,
          centerY + Math.sin(angle) * innerRadius
        );
        ctx.lineTo(
          centerX + Math.cos(angle) * outerRadius,
          centerY + Math.sin(angle) * outerRadius
        );
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
  });

  return (
    <div className="relative flex flex-col items-center">
      {/* Wave Canvas */}
      <div className="relative w-80 h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute inset-0"
        />
        
        {/* Overlay effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
        
        {/* Status indicators */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <motion.div
            className={`w-3 h-3 rounded-full`}
            animate={{
              backgroundColor: isSpeaking 
                ? '#EF4444' 
                : isListening 
                ? '#22C55E' 
                : isSynthesizing 
                ? '#F59E0B'
                : '#6B7280',
              scale: isSpeaking || isListening ? [1, 1.3, 1] : 1,
              boxShadow: isSpeaking 
                ? '0 0 20px #EF444440' 
                : isListening 
                ? '0 0 20px #22C55E40'
                : isSynthesizing
                ? '0 0 15px #F59E0B40'
                : '0 0 0px transparent'
            }}
            transition={{ duration: 0.6, repeat: isSpeaking || isListening || isSynthesizing ? Infinity : 0 }}
          />
          <motion.span 
            className="text-sm text-white font-medium bg-black/50 px-2 py-1 rounded-lg backdrop-blur"
            animate={{
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {isSpeaking
              ? 'Speaking...'
              : isListening
              ? 'Listening...'
              : isSynthesizing
              ? 'Thinking...'
              : 'Ready'}
          </motion.span>
        </div>

      </div>

    </div>
  );

  function getPersonalityEmoji() {
    const emojis = {
      default: '🤖',
      roast: '🔥',
      hype: '🚀',
      conspiracy: '👁️',
      motivational: '💪',
      sleepy: '😴'
    };
    return emojis[personality] || emojis.default;
  }
};