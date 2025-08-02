import { useState } from 'react';
import { Message } from './ChatInterface';
import { Heart, Laugh, Flame, ThumbsUp } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const reactions = [
  { icon: Heart, label: 'love' },
  { icon: Laugh, label: 'laugh' },
  { icon: Flame, label: 'fire' },
  { icon: ThumbsUp, label: 'like' }
];

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(false);

  const isUser = message.sender === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      <div className="relative max-w-[70%]">
        <div
          className={`
            p-4 rounded-2xl message-enter transition-all duration-300 group-hover:scale-[1.02]
            ${isUser 
              ? 'bg-user-message text-white ml-auto rounded-br-md' 
              : 'bg-bot-message text-message-text border border-input-border rounded-bl-md'
            }
          `}
          onMouseEnter={() => setShowTimestamp(true)}
          onMouseLeave={() => setShowTimestamp(false)}
        >
          <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
          
          {/* Timestamp */}
          {showTimestamp && (
            <div className={`
              text-xs mt-2 transition-opacity duration-200
              ${isUser ? 'text-white/70' : 'text-message-timestamp'}
            `}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>

        {/* Reactions */}
        {showReactions && !isUser && (
          <div className="absolute -top-3 right-0 flex gap-1 bg-chat-surface border border-input-border rounded-full px-2 py-1 shadow-lg animate-fade-in">
            {reactions.map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="p-1 hover:bg-personality-primary/20 rounded-full transition-all duration-200 hover:scale-125"
                onClick={() => {
                  // Add reaction logic here
                  console.log(`Reacted with ${label} to message:`, message.id);
                }}
              >
                <Icon className="w-4 h-4 text-personality-primary" />
              </button>
            ))}
          </div>
        )}

        {/* Bot personality indicator */}
        {!isUser && message.personality && (
          <div className="absolute -bottom-2 left-4">
            <div className="w-3 h-3 bg-personality-primary rounded-full border-2 border-chat-bg animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};