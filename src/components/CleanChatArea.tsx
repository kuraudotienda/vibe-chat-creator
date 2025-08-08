import { useEffect, useRef, useState } from 'react';
import { Settings, Send, Mic, MicOff, Sliders, ChevronDown } from 'lucide-react';
import { Message, PersonalityMode } from '../types';
import { CleanMessageBubble } from './CleanMessageBubble';
import { CleanTypingIndicator } from './CleanTypingIndicator';
import { PersonalitySelector } from './PersonalitySelector';
import { SettingsMenu } from './SettingsMenu';
import { ChatHeader } from './ChatHeader';
import { CommandSuggestions } from './CommandSuggestions';
import { keyboardSounds } from '../services/keyboardSounds';
import { commandSystem } from '../services/commandSystem';

interface CleanChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  currentPersonality: PersonalityMode;
  onSendMessage: (text: string) => void;
  onPersonalityChange: (personality: PersonalityMode) => void;
  mood: number;
  onMoodChange: (mood: number) => void;
  effectsEnabled: boolean;
  onEffectsToggle: (enabled: boolean) => void;
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
  speechEnabled: boolean;
  onSpeechToggle: (enabled: boolean) => void;
  autoSpeakBot: boolean;
  onAutoSpeakToggle: (enabled: boolean) => void;
  keyboardSoundsEnabled: boolean;
  onKeyboardSoundsToggle: (enabled: boolean) => void;
}

export const CleanChatArea = ({
  messages,
  isTyping,
  currentPersonality,
  onSendMessage,
  onPersonalityChange,
  mood,
  onMoodChange,
  effectsEnabled,
  onEffectsToggle,
  soundEnabled,
  onSoundToggle,
  speechEnabled,
  onSpeechToggle,
  autoSpeakBot,
  onAutoSpeakToggle,
  keyboardSoundsEnabled,
  onKeyboardSoundsToggle
}: CleanChatAreaProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showPersonalityMenu, setShowPersonalityMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Check if it's a command
      if (commandSystem.isCommand(inputValue.trim())) {
        const executed = await commandSystem.executeCommand(inputValue.trim());
        if (executed) {
          // Command was executed successfully, clear input
          setInputValue('');
          setShowCommandSuggestions(false);
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
          return;
        }
        // If command execution failed, fall through to normal message handling
      }
      
      onSendMessage(inputValue.trim());
      setInputValue('');
      setShowCommandSuggestions(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Play keyboard sound if text was added (not deleted)
    if (newValue.length > inputValue.length) {
      const lastChar = newValue.slice(-1);
      if (lastChar === ' ') {
        keyboardSounds.playKeySound('space');
      } else {
        keyboardSounds.playKeySound('normal');
      }
    }
    
    setInputValue(newValue);
    
    // Show/hide command suggestions based on input
    if (newValue.startsWith('/')) {
      setShowCommandSuggestions(true);
      setShowPersonalityMenu(false); // Close personality menu when showing commands
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
      return; // CommandSuggestions will handle these
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <ChatHeader onSettingsClick={() => setShowSettings(!showSettings)} />
      
      {/* Settings Panel */}
      {showSettings && (
        <SettingsMenu
          mood={mood}
          onMoodChange={onMoodChange}
          effectsEnabled={effectsEnabled}
          onEffectsToggle={onEffectsToggle}
          soundEnabled={soundEnabled}
          onSoundToggle={onSoundToggle}
          speechEnabled={speechEnabled}
          onSpeechToggle={onSpeechToggle}
          autoSpeakBot={autoSpeakBot}
          onAutoSpeakToggle={onAutoSpeakToggle}
          keyboardSoundsEnabled={keyboardSoundsEnabled}
          onKeyboardSoundsToggle={onKeyboardSoundsToggle}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <CleanMessageBubble key={message.id} message={message} />
        ))}

        {isTyping && <CleanTypingIndicator personality={currentPersonality} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Exact Claude Style */}
      <div className="p-6 mx-auto glass input-glow soft-inner-glow rounded-xl max-w-4xl w-full border border-border wholesome-shadow focus-within:wholesome-glow">
        <div className="max-w-4xl mx-auto">
          {/* Main Input Box */}
            <form onSubmit={handleSubmit} className="relative">
              {/* Command Suggestions */}
              {showCommandSuggestions && (
                <CommandSuggestions
                  query={inputValue}
                  onSelectCommand={handleSelectCommand}
                  onClose={handleCloseCommandSuggestions}
                  isVisible={showCommandSuggestions}
                />
              )}
              
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="How can I help..."
                className="w-full p-3 pr-20 bg-transparent border-none resize-none text-foreground placeholder:text-muted-foreground focus:outline-none overflow-hidden text-[16px] leading-relaxed"
                rows={1}
                style={{ height: 'auto' }}
              />



            </form>


          <div className="flex items-center justify-between align-center">

            {/* Personality Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowPersonalityMenu(!showPersonalityMenu)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-smooth flex items-center gap-2 bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-foreground hover-lift animate-personality-switch wholesome-shadow"
              >
                <span>{currentPersonality === 'default' ? '✨' : currentPersonality === 'hype' ? '🚀' : currentPersonality === 'roast' ? '🔥' : currentPersonality === 'motivational' ? '💪' : currentPersonality === 'conspiracy' ? '👁️' : '😴'}</span>
                <span>{currentPersonality === 'default' ? 'Write' : currentPersonality === 'hype' ? 'Hype' : currentPersonality === 'roast' ? 'Roast' : currentPersonality === 'motivational' ? 'Motivate' : currentPersonality === 'conspiracy' ? 'Mystery' : 'Chill'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Personality Dropdown Menu */}
              {showPersonalityMenu && (
                <div className="absolute bottom-full mb-2 left-0 glass border border-border rounded-lg shadow-2xl p-2 z-10 min-w-[200px] animate-in slide-in-from-bottom-2 fade-in duration-200 wholesome-shadow">
                  {[
                    { mode: 'default' as PersonalityMode, label: 'Write', emoji: '✨' },
                    { mode: 'hype' as PersonalityMode, label: 'Hype', emoji: '🚀' },
                    { mode: 'roast' as PersonalityMode, label: 'Roast', emoji: '🔥' },
                    { mode: 'motivational' as PersonalityMode, label: 'Motivate', emoji: '💪' },
                    { mode: 'conspiracy' as PersonalityMode, label: 'Mystery', emoji: '👁️' },
                    { mode: 'sleepy' as PersonalityMode, label: 'Chill', emoji: '😴' },
                    { mode: 'funfact' as PersonalityMode, label: 'Fun Fact', emoji: '🎉' }
                  ].map(({ mode, label, emoji }) => (
                    <button
                      key={mode}
                      onClick={() => {
                        onPersonalityChange(mode);
                        setShowPersonalityMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${currentPersonality === mode
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
            {/* Input Controls */}
            <div className="flex items-center gap-2">
              {!inputValue.trim() && (
                <button
                  type="button"
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-smooth hover-lift"
                  title="Voice input"
                >
                  <Mic size={5} className="w-4 h-4" />
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

        </div>
      </div>
    </div>
  );
};