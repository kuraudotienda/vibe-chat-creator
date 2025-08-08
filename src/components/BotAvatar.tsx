import { PersonalityMode } from '../types';

interface BotAvatarProps {
  personality: PersonalityMode;
  isTyping: boolean;
}

export const BotAvatar = ({ personality, isTyping }: BotAvatarProps) => {
  const getAvatarContent = (personality: PersonalityMode) => {
    const avatars = {
      default: { emoji: '🤖', bg: 'bg-blue-500' },
      roast: { emoji: '🔥', bg: 'bg-orange-500' },
      hype: { emoji: '🎉', bg: 'bg-pink-500' },
      conspiracy: { emoji: '🕵️', bg: 'bg-purple-500' },
      motivational: { emoji: '💪', bg: 'bg-yellow-500' },
      sleepy: { emoji: '😴', bg: 'bg-blue-400' }
    };
    return avatars[personality];
  };

  const avatar = getAvatarContent(personality);

  return (
    <div className={`
      relative w-16 h-16 rounded-full flex items-center justify-center
      bg-personality-primary border-4 border-chat-bg shadow-lg
      transition-all duration-500 hover:scale-110
      ${isTyping ? 'animate-bounce' : 'hover:rotate-12'}
    `}>
      {/* Avatar Emoji */}
      <span className="text-2xl">{avatar.emoji}</span>
      
      {/* Status Indicator */}
      <div className={`
        absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-chat-bg
        ${isTyping ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}
        transition-all duration-300
      `} />
      
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-personality-glow animate-pulse" />
      
      {/* Personality-based particles */}
      {personality === 'roast' && (
        <div className="absolute -top-2 -left-2">
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-ping" />
        </div>
      )}
      
      {personality === 'hype' && (
        <div className="absolute -top-1 -right-1">
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
        </div>
      )}
      
      {personality === 'conspiracy' && (
        <div className="absolute -bottom-2 -left-2">
          <div className="w-3 h-3 bg-purple-400 rounded-full opacity-50 animate-pulse" />
        </div>
      )}
      
      {personality === 'motivational' && (
        <div className="absolute -top-1 -left-1">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
        </div>
      )}
      
      {personality === 'sleepy' && (
        <div className="absolute top-0 right-0">
          <div className="text-xs opacity-70">💤</div>
        </div>
      )}
    </div>
  );
};