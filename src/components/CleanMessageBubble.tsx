import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '../types';
import { useChatStore } from '../stores/chatStore';
// Import a minimal highlight.js theme - we'll override with our custom colors

interface CleanMessageBubbleProps {
  message: Message;
}

export const CleanMessageBubble = ({ message }: CleanMessageBubbleProps) => {
  const isUser = message.sender === 'user';
  const { 
    speechEnabled, 
    isSpeaking, 
    isSynthesizing,
    currentSpeakingMessageId, 
    speakMessage, 
    stopSpeaking 
  } = useChatStore();

  const isCurrentlySpeaking = currentSpeakingMessageId === message.id;
  const isCurrentlySynthesizing = isCurrentlySpeaking && isSynthesizing;
  const canSpeak = speechEnabled && !isUser;

  // Animation class based on message type
  const animationClass = isUser ? 'animate-slide-in-right' : 'animate-slide-in-left';

  const handleSpeakClick = () => {
    if (isCurrentlySpeaking) {
      stopSpeaking();
    } else {
      speakMessage(message);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${animationClass} group`}>
      <div
        className={`
          max-w-[80%] sm:max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed relative transition-smooth hover-lift wholesome-shadow hover:wholesome-glow
          ${isUser
            ? 'message-bubble-user text-primary-foreground ml-12 bubble-tail-right'
            : 'message-bubble-bot text-card-foreground mr-12 bubble-tail-left'
          }
        `}
      >
        <div className="message-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Custom components for better styling
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="inline-code" {...props}>
                    {children}
                  </code>
                );
              },
              // Ensure links open in new tab
              a: ({ href, children, ...props }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  {children}
                </a>
              ),
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
        <div className={`flex items-center justify-between mt-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`text-xs opacity-60 ${isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          
          {canSpeak && (
            <button
              onClick={handleSpeakClick}
              className={`
                ml-2 p-1 rounded-full opacity-0 group-hover:opacity-70 hover:opacity-100 
                transition-smooth hover:scale-110 hover-lift speech-button
                ${isCurrentlySpeaking ? 'opacity-100' : ''}
              `}
              title={isCurrentlySpeaking ? 'Stop speaking' : 'Speak message'}
            >
              {isCurrentlySynthesizing ? (
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
              ) : isCurrentlySpeaking && isSpeaking ? (
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
              ) : isCurrentlySpeaking ? (
                <VolumeX className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Volume2 className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};