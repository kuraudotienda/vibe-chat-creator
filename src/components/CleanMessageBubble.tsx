import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Message } from './ChatInterface';
import { useChatStore } from '../stores/chatStore';

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

  const handleSpeakClick = () => {
    if (isCurrentlySpeaking) {
      stopSpeaking();
    } else {
      speakMessage(message);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
      <div
        className={`
          max-w-[80%] sm:max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed relative
          ${isUser
            ? 'bg-primary text-primary-foreground ml-12'
            : 'bg-muted text-foreground mr-12'
          }
        `}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        <div className={`flex items-center justify-between mt-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`text-xs opacity-60`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          
          {canSpeak && (
            <button
              onClick={handleSpeakClick}
              className={`
                ml-2 p-1 rounded-full opacity-0 group-hover:opacity-70 hover:opacity-100 
                transition-all duration-200 hover:scale-110
                ${isCurrentlySpeaking ? 'opacity-100' : ''}
              `}
              title={isCurrentlySpeaking ? 'Stop speaking' : 'Speak message'}
            >
              {isCurrentlySynthesizing ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              ) : isCurrentlySpeaking && isSpeaking ? (
                <Loader2 className="w-3 h-3 animate-spin text-green-500" />
              ) : isCurrentlySpeaking ? (
                <VolumeX className="w-3 h-3" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};