import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { motion, useAnimationFrame, useSpring } from 'framer-motion';
import { AvatarCreator, AvatarCreatorConfig, AvatarExportedEvent } from '@readyplayerme/react-avatar-creator';
import { BaseVisualizerProps } from '../types/visualizer';
import { analyzeAudio, generateProceduralWave } from '../utils/audioAnalysis';
import { PersonalityMode } from '../types';

interface Avatar3DAdvancedProps extends BaseVisualizerProps {}

// Import Avatar component directly
let Avatar: any = null;

// Initialize Avatar component
const initializeAvatar = async () => {
  try {
    const visage = await import('@readyplayerme/visage');
    Avatar = visage.Avatar;
    return true;
  } catch (error) {
    console.error('Failed to load Ready Player Me Visage:', error);
    return false;
  }
};

// Avatar renderer component
const AvatarRenderer: React.FC<{ modelSrc: string; currentEnergy: number; isSpeaking: boolean }> = ({ 
  modelSrc, 
  currentEnergy, 
  isSpeaking 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    initializeAvatar().then(setIsLoaded);
  }, []);

  if (!isLoaded || !Avatar) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl animate-pulse">
            🤖
          </div>
          <p className="text-white text-sm">Loading 3D Avatar...</p>
          <p className="text-gray-400 text-xs mt-1">Initializing Ready Player Me</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <Avatar
        modelSrc={modelSrc}
        style={{ width: '100%', height: '100%' }}
        scale={1.2}
        cameraInitialDistance={2.5}
        cameraTarget={[0, 0.5, 0]}
        environment="apartment"
        animationSpeed={isSpeaking && currentEnergy > 0.1 ? Math.max(0.5, currentEnergy * 2) : 1}
      />
    );
  } catch (error) {
    console.error('Error rendering avatar:', error);
    return (
      <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-orange-600/20 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-4xl">
            ⚠️
          </div>
          <p className="text-white text-sm">Avatar Error</p>
          <p className="text-gray-400 text-xs mt-1">Check console for details</p>
        </div>
      </div>
    );
  }
};

export const Avatar3DAdvanced: React.FC<Avatar3DAdvancedProps> = ({
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
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const animationTimeRef = useRef(0);
  
  // Smooth energy transition with spring physics
  const energySpring = useSpring(0, { 
    stiffness: 300, 
    damping: 20,
    mass: 1
  });

  // Avatar Creator configuration
  const avatarCreatorConfig: AvatarCreatorConfig = {
    clearCache: true,
    bodyType: 'halfbody',
    quickStart: true,
    language: 'en',
  };

  const creatorStyle = { width: '100%', height: '400px', border: 'none' };

  // Handle avatar creation
  const handleOnAvatarExported = useCallback((event: AvatarExportedEvent) => {
    setAvatarUrl(event.data.url);
    setShowCreator(false);
    setAvatarLoaded(true);
    localStorage.setItem('readyPlayerMeAvatarUrl', event.data.url);
  }, []);

  // Load saved avatar on mount
  useEffect(() => {
    const savedAvatarUrl = localStorage.getItem('readyPlayerMeAvatarUrl');
    if (savedAvatarUrl) {
      setAvatarUrl(savedAvatarUrl);
      setAvatarLoaded(true);
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
            <AvatarRenderer 
              modelSrc={avatarUrl} 
              currentEnergy={currentEnergy}
              isSpeaking={isSpeaking}
            />
            
            {/* Audio-reactive glow effect */}
            {currentEnergy > 0.1 && isSpeaking && (
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