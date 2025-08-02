import { Volume2, VolumeX, Sparkles, X } from 'lucide-react';

interface SettingsMenuProps {
  mood: number;
  onMoodChange: (mood: number) => void;
  effectsEnabled: boolean;
  onEffectsToggle: (enabled: boolean) => void;
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
  onClose: () => void;
}

export const SettingsMenu = ({
  mood,
  onMoodChange,
  effectsEnabled,
  onEffectsToggle,
  soundEnabled,
  onSoundToggle,
  onClose
}: SettingsMenuProps) => {
  return (
    <div className="border-b border-border bg-muted/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Settings</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Effects Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Visual Effects</span>
          </div>
          <button
            onClick={() => onEffectsToggle(!effectsEnabled)}
            className={`
              relative w-11 h-6 rounded-full transition-colors duration-200
              ${effectsEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
                ${effectsEnabled ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-muted-foreground" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm text-foreground">Sound</span>
          </div>
          <button
            onClick={() => onSoundToggle(!soundEnabled)}
            className={`
              relative w-11 h-6 rounded-full transition-colors duration-200
              ${soundEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
                ${soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>

        {/* Mood Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground">Effect Intensity</span>
            <span className="text-xs text-muted-foreground">{mood}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={mood}
            onChange={(e) => onMoodChange(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${mood}%, hsl(var(--muted)) ${mood}%, hsl(var(--muted)) 100%)`
            }}
          />
        </div>
      </div>
    </div>
  );
};