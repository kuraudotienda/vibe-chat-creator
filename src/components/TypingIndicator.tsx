import { PersonalityMode } from './ChatInterface';

interface TypingIndicatorProps {
  personality: PersonalityMode;
}

export const TypingIndicator = ({ personality }: TypingIndicatorProps) => {
  const getTypingMessage = (personality: PersonalityMode) => {
    const messages = {
      default: 'AI is thinking...',
      roast: 'Preparing the roast... 🔥',
      hype: 'Getting HYPED... 🎉',
      conspiracy: 'Uncovering the truth... 🕵️',
      motivational: 'Channeling motivation... 💪',
      sleepy: 'Slowly thinking... 😴'
    };
    return messages[personality];
  };

  return (
    <div className="flex justify-start">
      <div className="bg-bot-message border border-input-border rounded-2xl rounded-bl-md p-4 max-w-[70%]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-personality-primary rounded-full typing-dot"></div>
            <div className="w-2 h-2 bg-personality-primary rounded-full typing-dot"></div>
            <div className="w-2 h-2 bg-personality-primary rounded-full typing-dot"></div>
          </div>
          <span className="text-sm text-message-timestamp">
            {getTypingMessage(personality)}
          </span>
        </div>
      </div>
    </div>
  );
};