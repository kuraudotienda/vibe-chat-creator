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
          <p className="text-sm text-message-timestamp mb-3">💡 Quick starters:</p>
          <div className="flex flex-wrap gap-2">
            {quickStarters.map((starter, index) => (
              <button
                key={index}
                onClick={() => handleQuickStarter(starter)}
                className="px-3 py-2 text-sm bg-chat-surface hover:bg-personality-primary/20 border border-input-border hover:border-personality-primary/50 rounded-lg transition-all duration-200 hover:scale-105"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="glass rounded-2xl border border-input-border focus-within:border-personality-primary transition-all duration-300">
        <div className="flex items-end gap-3 p-4">
          {/* Attachment Button */}
          <button className="p-2 text-message-timestamp hover:text-personality-primary transition-colors duration-200 hover:scale-110">
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
              className="w-full bg-transparent text-foreground placeholder-message-timestamp resize-none focus:outline-none max-h-32 min-h-[24px]"
              rows={1}
            />
            
            {/* Character counter */}
            {message.length > 0 && (
              <div className="absolute -bottom-5 right-0 text-xs text-message-timestamp">
                {message.length} chars
              </div>
            )}
          </div>

          {/* Emoji Button */}
          <button className="p-2 text-message-timestamp hover:text-personality-primary transition-colors duration-200 hover:scale-110">
            <Smile className="w-5 h-5" />
          </button>

          {/* Voice Recording */}
          <button
            onClick={toggleRecording}
            className={`
              p-2 rounded-lg transition-all duration-200 hover:scale-110
              ${isRecording 
                ? 'text-red-500 recording-pulse' 
                : 'text-message-timestamp hover:text-personality-primary'
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
              p-3 rounded-xl transition-all duration-200 hover:scale-105
              ${message.trim()
                ? 'bg-personality-primary hover:bg-personality-secondary text-white neon-glow' 
                : 'bg-chat-surface text-message-timestamp cursor-not-allowed'
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