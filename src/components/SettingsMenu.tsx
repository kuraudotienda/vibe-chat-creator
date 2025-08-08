import { Volume2, VolumeX, Sparkles, X, MessageSquare, Keyboard, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface SettingsMenuProps {
  mood: number;
  onMoodChange: (mood: number) => void;
  effectsEnabled: boolean;
  onEffectsToggle: (enabled: boolean) => void;
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
  speechEnabled: boolean;
  onSpeechToggle: (enabled: boolean) => void;
  autoSpeakBot: boolean;
  onAutoSpeakToggle: (enabled: boolean) => void;
  keyboardSoundsEnabled: boolean;
  onKeyboardSoundsToggle: (enabled: boolean) => void;
  onClose: () => void;
}

export const SettingsMenu = ({
  mood,
  onMoodChange,
  effectsEnabled,
  onEffectsToggle,
  soundEnabled,
  onSoundToggle,
  speechEnabled,
  onSpeechToggle,
  autoSpeakBot,
  onAutoSpeakToggle,
  keyboardSoundsEnabled,
  onKeyboardSoundsToggle,
  onClose
}: SettingsMenuProps) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="border-b border-border bg-card p-4 animate-settings-slide">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Settings</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-accent rounded-lg transition-smooth hover-lift"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm text-foreground">Theme</span>
          </div>
          <button
            onClick={toggleTheme}
            className={`
              relative w-11 h-6 rounded-full transition-colors duration-200
              ${theme === 'light' ? 'bg-primary' : 'bg-muted'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
                ${theme === 'light' ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>

        {/* Effects Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Visual Effects</span>
          </div>
          <button
            onClick={() => onEffectsToggle(!effectsEnabled)}
            className={`
              relative w-11 h-6 rounded-full transition-smooth hover-glow
              ${effectsEnabled ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-muted'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full transition-smooth shadow-lg
                ${effectsEnabled ? 'translate-x-5 shadow-blue-200/50' : 'translate-x-0.5'}
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
              relative w-11 h-6 rounded-full transition-smooth hover-glow
              ${soundEnabled ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-muted'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full transition-smooth shadow-lg
                ${soundEnabled ? 'translate-x-5 shadow-blue-200/50' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>

        {/* Speech Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Text-to-Speech</span>
          </div>
          <button
            onClick={() => onSpeechToggle(!speechEnabled)}
            className={`
              relative w-11 h-6 rounded-full transition-colors duration-200
              ${speechEnabled ? 'bg-primary' : 'bg-muted'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
                ${speechEnabled ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>

        {/* Keyboard Sounds Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Keyboard Sounds</span>
          </div>
          <button
            onClick={() => onKeyboardSoundsToggle(!keyboardSoundsEnabled)}
            className={`
              relative w-11 h-6 rounded-full transition-colors duration-200
              ${keyboardSoundsEnabled ? 'bg-primary' : 'bg-muted'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
                ${keyboardSoundsEnabled ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>

        {/* Auto-Speak Bot Messages */}
        {speechEnabled && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Auto-Speak Bot</span>
            </div>
            <button
              onClick={() => onAutoSpeakToggle(!autoSpeakBot)}
              className={`
                relative w-11 h-6 rounded-full transition-colors duration-200
                ${autoSpeakBot ? 'bg-primary' : 'bg-muted'}
              `}
            >
              <div
                className={`
                  absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
                  ${autoSpeakBot ? 'translate-x-5' : 'translate-x-0.5'}
                `}
              />
            </button>
          </div>
        )}

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