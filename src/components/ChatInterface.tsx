import { useState } from 'react';
import { CleanChatArea } from './CleanChatArea';
import { ParticleBackground } from './ParticleBackground';

export type PersonalityMode = 'default' | 'roast' | 'hype' | 'conspiracy' | 'motivational' | 'sleepy';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  personality?: PersonalityMode;
}

export const ChatInterface = () => {
  const [currentPersonality, setCurrentPersonality] = useState<PersonalityMode>('default');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey! I\'m your AI content creation buddy. Pick a personality mode and let\'s create some amazing social media content together! ✨',
      sender: 'bot',
      timestamp: new Date(),
      personality: 'default'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [mood, setMood] = useState(50);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleSendMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(text, currentPersonality),
        sender: 'bot',
        timestamp: new Date(),
        personality: currentPersonality
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handlePersonalityChange = (personality: PersonalityMode) => {
    setCurrentPersonality(personality);
    
    // Add personality switch message
    const switchMessage: Message = {
      id: Date.now().toString(),
      text: getPersonalitySwitchMessage(personality),
      sender: 'bot',
      timestamp: new Date(),
      personality
    };
    
    setMessages(prev => [...prev, switchMessage]);
  };

  return (
    <div 
      className="h-screen w-full bg-background relative overflow-hidden"
      data-personality={currentPersonality}
    >
      {/* Subtle Particle Background - Hidden by default */}
      {effectsEnabled && (
        <ParticleBackground 
          personality={currentPersonality} 
          mood={mood}
          effectsEnabled={effectsEnabled}
        />
      )}
      
      <div className="relative z-10 h-full">
        <CleanChatArea 
          messages={messages}
          isTyping={isTyping}
          currentPersonality={currentPersonality}
          onSendMessage={handleSendMessage}
          onPersonalityChange={handlePersonalityChange}
          mood={mood}
          onMoodChange={setMood}
          effectsEnabled={effectsEnabled}
          onEffectsToggle={setEffectsEnabled}
          soundEnabled={soundEnabled}
          onSoundToggle={setSoundEnabled}
        />
      </div>
    </div>
  );
};

// Helper functions for bot responses
const getBotResponse = (userMessage: string, personality: PersonalityMode): string => {
  const responses = {
    default: [
      "That's interesting! Let me help you craft some engaging content around that idea.",
      "Great topic! Here are some angles we could explore for your social media.",
      "I love where your mind is going with this! Let's brainstorm some creative approaches."
    ],
    roast: [
      "Oh, you want to go THERE? 🔥 Alright, let's roast this topic until it's crispy!",
      "Hold up, hold up... you're about to get SCHOOLED on this topic! 🌶️",
      "YIKES! That's a hot take, but I'm about to make it SCORCHING! 🔥"
    ],
    hype: [
      "YOOOOO! 🎉 That's FIRE content right there! Let's turn this UP TO 11!",
      "NO WAY! 🚀 This is about to be the most EPIC post ever! LET'S GOOOO!",
      "STOP EVERYTHING! 🎊 This is going to BREAK THE INTERNET! I'm so hyped!"
    ],
    conspiracy: [
      "Interesting... very interesting indeed. 🕵️ The mainstream won't tell you this, but...",
      "Ah, you've stumbled upon something they don't want you to know... 👁️",
      "Wake up, sheeple! 🌚 What you're really talking about connects to something much deeper..."
    ],
    motivational: [
      "YES! 💪 You're already thinking like a CHAMPION! Let's turn this into pure MOTIVATION!",
      "I see that FIRE in your eyes! 🔥 This content is going to INSPIRE millions!",
      "BELIEVE IT! ⚡ You're about to create something that changes lives! LET'S MAKE IT HAPPEN!"
    ],
    sleepy: [
      "Hmm... that's nice... zzz... 😴 Maybe we could make something chill about that...",
      "Oh... yeah... that sounds... pretty good... 🌙 Let me just... think about it slowly...",
      "Mmmm... cozy topic... 💤 We could make something really peaceful and dreamy..."
    ]
  };

  const personalityResponses = responses[personality] || responses.default;
  return personalityResponses[Math.floor(Math.random() * personalityResponses.length)];
};

const getPersonalitySwitchMessage = (personality: PersonalityMode): string => {
  const messages = {
    default: "Back to normal mode! Ready to create some clean, professional content! ✨",
    roast: "OHHHH WE'RE IN ROAST MODE NOW! 🔥 Time to bring the HEAT! Someone's about to get BURNED!",
    hype: "HYPE BEAST MODE ACTIVATED! 🎉🚀 EVERYTHING IS AMAZING AND WE'RE GOING TO MAKE THE BEST CONTENT EVER!",
    conspiracy: "Entering conspiracy mode... 🕵️ The truth is out there, and we're going to find it together... 👁️",
    motivational: "MOTIVATIONAL MODE ENGAGED! 💪 Time to CREATE, INSPIRE, and DOMINATE! You've got this CHAMPION!",
    sleepy: "Sleepy mode activated... 😴 Let's make some chill, dreamy content... zzz... 🌙"
  };

  return messages[personality];
};