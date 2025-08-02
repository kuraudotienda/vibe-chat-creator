import { useEffect, useRef } from 'react';
import { Message, PersonalityMode } from './ChatInterface';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { BotAvatar } from './BotAvatar';

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  currentPersonality: PersonalityMode;
  onSendMessage: (text: string) => void;
}

export const ChatArea = ({ messages, isTyping, currentPersonality, onSendMessage }: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Bot Avatar */}
      <div className="absolute top-4 right-6 z-20">
        <BotAvatar personality={currentPersonality} isTyping={isTyping} />
      </div>

      {/* Chat Header */}
      <div className="glass border-b border-input-border p-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Social Media Content Creator
        </h1>
        <p className="text-message-timestamp">
          AI-powered content creation with personality ✨
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-personality-primary/50 scrollbar-track-transparent">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isTyping && <TypingIndicator personality={currentPersonality} />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-6 pt-4">
        <ChatInput onSendMessage={onSendMessage} />
      </div>
    </div>
  );
};