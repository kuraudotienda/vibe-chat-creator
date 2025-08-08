import { useState, useRef } from 'react';
import { Send, Mic, MicOff, Smile, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
}

const quickStarters = [
  "Help me create a viral TikTok idea",
  "Write an engaging Instagram caption",
  "Brainstorm YouTube video concepts",
  "Create a LinkedIn post",
  "Generate Twitter thread ideas"
];

export const ChatInput = ({ onSendMessage }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickStarters, setShowQuickStarters] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      setShowQuickStarters(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setShowQuickStarters(e.target.value.length === 0);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Placeholder for voice recording logic
    console.log(isRecording ? 'Stopped recording' : 'Started recording');
  };

  const handleQuickStarter = (starter: string) => {
    setMessage(starter);
    setShowQuickStarters(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Quick Starters */}
      {showQuickStarters && message.length === 0 && (
        <div className="mb-4 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-3">💡 Quick starters:</p>
          <div className="flex flex-wrap gap-2">
            {quickStarters.map((starter, index) => (
              <button
                key={index}
                onClick={() => handleQuickStarter(starter)}
                className="px-3 py-2 text-sm quick-starter rounded-lg transition-smooth wholesome-shadow hover:wholesome-glow text-card-foreground relative z-10"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="glass input-glow soft-inner-glow rounded-2xl border border-border focus-within:border-primary transition-smooth wholesome-shadow focus-within:wholesome-glow relative overflow-hidden">
        <div className="flex items-end gap-3 p-4 relative z-10">
          {/* Attachment Button */}
          <button className="p-2 text-muted-foreground hover:text-primary transition-smooth hover:scale-110 hover-lift">
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Shift + Enter for new line)"
              className="w-full bg-transparent text-foreground placeholder-muted-foreground resize-none focus:outline-none max-h-32 min-h-[24px]"
              rows={1}
            />
            
            {/* Character counter */}
            {message.length > 0 && (
              <div className="absolute -bottom-5 right-0 text-xs text-muted-foreground">
                {message.length} chars
              </div>
            )}
          </div>

          {/* Emoji Button */}
          <button className="p-2 text-muted-foreground hover:text-primary transition-smooth hover:scale-110 hover-lift">
            <Smile className="w-5 h-5" />
          </button>

          {/* Voice Recording */}
          <button
            onClick={toggleRecording}
            className={`
              p-2 rounded-lg transition-smooth hover:scale-110 hover-lift
              ${isRecording 
                ? 'text-red-500 recording-pulse' 
                : 'text-muted-foreground hover:text-primary'
              }
            `}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className={`
              p-3 rounded-xl transition-smooth hover-lift relative
              ${message.trim()
                ? 'send-button text-primary-foreground neon-glow wholesome-shadow' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }
            `}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};