import { CleanChatArea } from './CleanChatArea';
import { ParticleBackground } from './ParticleBackground';
import { useChatStore } from '../stores/chatStore';

export type PersonalityMode = 'default' | 'roast' | 'hype' | 'conspiracy' | 'motivational' | 'sleepy';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  personality?: PersonalityMode;
}

export const ChatInterface = () => {
  const {
    messages,
    isTyping,
    currentPersonality,
    mood,
    effectsEnabled,
    soundEnabled,
    speechEnabled,
    autoSpeakBot,
    sendMessage,
    changePersonality,
    setMood,
    setEffectsEnabled,
    setSoundEnabled,
    setSpeechEnabled,
    setAutoSpeakBot
  } = useChatStore();

  return (
    <div 
      className="h-screen w-full bg-background relative overflow-hidden"
      data-personality={currentPersonality}
    >
      {/* Subtle Particle Background - Hidden by default */}
      {effectsEnabled && (
        <ParticleBackground 
          personality={currentPersonality} 
          mood={mood}
          effectsEnabled={effectsEnabled}
        />
      )}
      
      <div className="relative z-10 h-full">
        <CleanChatArea 
          messages={messages}
          isTyping={isTyping}
          currentPersonality={currentPersonality}
          onSendMessage={sendMessage}
          onPersonalityChange={changePersonality}
          mood={mood}
          onMoodChange={setMood}
          effectsEnabled={effectsEnabled}
          onEffectsToggle={setEffectsEnabled}
          soundEnabled={soundEnabled}
          onSoundToggle={setSoundEnabled}
          speechEnabled={speechEnabled}
          onSpeechToggle={setSpeechEnabled}
          autoSpeakBot={autoSpeakBot}
          onAutoSpeakToggle={setAutoSpeakBot}
        />
      </div>
    </div>
  );
};