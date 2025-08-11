import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { motion, useAnimationFrame, useSpring } from 'framer-motion';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { AvatarCreator, AvatarCreatorConfig, AvatarExportedEvent } from '@readyplayerme/react-avatar-creator';
import { BaseVisualizerProps } from '../types/visualizer';
import { analyzeAudio, generateProceduralWave } from '../utils/audioAnalysis';
import { PersonalityMode } from '../types';
import * as THREE from 'three';

interface Avatar3DWorkingProps extends BaseVisualizerProps {}

// OVR LipSync compatible visemes for Ready Player Me avatars
const OVR_VISEMES = {
  sil: 'viseme_sil',    // Silence
  PP: 'viseme_PP',      // P, B, M sounds - lips closed
  FF: 'viseme_FF',      // F, V sounds - lip to teeth  
  TH: 'viseme_TH',      // TH sounds - tongue between teeth
  DD: 'viseme_DD',      // T, D sounds - tongue to roof
  kk: 'viseme_kk',      // K, G sounds - back of tongue
  CH: 'viseme_CH',      // CH, J, SH sounds
  SS: 'viseme_SS',      // S, Z sounds
  nn: 'viseme_nn',      // N, L sounds
  RR: 'viseme_RR',      // R sounds  
  aa: 'viseme_aa',      // A sounds - mouth wide open
  E: 'viseme_E',        // E sounds - medium open
  I: 'viseme_I',        // I sounds - small opening
  O: 'viseme_O',        // O sounds - rounded
  U: 'viseme_U'         // U sounds - pursed lips
};

// ARKit morph targets for Ready Player Me avatars
const ARKIT_MORPHS = {
  // Jaw controls
  jawOpen: 'jawOpen',
  jawForward: 'jawForward', 
  jawLeft: 'jawLeft',
  jawRight: 'jawRight',
  
  // Mouth controls
  mouthOpen: 'mouthOpen',
  mouthClose: 'mouthClose',
  mouthFunnel: 'mouthFunnel',
  mouthPucker: 'mouthPucker',
  mouthLeft: 'mouthLeft',
  mouthRight: 'mouthRight',
  
  // Lip controls  
  mouthRollLower: 'mouthRollLower',
  mouthRollUpper: 'mouthRollUpper',
  mouthShrugLower: 'mouthShrugLower',
  mouthShrugUpper: 'mouthShrugUpper',
  mouthPressLeft: 'mouthPressLeft',
  mouthPressRight: 'mouthPressRight',
  mouthLowerDownLeft: 'mouthLowerDownLeft',
  mouthLowerDownRight: 'mouthLowerDownRight',
  mouthUpperUpLeft: 'mouthUpperUpLeft',
  mouthUpperUpRight: 'mouthUpperUpRight',
  
  // Additional
  tongueOut: 'tongueOut'
};

// Advanced audio-to-viseme conversion based on frequency analysis  
const getVisemeFromAudio = (audioData: Float32Array, currentEnergy: number, time: number): string => {
  if (!audioData || audioData.length === 0 || currentEnergy < 0.05) {
    return 'sil'; // Silence
  }
  
  // Perform FFT-like analysis on audio data
  const fftSize = Math.min(512, audioData.length);
  const freqBands = 16;
  const bandSize = Math.floor(fftSize / freqBands);
  const frequencies: number[] = [];
  
  // Calculate frequency band energies
  for (let i = 0; i < freqBands; i++) {
    let bandEnergy = 0;
    const start = i * bandSize;
    const end = Math.min((i + 1) * bandSize, fftSize);
    
    for (let j = start; j < end; j++) {
      bandEnergy += Math.abs(audioData[j]);
    }
    frequencies[i] = bandEnergy / (end - start);
  }
  
  // Analyze spectral characteristics for viseme detection
  const lowFreqEnergy = frequencies.slice(0, 4).reduce((sum, val) => sum + val, 0);
  const midFreqEnergy = frequencies.slice(4, 10).reduce((sum, val) => sum + val, 0);
  const highFreqEnergy = frequencies.slice(10, 16).reduce((sum, val) => sum + val, 0);
  
  const totalEnergy = lowFreqEnergy + midFreqEnergy + highFreqEnergy;
  
  if (totalEnergy === 0) return 'sil';
  
  // Normalize energy distributions
  const lowRatio = lowFreqEnergy / totalEnergy;
  const midRatio = midFreqEnergy / totalEnergy;
  const highRatio = highFreqEnergy / totalEnergy;
  
  // Spectral centroid for fricative detection
  const spectralCentroid = frequencies.reduce((sum, val, i) => sum + val * i, 0) / totalEnergy;
  
  // Zero crossing rate approximation
  let zeroCrossings = 0;
  for (let i = 1; i < Math.min(audioData.length, 256); i++) {
    if ((audioData[i-1] >= 0) !== (audioData[i] >= 0)) {
      zeroCrossings++;
    }
  }
  const zcr = zeroCrossings / Math.min(audioData.length, 256);
  
  // Add temporal variation for more realistic lip movement
  const timeVariation = Math.sin(time * 12) * 0.1 + Math.cos(time * 8) * 0.1;
  
  // Enhanced viseme classification based on acoustic features
  
  // High ZCR + High spectral centroid = fricatives (SS, FF, TH)
  if (zcr > 0.1 && spectralCentroid > 8) {
    if (highRatio > 0.6) return 'SS'; // S, Z sounds
    if (midRatio > 0.5) return 'FF';  // F, V sounds  
    return 'TH'; // TH sounds
  }
  
  // Low energy, closed articulation = stops (PP, DD, kk)
  if (currentEnergy < 0.3) {
    if (lowRatio > 0.7) return 'PP'; // P, B, M sounds
    if (midRatio > 0.5) return 'DD'; // T, D sounds
    return 'kk'; // K, G sounds
  }
  
  // Mid-high energy with specific spectral patterns
  if (currentEnergy > 0.3 && spectralCentroid > 6) {
    return 'CH'; // CH, J, SH sounds
  }
  
  // Nasal sounds - balanced spectrum with mid emphasis
  if (midRatio > 0.4 && lowRatio > 0.3) {
    return 'nn'; // N, L sounds
  }
  
  // Liquid sounds
  if (lowRatio > 0.5 && midRatio > 0.3) {
    return 'RR'; // R sounds
  }
  
  // Vowel classification based on formant-like analysis
  const vowelIntensity = currentEnergy + timeVariation;
  
  if (vowelIntensity > 0.7) {
    // Open vowels
    if (midRatio > highRatio) return 'aa'; // A sounds - wide open
    return 'O'; // O sounds - rounded
  } else if (vowelIntensity > 0.4) {
    // Mid vowels  
    if (highRatio > 0.3) return 'E'; // E sounds - medium open
    return 'U'; // U sounds - pursed
  } else {
    // Close vowels
    return 'I'; // I sounds - small opening
  }
};

// Helper function to apply morph target values safely
const applyMorphTarget = (mesh: THREE.SkinnedMesh, targetName: string, value: number) => {
  if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;
  
  const index = mesh.morphTargetDictionary[targetName];
  if (index !== undefined && mesh.morphTargetInfluences[index] !== undefined) {
    mesh.morphTargetInfluences[index] = Math.max(0, Math.min(1, value));
  }
};

// 3D Avatar Model Component with Lip Sync
const AvatarModel: React.FC<{ 
  url: string; 
  currentEnergy: number; 
  isSpeaking: boolean;
  audioData?: Float32Array;
}> = ({ url, currentEnergy, isSpeaking, audioData }) => {
  const meshRef = useRef<THREE.Group>(null);
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const mouthRef = useRef<THREE.SkinnedMesh | null>(null);
  const [currentViseme, setCurrentViseme] = useState<string>('sil');
  const [visemeHistory, setVisemeHistory] = useState<{viseme: string, time: number, weight: number}[]>([]);
  
  // Load the GLTF model
  const gltf = useLoader(GLTFLoader, url);
  
  // Setup animations and find mouth mesh
  useEffect(() => {
    if (gltf.animations.length > 0 && gltf.scene) {
      mixer.current = new THREE.AnimationMixer(gltf.scene);
      
      // Play the first available animation (usually idle)
      const action = mixer.current.clipAction(gltf.animations[0]);
      action.play();
    }
    
    // Find the mesh with morph targets (usually the head/face mesh)
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        mouthRef.current = child;
        console.log('Found morph targets:', Object.keys(child.morphTargetDictionary));
      }
    });
    
    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
      }
    };
  }, [gltf]);
  
  // Update animations and lip sync based on audio
  useFrame((state, delta) => {
    if (mixer.current) {
      // Adjust animation speed based on speaking energy
      const speed = isSpeaking && currentEnergy > 0.1 
        ? Math.max(0.5, currentEnergy * 3) 
        : 1;
      mixer.current.timeScale = speed;
      mixer.current.update(delta);
    }
    
    // Real-time lip sync with proper viseme mapping
    if (mouthRef.current && audioData && isSpeaking) {
      const targetViseme = getVisemeFromAudio(audioData, currentEnergy, state.clock.elapsedTime);
      
      // Update viseme with temporal smoothing
      if (targetViseme !== currentViseme) {
        setCurrentViseme(targetViseme);
        
        // Add to history for smoother transitions
        setVisemeHistory(prev => {
          const newHistory = [...prev, { 
            viseme: targetViseme, 
            time: state.clock.elapsedTime, 
            weight: currentEnergy 
          }];
          // Keep only recent history (last 10 frames)
          return newHistory.slice(-10);
        });
      }
      
      // Apply lip sync to morph targets
      const mesh = mouthRef.current;
      if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
        
        // Reset all facial morph targets first
        Object.keys(mesh.morphTargetDictionary).forEach(key => {
          const index = mesh.morphTargetDictionary![key];
          if (mesh.morphTargetInfluences && index !== undefined) {
            mesh.morphTargetInfluences[index] = 0;
          }
        });
        
        // Apply current viseme with proper morph target mapping
        const visemeIntensity = Math.min(1, currentEnergy * 1.5);
        
        // Map visemes to specific ARKit/OVR morph targets
        switch (currentViseme) {
          case 'sil':
            // Neutral/closed mouth
            applyMorphTarget(mesh, 'mouthClose', 0.3 * visemeIntensity);
            break;
            
          case 'PP':
            // Closed lips for P, B, M
            applyMorphTarget(mesh, 'mouthClose', 1.0 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthPressLeft', 0.5 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthPressRight', 0.5 * visemeIntensity);
            break;
            
          case 'FF':
            // Lip to teeth for F, V
            applyMorphTarget(mesh, 'mouthRollLower', 0.8 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthShrugUpper', 0.6 * visemeIntensity);
            break;
            
          case 'TH':
            // Tongue between teeth
            applyMorphTarget(mesh, 'tongueOut', 0.4 * visemeIntensity);
            applyMorphTarget(mesh, 'jawOpen', 0.3 * visemeIntensity);
            break;
            
          case 'DD':
            // Tongue to roof T, D
            applyMorphTarget(mesh, 'jawOpen', 0.4 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthOpen', 0.3 * visemeIntensity);
            break;
            
          case 'kk':
            // Back of tongue K, G
            applyMorphTarget(mesh, 'jawOpen', 0.5 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthClose', 0.2 * visemeIntensity);
            break;
            
          case 'CH':
            // CH, J, SH sounds
            applyMorphTarget(mesh, 'mouthFunnel', 0.6 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthPucker', 0.4 * visemeIntensity);
            break;
            
          case 'SS':
            // S, Z sounds - narrow opening
            applyMorphTarget(mesh, 'mouthClose', 0.7 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthFunnel', 0.3 * visemeIntensity);
            break;
            
          case 'nn':
            // N, L sounds
            applyMorphTarget(mesh, 'mouthClose', 0.5 * visemeIntensity);
            applyMorphTarget(mesh, 'jawOpen', 0.3 * visemeIntensity);
            break;
            
          case 'RR':
            // R sounds
            applyMorphTarget(mesh, 'mouthFunnel', 0.5 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthRollUpper', 0.3 * visemeIntensity);
            break;
            
          case 'aa':
            // Wide open A sounds
            applyMorphTarget(mesh, 'jawOpen', 1.0 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthOpen', 0.8 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthLowerDownLeft', 0.4 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthLowerDownRight', 0.4 * visemeIntensity);
            break;
            
          case 'E':
            // E sounds - medium open
            applyMorphTarget(mesh, 'jawOpen', 0.6 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthOpen', 0.5 * visemeIntensity);
            break;
            
          case 'I':
            // I sounds - small opening
            applyMorphTarget(mesh, 'jawOpen', 0.3 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthClose', 0.2 * visemeIntensity);
            break;
            
          case 'O':
            // O sounds - rounded
            applyMorphTarget(mesh, 'jawOpen', 0.7 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthFunnel', 0.8 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthPucker', 0.6 * visemeIntensity);
            break;
            
          case 'U':
            // U sounds - pursed lips
            applyMorphTarget(mesh, 'mouthPucker', 1.0 * visemeIntensity);
            applyMorphTarget(mesh, 'mouthFunnel', 0.7 * visemeIntensity);
            break;
        }
        
        // Add subtle natural variations
        const naturalVariation = Math.sin(state.clock.elapsedTime * 15) * 0.1 * visemeIntensity;
        applyMorphTarget(mesh, 'jawLeft', naturalVariation * 0.1);
        applyMorphTarget(mesh, 'jawRight', -naturalVariation * 0.1);
      }
    } else if (mouthRef.current && !isSpeaking) {
      // Return to neutral state when not speaking
      const mesh = mouthRef.current;
      if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
        Object.keys(mesh.morphTargetDictionary).forEach(key => {
          const index = mesh.morphTargetDictionary![key];
          if (mesh.morphTargetInfluences && index !== undefined) {
            // Smooth return to neutral
            mesh.morphTargetInfluences[index] *= 0.95;
          }
        });
        setCurrentViseme('sil');
      }
    }
    
    // Add subtle breathing animation when idle
    if (meshRef.current && !isSpeaking) {
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
      meshRef.current.scale.setScalar(breathingScale);
    }
    
    // Add slight head movement when speaking
    if (meshRef.current && isSpeaking && currentEnergy > 0.1) {
      const headMovement = Math.sin(state.clock.elapsedTime * 8) * currentEnergy * 0.1;
      meshRef.current.rotation.y = headMovement;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 6) * currentEnergy * 0.05;
    }
  });
  
  return (
    <group ref={meshRef}>
      <primitive 
        object={gltf.scene} 
        scale={[4, 4, 4]} 
        position={[0, -6.8, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
};

// 3D Scene Component
const AvatarScene: React.FC<{ 
  avatarUrl: string; 
  currentEnergy: number; 
  isSpeaking: boolean;
  personality: PersonalityMode;
  audioData?: Float32Array;
}> = ({ avatarUrl, currentEnergy, isSpeaking, personality, audioData }) => {
  
  // Personality-based lighting colors
  const getLightColor = () => {
    const colors = {
      default: '#ffffff',
      roast: '#ff6b6b',
      hype: '#ff69b4',
      conspiracy: '#9b59b6',
      motivational: '#f39c12',
      sleepy: '#95a5a6'
    };
    return colors[personality] || colors.default;
  };
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[2, 2, 5]} 
        intensity={isSpeaking ? 0.8 + currentEnergy * 0.5 : 0.5}
        color={getLightColor()}
        castShadow
      />
      <pointLight 
        position={[-2, 1, 2]} 
        intensity={0.3}
        color="#ffffff"
      />
      
      {/* Environment */}
      <Environment preset="apartment" />
      
      {/* Avatar Model */}
      <Suspense fallback={null}>
        <AvatarModel 
          url={avatarUrl} 
          currentEnergy={currentEnergy}
          isSpeaking={isSpeaking}
          audioData={audioData}
        />
      </Suspense>
      
      {/* Controls */}
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        autoRotate={false}
        target={[0, -0.2, 0]}
        maxDistance={2}
        minDistance={0.8}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 6}
      />
    </>
  );
};

export const Avatar3DWorking: React.FC<Avatar3DWorkingProps> = ({
  personality,
  isListening,
  isSpeaking,
  isSynthesizing,
  audioData,
  width = 320,
  height = 320
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [showCreator, setShowCreator] = useState(false);
  const [currentEnergy, setCurrentEnergy] = useState(0);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const animationTimeRef = useRef(0);
  
  // Smooth energy transition
  const energySpring = useSpring(0, { 
    stiffness: 300, 
    damping: 20,
    mass: 1
  });

  // Avatar Creator configuration - Change bodyType for different views
  const avatarCreatorConfig: AvatarCreatorConfig = {
    clearCache: true,
    bodyType: 'halfbody', // 'fullbody' for full body, 'halfbody' for upper body only
    quickStart: true,
    language: 'en',
  };

  const creatorStyle = { width: '100%', height: '400px', border: 'none' };

  // Handle avatar creation
  const handleOnAvatarExported = useCallback((event: AvatarExportedEvent) => {
    const url = event.data.url;
    console.log('Avatar exported:', url);
    setAvatarUrl(url);
    setShowCreator(false);
    setModelLoading(true);
    setModelError(null);
    localStorage.setItem('readyPlayerMeAvatarUrl', url);
  }, []);

  // Load saved avatar on mount
  useEffect(() => {
    const savedAvatarUrl = localStorage.getItem('readyPlayerMeAvatarUrl');
    if (savedAvatarUrl) {
      console.log('Loading saved avatar:', savedAvatarUrl);
      setAvatarUrl(savedAvatarUrl);
      setModelLoading(true);
    }
  }, []);

  // Enhanced personality-based color schemes
  const getPersonalityColors = useCallback(() => {
    const schemes = {
      default: { primary: '#3B82F6', glow: '#DBEAFE', accent: '#60A5FA' },
      roast: { primary: '#EF4444', glow: '#FEE2E2', accent: '#F87171' },
      hype: { primary: '#EC4899', glow: '#FCE7F3', accent: '#F472B6' },
      conspiracy: { primary: '#8B5CF6', glow: '#EDE9FE', accent: '#A78BFA' },
      motivational: { primary: '#F59E0B', glow: '#FEF3C7', accent: '#FBBF24' },
      sleepy: { primary: '#6B7280', glow: '#F3F4F6', accent: '#9CA3AF' }
    };
    return schemes[personality] || schemes.default;
  }, [personality]);

  // Animation loop for audio reactivity
  useAnimationFrame((time) => {
    animationTimeRef.current = time * 0.001;
    
    const currentState = isSpeaking ? 'speaking' : isListening ? 'listening' : isSynthesizing ? 'synthesizing' : 'idle';
    
    let waveData;
    if (audioData && audioData.length > 0) {
      waveData = analyzeAudio(audioData);
    } else {
      waveData = generateProceduralWave(animationTimeRef.current, currentState);
    }

    const targetEnergy = waveData.volume;
    energySpring.set(targetEnergy);
    const smoothEnergy = energySpring.get();
    setCurrentEnergy(smoothEnergy);
  });

  const colors = getPersonalityColors();

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-80 h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl">
        
        {!avatarUrl ? (
          // Avatar creator or placeholder
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {showCreator ? (
              <div className="w-full h-full">
                <AvatarCreator 
                  subdomain="demo" 
                  config={avatarCreatorConfig} 
                  style={creatorStyle} 
                  onAvatarExported={handleOnAvatarExported} 
                />
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl">
                  🤖
                </div>
                <h3 className="text-white font-semibold mb-2">Create Your 3D Avatar</h3>
                <p className="text-gray-400 text-sm mb-4">Generate a personalized 3D avatar with lip sync</p>
                <button
                  onClick={() => setShowCreator(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Avatar
                </button>
              </div>
            )}
          </div>
        ) : (
          // Show the 3D avatar
          <div className="absolute inset-0">
            {modelError ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-red-500/20 flex items-center justify-center text-2xl">
                    ⚠️
                  </div>
                  <p className="text-white text-sm">Failed to load avatar</p>
                  <p className="text-gray-400 text-xs mt-1">{modelError}</p>
                  <button
                    onClick={() => setShowCreator(true)}
                    className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Canvas
                  style={{ width: '100%', height: '100%' }}
                  gl={{ 
                    antialias: true, 
                    alpha: true,
                    preserveDrawingBuffer: true
                  }}
                  camera={{ 
                    position: [0, 0, 1.8], 
                    fov: 60,
                    near: 0.1,
                    far: 1000
                  }}
                  onCreated={({ gl, camera }) => {
                    try {
                      gl.setClearColor(0x000000, 0);
                      // Ensure camera is looking at the head/face area
                      camera.lookAt(0, -0.2, 0);
                      setModelLoading(false);
                    } catch (error) {
                      console.error('Canvas setup error:', error);
                      setModelError('Failed to initialize 3D view');
                      setModelLoading(false);
                    }
                  }}
                >
                  <AvatarScene 
                    avatarUrl={avatarUrl}
                    currentEnergy={currentEnergy}
                    isSpeaking={isSpeaking}
                    personality={personality}
                    audioData={audioData}
                  />
                </Canvas>
                
                {modelLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500 animate-pulse flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                      <p className="text-white text-sm">Loading 3D Avatar...</p>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Audio-reactive glow effect */}
            {currentEnergy > 0.1 && isSpeaking && !modelLoading && (
              <div 
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${colors.glow}${Math.floor(currentEnergy * 20).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                  animation: `pulse ${Math.max(0.5, 2 - currentEnergy)}s ease-in-out infinite`
                }}
              />
            )}

            {/* Regenerate button */}
            <button
              onClick={() => setShowCreator(true)}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors text-xs"
              title="Create new avatar"
            >
              ✨
            </button>
          </div>
        )}
        
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
            animate={{ opacity: [0.7, 1, 0.7] }}
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

        {/* Overlay effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />
      </div>
    </div>
  );
};