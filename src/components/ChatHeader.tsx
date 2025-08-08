import { Settings } from 'lucide-react';

interface ChatHeaderProps {
  onSettingsClick: () => void;
}

export const ChatHeader = ({ onSettingsClick }: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur-sm wholesome-shadow">
      {/* AI Name/Branding */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-gentle-pulse wholesome-glow animate-wholesome-float">
          <span className="text-primary-foreground font-bold text-sm">✨</span>
        </div>
        <div>
          <h1 className="text-card-foreground font-semibold text-lg">Vibe AI</h1>
          <p className="text-muted-foreground text-xs">Just for vibes. Built with love ❤️ @art</p>
        </div>
      </div>

      {/* Settings Button */}
      <button
        onClick={onSettingsClick}
        className="p-2 text-muted-foreground hover:text-card-foreground hover:bg-accent rounded-lg transition-smooth hover-lift wholesome-shadow hover:wholesome-glow"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
};