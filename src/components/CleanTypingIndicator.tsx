import { PersonalityMode } from './ChatInterface';

interface CleanTypingIndicatorProps {
  personality: PersonalityMode;
}

export const CleanTypingIndicator = ({ personality }: CleanTypingIndicatorProps) => {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-[80%] sm:max-w-[70%] p-3 bg-muted text-foreground mr-12 rounded-2xl">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">AI is typing</span>
          <div className="flex gap-1 ml-2">
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};