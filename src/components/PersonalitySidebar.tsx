import { PersonalityMode } from '../types';

interface PersonalitySidebarProps {
  currentPersonality: PersonalityMode;
  onPersonalityChange: (personality: PersonalityMode) => void;
}

const personalities = [
  {
    id: 'default' as PersonalityMode,
    icon: '🤖',
    name: 'Default',
    description: 'Clean & Professional'
  },
  {
    id: 'roast' as PersonalityMode,
    icon: '🔥',
    name: 'Roast Mode',
    description: 'Spicy & Savage'
  },
  {
    id: 'hype' as PersonalityMode,
    icon: '🎉',
    name: 'Hype Beast',
    description: 'Energy & Excitement'
  },
  {
    id: 'conspiracy' as PersonalityMode,
    icon: '🕵️',
    name: 'Conspiracy',
    description: 'Mystery & Secrets'
  },
  {
    id: 'motivational' as PersonalityMode,
    icon: '💪',
    name: 'Motivational',
    description: 'Power & Inspiration'
  },
  {
    id: 'sleepy' as PersonalityMode,
    icon: '😴',
    name: 'Sleepy Bot',
    description: 'Chill & Dreamy'
  }
];

export const PersonalitySidebar = ({ currentPersonality, onPersonalityChange }: PersonalitySidebarProps) => {
  return (
    <div className="w-72 lg:w-80 glass border-r border-input-border p-6 flex flex-col">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-2">Personality Modes</h2>
        <p className="text-sm text-message-timestamp">Choose your AI's personality</p>
      </div>
      
      <div className="space-y-3 flex-1">
        {personalities.map((personality) => (
          <button
            key={personality.id}
            onClick={() => onPersonalityChange(personality.id)}
            className={`
              w-full p-4 rounded-xl text-left transition-all duration-300 ease-out
              hover:scale-105 hover:bg-chat-surface-hover group
              ${currentPersonality === personality.id
                ? 'bg-personality-primary/20 border-2 border-personality-primary neon-glow'
                : 'bg-chat-surface border border-input-border hover:border-personality-primary/50'
              }
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`
                text-3xl transition-transform duration-300
                ${currentPersonality === personality.id ? 'scale-110' : 'group-hover:scale-110'}
              `}>
                {personality.icon}
              </div>
              <div className="flex-1">
                <h3 className={`
                  font-semibold transition-colors duration-300
                  ${currentPersonality === personality.id 
                    ? 'text-personality-primary' 
                    : 'text-foreground group-hover:text-personality-accent'
                  }
                `}>
                  {personality.name}
                </h3>
                <p className="text-sm text-message-timestamp mt-1">
                  {personality.description}
                </p>
              </div>
            </div>
            
            {currentPersonality === personality.id && (
              <div className="mt-3 w-full h-1 bg-personality-primary rounded-full opacity-80" />
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-chat-surface rounded-xl border border-input-border">
        <div className="flex items-center gap-2 text-sm text-message-timestamp">
          <div className="w-2 h-2 bg-personality-primary rounded-full animate-pulse" />
          <span>Mode: {personalities.find(p => p.id === currentPersonality)?.name}</span>
        </div>
      </div>
    </div>
  );
};