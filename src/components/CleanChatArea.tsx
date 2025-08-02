import { useEffect, useRef, useState } from 'react';
import { Settings, Send, Mic, MicOff } from 'lucide-react';
import { Message, PersonalityMode } from './ChatInterface';
import { CleanMessageBubble } from './CleanMessageBubble';
import { CleanTypingIndicator } from './CleanTypingIndicator';
import { PersonalitySelector } from './PersonalitySelector';
import { SettingsMenu } from './SettingsMenu';

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
  onSoundToggle
}: CleanChatAreaProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Content Creator AI</h1>
          <p className="text-sm text-muted-foreground">Create amazing social media content</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      {/* Settings Menu */}
      {showSettings && (
        <SettingsMenu
          mood={mood}
          onMoodChange={onMoodChange}
          effectsEnabled={effectsEnabled}
          onEffectsToggle={onEffectsToggle}
          soundEnabled={soundEnabled}
          onSoundToggle={onSoundToggle}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <CleanMessageBubble key={message.id} message={message} />
        ))}
        
        {isTyping && <CleanTypingIndicator personality={currentPersonality} />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        {/* Personality Selector */}
        <div className="mb-3">
          <PersonalitySelector
            currentPersonality={currentPersonality}
            onPersonalityChange={onPersonalityChange}
          />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full p-3 pr-12 bg-muted border border-input rounded-xl resize-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-h-[48px] max-h-[120px]"
                rows={1}
              />
              <button
                type="button"
                onClick={toggleRecording}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200 ${
                  isRecording 
                    ? 'text-red-500 bg-red-50 dark:bg-red-950' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};