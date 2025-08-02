import { Message } from './ChatInterface';

interface CleanMessageBubbleProps {
  message: Message;
}

export const CleanMessageBubble = ({ message }: CleanMessageBubbleProps) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`
          max-w-[80%] sm:max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-primary text-primary-foreground ml-12'
            : 'bg-muted text-foreground mr-12'
          }
        `}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        <div className={`text-xs mt-1 opacity-60 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};