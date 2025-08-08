import { useState, useEffect } from 'react';
import { CommandSuggestion, commandSystem } from '../services/commandSystem';

interface CommandSuggestionsProps {
  query: string;
  onSelectCommand: (commandName: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const CommandSuggestions = ({
  query,
  onSelectCommand,
  onClose,
  isVisible
}: CommandSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (query.startsWith('/')) {
      const newSuggestions = commandSystem.searchCommands(query);
      setSuggestions(newSuggestions);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(suggestions.length - 1, prev + 1));
          break;
        case 'Tab':
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            e.preventDefault();
            onSelectCommand(suggestions[selectedIndex].command.name);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, suggestions, selectedIndex, onSelectCommand, onClose]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 z-50">
      <div className="bg-[#2f2f2f]/95 backdrop-blur-sm border border-[#404040]/50 rounded-lg shadow-2xl max-h-64 overflow-y-auto animate-in slide-in-from-bottom-2 fade-in duration-200 ease-out">
        <div className="p-2">
          <div className="text-xs text-gray-400 mb-2 px-2 font-medium">
            Commands ({suggestions.length})
          </div>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.command.name}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ease-out transform
                ${index === selectedIndex 
                  ? 'bg-blue-500 text-white scale-[1.02] shadow-lg' 
                  : 'text-gray-300 hover:bg-[#3a3a3a] hover:text-white hover:scale-[1.01]'
                }
              `}
              onClick={() => onSelectCommand(suggestion.command.name)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                animationDelay: `${index * 20}ms`,
                animation: `slideInCommand 200ms ease-out forwards ${index * 20}ms`
              }}
            >
            <span className="text-sm">
              {commandSystem.getCategoryIcon(suggestion.command.category)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  /{suggestion.command.name}
                </span>
                <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded text-gray-400">
                  {suggestion.command.category}
                </span>
              </div>
              <div className="text-xs text-gray-400 truncate mt-0.5">
                {suggestion.command.description}
              </div>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              {suggestion.command.usage}
            </div>
          </div>
          ))}
        </div>
        <div className="border-t border-[#404040]/50 px-3 py-2 text-xs text-gray-500 bg-[#1a1a1a]/30">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className="text-gray-400">↑↓</span> Navigate
            </span>
            <span className="flex items-center gap-1">
              <span className="text-gray-400">Tab/Enter</span> Select
            </span>
            <span className="flex items-center gap-1">
              <span className="text-gray-400">Esc</span> Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};