import { Volume2, VolumeX, Sparkles, SparklesIcon, Download, Palette } from 'lucide-react';
import { Message } from './ChatInterface';

interface ControlPanelProps {
  mood: number;
  onMoodChange: (mood: number) => void;
  effectsEnabled: boolean;
  onEffectsToggle: (enabled: boolean) => void;
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
  messages: Message[];
}

export const ControlPanel = ({
  mood,
  onMoodChange,
  effectsEnabled,
  onEffectsToggle,
  soundEnabled,
  onSoundToggle,
  messages
}: ControlPanelProps) => {
  const handleExportChat = () => {
    // Placeholder for chat export functionality
    console.log('Exporting chat...', messages);
  };

  return (
    <div className="w-72 lg:w-80 glass border-l border-input-border p-6 flex flex-col">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-2">Visual Effects</h2>
        <p className="text-sm text-message-timestamp">Customize the experience</p>
      </div>

      {/* Mood Slider */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-foreground">Particle Intensity</label>
          <span className="text-xs text-message-timestamp">{mood}%</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={mood}
            onChange={(e) => onMoodChange(Number(e.target.value))}
            className="w-full h-2 bg-chat-surface rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, hsl(var(--personality-primary)) 0%, hsl(var(--personality-primary)) ${mood}%, hsl(var(--chat-surface)) ${mood}%, hsl(var(--chat-surface)) 100%)`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-message-timestamp mt-2">
          <span>Calm</span>
          <span>Chaotic</span>
        </div>
      </div>

      {/* Toggle Controls */}
      <div className="space-y-4 mb-8">
        <button
          onClick={() => onEffectsToggle(!effectsEnabled)}
          className={`
            w-full p-4 rounded-xl flex items-center justify-between transition-all duration-300
            ${effectsEnabled 
              ? 'bg-personality-primary/20 border-personality-primary text-personality-primary' 
              : 'bg-chat-surface border-input-border text-message-timestamp'
            } border
          `}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Screen Effects</span>
          </div>
          <div className={`
            w-12 h-6 rounded-full transition-all duration-300 relative
            ${effectsEnabled ? 'bg-personality-primary' : 'bg-chat-surface'}
          `}>
            <div className={`
              w-5 h-5 bg-white rounded-full transition-all duration-300 absolute top-0.5
              ${effectsEnabled ? 'translate-x-6' : 'translate-x-0.5'}
            `} />
          </div>
        </button>

        <button
          onClick={() => onSoundToggle(!soundEnabled)}
          className={`
            w-full p-4 rounded-xl flex items-center justify-between transition-all duration-300
            ${soundEnabled 
              ? 'bg-personality-primary/20 border-personality-primary text-personality-primary' 
              : 'bg-chat-surface border-input-border text-message-timestamp'
            } border
          `}
        >
          <div className="flex items-center gap-3">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="font-medium">Sound</span>
          </div>
          <div className={`
            w-12 h-6 rounded-full transition-all duration-300 relative
            ${soundEnabled ? 'bg-personality-primary' : 'bg-chat-surface'}
          `}>
            <div className={`
              w-5 h-5 bg-white rounded-full transition-all duration-300 absolute top-0.5
              ${soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}
            `} />
          </div>
        </button>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExportChat}
        className="w-full p-4 bg-personality-primary hover:bg-personality-secondary rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 neon-glow"
      >
        <Download className="w-5 h-5" />
        <span className="font-medium text-white">Export Chat</span>
      </button>

      {/* Mood Indicator */}
      <div className="mt-8 p-4 bg-chat-surface rounded-xl border border-input-border">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-personality-primary" />
          <span className="text-sm font-medium text-foreground">Current Vibe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-chat-bg rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-personality-secondary to-personality-primary transition-all duration-500"
              style={{ width: `${mood}%` }}
            />
          </div>
          <span className="text-xs text-message-timestamp">
            {mood < 30 ? 'Chill' : mood < 70 ? 'Active' : 'Intense'}
          </span>
        </div>
      </div>
    </div>
  );
};