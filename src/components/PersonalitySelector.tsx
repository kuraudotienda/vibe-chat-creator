import { PersonalityMode } from '../types';

interface PersonalitySelectorProps {
  currentPersonality: PersonalityMode;
  onPersonalityChange: (personality: PersonalityMode) => void;
}

const personalities = [
  { mode: 'default' as PersonalityMode, emoji: '🤖', label: 'Default', color: 'text-blue-500' },
  { mode: 'roast' as PersonalityMode, emoji: '🔥', label: 'Roast', color: 'text-red-500' },
  { mode: 'hype' as PersonalityMode, emoji: '🎉', label: 'Hype', color: 'text-pink-500' },
  { mode: 'conspiracy' as PersonalityMode, emoji: '🕵️', label: 'Conspiracy', color: 'text-purple-500' },
  { mode: 'motivational' as PersonalityMode, emoji: '💪', label: 'Motivational', color: 'text-orange-500' },
  { mode: 'sleepy' as PersonalityMode, emoji: '😴', label: 'Sleepy', color: 'text-indigo-500' },
];

export const PersonalitySelector = ({ currentPersonality, onPersonalityChange }: PersonalitySelectorProps) => {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-sm text-muted-foreground mr-2 font-medium">Mode:</span>
      {personalities.map((personality) => (
        <button
          key={personality.mode}
          onClick={() => onPersonalityChange(personality.mode)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105
            ${currentPersonality === personality.mode
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }
          `}
        >
          <span className="text-base">{personality.emoji}</span>
          <span className="hidden sm:inline">{personality.label}</span>
        </button>
      ))}
    </div>
  );
};