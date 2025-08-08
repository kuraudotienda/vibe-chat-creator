import { PersonalityMode } from '../types';

interface CleanTypingIndicatorProps {
  personality: PersonalityMode;
}

export const CleanTypingIndicator = ({ personality }: CleanTypingIndicatorProps) => {
  return (
    <div className="flex justify-start animate-slide-in-left">
      <div className="max-w-[80%] sm:max-w-[70%] p-3 bg-[#2f2f2f] text-white mr-12 rounded-2xl shadow-lg shadow-black/20 animate-gentle-pulse">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Vibe AI is thinking</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};