import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Settings, ChevronDown } from 'lucide-react';
import { PersonalityMode } from '../types';
import { SimpleAnimatedAvatar } from './SimpleAnimatedAvatar';
import { SettingsMenu } from './SettingsMenu';
import { CommandSuggestions } from './CommandSuggestions';
import { useChatStore } from '../stores/chatStore';
import { keyboardSounds } from '../services/keyboardSounds';
import { commandSystem } from '../services/commandSystem';
import { ParticleBackground } from './ParticleBackground';

export const AvatarChatInterface = () => {
  const {
    isTyping,
    currentPersonality,
    mood,
    effectsEnabled,
    soundEnabled,
    speechEnabled,
    autoSpeakBot,
    keyboardSoundsEnabled,
    isSpeaking,
    isSynthesizing,
    currentSpeakingMessageId,
    messages,
    sendMessage,
    changePersonality,
    setMood,
    setEffectsEnabled,
    setSoundEnabled,
    setSpeechEnabled,
    setAutoSpeakBot,
    setKeyboardSoundsEnabled
  } = useChatStore();

  const [inputValue, setInputValue] = useState('');
  const [showPersonalityMenu, setShowPersonalityMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus input on load
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setIsListening(false);
      
      // Check if it's a command
      if (commandSystem.isCommand(inputValue.trim())) {
        const executed = await commandSystem.executeCommand(inputValue.trim());
        if (executed) {
          setInputValue('');
          setShowCommandSuggestions(false);
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
          return;
        }
      }
      
      sendMessage(inputValue.trim());
      setInputValue('');
      setShowCommandSuggestions(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Indicate listening state
    setIsListening(newValue.length > 0);
    
    // Play keyboard sound if text was added
    if (newValue.length > inputValue.length) {
      const lastChar = newValue.slice(-1);
      if (lastChar === ' ') {
        keyboardSounds.playKeySound('space');
      } else {
        keyboardSounds.playKeySound('normal');
      }
    }
    
    setInputValue(newValue);
    
    // Show/hide command suggestions
    if (newValue.startsWith('/')) {
      setShowCommandSuggestions(true);
      setShowPersonalityMenu(false);
    } else {
      setShowCommandSuggestions(false);
    }
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Let CommandSuggestions handle navigation keys when visible
    if (showCommandSuggestions && ['ArrowUp', 'ArrowDown', 'Tab', 'Escape'].includes(e.key)) {
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      keyboardSounds.playKeySound('enter');
      handleSubmit(e);
    }
  };

  const handleSelectCommand = (commandName: string) => {
    setInputValue(`/${commandName} `);
    setShowCommandSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleCloseCommandSuggestions = () => {
    setShowCommandSuggestions(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-personality-menu]') && !target.closest('[data-personality-button]')) {
        setShowPersonalityMenu(false);
      }
      if (!target.closest('[data-settings-menu]') && !target.closest('[data-settings-button]')) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      className="h-screen w-full bg-background relative overflow-hidden flex flex-col"
      data-personality={currentPersonality}
    >
      {/* Particle Background */}
      {effectsEnabled && (
        <ParticleBackground 
          personality={currentPersonality} 
          mood={mood}
          effectsEnabled={effectsEnabled}
        />
      )}
      
      {/* Settings Button - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          data-settings-button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-full bg-muted/80 backdrop-blur text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-all hover:scale-105 shadow-lg"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div data-settings-menu className="absolute top-20 right-6 z-30">
          <SettingsMenu
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
            keyboardSoundsEnabled={keyboardSoundsEnabled}
            onKeyboardSoundsToggle={setKeyboardSoundsEnabled}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}

      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Avatar - Large and Centered */}
        <div className="mb-8">
          <SimpleAnimatedAvatar
            personality={currentPersonality}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isSynthesizing={isSynthesizing}
          />
        </div>

        {/* Input Area - Centered Below Avatar */}
        <div className="w-full max-w-2xl">
          <div className="p-6 glass input-glow soft-inner-glow rounded-xl border border-border wholesome-shadow focus-within:wholesome-glow">
            {/* Command Suggestions */}
            {showCommandSuggestions && (
              <div className="mb-4">
                <CommandSuggestions
                  query={inputValue}
                  onSelectCommand={handleSelectCommand}
                  onClose={handleCloseCommandSuggestions}
                  isVisible={showCommandSuggestions}
                />
              </div>
            )}
            
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Text Input */}
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="How can I help you today?"
                className="w-full p-4 bg-transparent border-none resize-none text-foreground placeholder:text-muted-foreground focus:outline-none overflow-hidden text-[16px] leading-relaxed min-h-[60px]"
                rows={1}
                style={{ height: 'auto' }}
              />

              {/* Controls Row */}
              <div className="flex items-center justify-between">
                {/* Personality Selector */}
                <div className="relative" data-personality-menu>
                  <button
                    data-personality-button
                    type="button"
                    onClick={() => setShowPersonalityMenu(!showPersonalityMenu)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-smooth flex items-center gap-2 bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-foreground hover-lift animate-personality-switch wholesome-shadow"
                  >
                    <span>
                      {currentPersonality === 'default' ? '✨' : 
                       currentPersonality === 'hype' ? '🚀' : 
                       currentPersonality === 'roast' ? '🔥' : 
                       currentPersonality === 'motivational' ? '💪' : 
                       currentPersonality === 'conspiracy' ? '👁️' : '😴'}
                    </span>
                    <span>
                      {currentPersonality === 'default' ? 'Assistant' : 
                       currentPersonality === 'hype' ? 'Hype' : 
                       currentPersonality === 'roast' ? 'Roast' : 
                       currentPersonality === 'motivational' ? 'Motivate' : 
                       currentPersonality === 'conspiracy' ? 'Mystery' : 'Chill'}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Personality Dropdown */}
                  {showPersonalityMenu && (
                    <div className="absolute bottom-full mb-2 left-0 glass border border-border rounded-lg shadow-2xl p-2 z-50 min-w-[200px] animate-in slide-in-from-bottom-2 fade-in duration-200 wholesome-shadow">
                      {[
                        { mode: 'default' as PersonalityMode, label: 'Assistant', emoji: '✨' },
                        { mode: 'hype' as PersonalityMode, label: 'Hype', emoji: '🚀' },
                        { mode: 'roast' as PersonalityMode, label: 'Roast', emoji: '🔥' },
                        { mode: 'motivational' as PersonalityMode, label: 'Motivate', emoji: '💪' },
                        { mode: 'conspiracy' as PersonalityMode, label: 'Mystery', emoji: '👁️' },
                        { mode: 'sleepy' as PersonalityMode, label: 'Chill', emoji: '😴' }
                      ].map(({ mode, label, emoji }) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            changePersonality(mode);
                            setShowPersonalityMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                            currentPersonality === mode
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`}
                        >
                          <span className="text-sm">{emoji}</span>
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Controls */}
                <div className="flex items-center gap-2">
                  {!inputValue.trim() && (
                    <button
                      type="button"
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-smooth hover-lift"
                      title="Voice input"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className={`p-2.5 rounded-lg transition-smooth wholesome-shadow hover-lift animate-button-press active:scale-95 ${
                      inputValue.trim() 
                        ? 'send-button text-primary-foreground' 
                        : 'bg-muted text-muted-foreground cursor-not-allowed opacity-40'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer - Status Info */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="px-4 py-2 rounded-full bg-black/20 backdrop-blur text-white/70 text-sm">
          {isSpeaking ? 'Speaking...' :
           isSynthesizing ? 'Thinking...' :
           isTyping ? 'Processing...' :
           isListening ? 'Listening...' : 'Ready to help'}
        </div>
      </div>
    </div>
  );
};