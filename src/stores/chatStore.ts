import { create } from 'zustand';
import { Message, PersonalityMode } from '../components/ChatInterface';
import { voiceManager } from '../services/voice/voiceManager';

interface ChatState {
  // Messages state
  messages: Message[];
  isTyping: boolean;
  
  // Personality state
  currentPersonality: PersonalityMode;
  
  // Settings state
  mood: number;
  effectsEnabled: boolean;
  soundEnabled: boolean;
  
  // Speech state
  isSpeaking: boolean;
  speechEnabled: boolean;
  autoSpeakBot: boolean;
  currentSpeakingMessageId: string | null;
  isSynthesizing: boolean;
  synthesisQueue: number;
  
  // Actions
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setIsTyping: (isTyping: boolean) => void;
  setCurrentPersonality: (personality: PersonalityMode) => void;
  setMood: (mood: number) => void;
  setEffectsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Speech actions
  setIsSpeaking: (speaking: boolean) => void;
  setSpeechEnabled: (enabled: boolean) => void;
  setAutoSpeakBot: (enabled: boolean) => void;
  setCurrentSpeakingMessageId: (id: string | null) => void;
  setIsSynthesizing: (synthesizing: boolean) => void;
  setSynthesisQueue: (count: number) => void;
  speakMessage: (message: Message) => Promise<void>;
  stopSpeaking: () => void;
  
  // Complex actions
  sendMessage: (text: string) => void;
  changePersonality: (personality: PersonalityMode) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [
    {
      id: '1',
      text: 'Hey! I\'m your AI content creation buddy. Pick a personality mode and let\'s create some amazing social media content together! ✨',
      sender: 'bot',
      timestamp: new Date(),
      personality: 'default'
    }
  ],
  isTyping: false,
  currentPersonality: 'default',
  mood: 50,
  effectsEnabled: true,
  soundEnabled: true,
  
  // Speech state
  isSpeaking: false,
  speechEnabled: true,
  autoSpeakBot: true,
  currentSpeakingMessageId: null,
  isSynthesizing: false,
  synthesisQueue: 0,
  
  // Simple actions
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  setMessages: (messages) => set({ messages }),
  
  setIsTyping: (isTyping) => set({ isTyping }),
  
  setCurrentPersonality: (personality) => set({ currentPersonality: personality }),
  
  setMood: (mood) => set({ mood }),
  
  setEffectsEnabled: (enabled) => set({ effectsEnabled: enabled }),
  
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  
  // Speech actions
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  
  setSpeechEnabled: (enabled) => set({ speechEnabled: enabled }),
  
  setAutoSpeakBot: (enabled) => set({ autoSpeakBot: enabled }),
  
  setCurrentSpeakingMessageId: (id) => set({ currentSpeakingMessageId: id }),
  
  setIsSynthesizing: (synthesizing) => set({ isSynthesizing: synthesizing }),
  
  setSynthesisQueue: (count) => set({ synthesisQueue: count }),
  
  speakMessage: async (message) => {
    const { 
      setIsSpeaking, 
      setCurrentSpeakingMessageId, 
      setIsSynthesizing,
      speechEnabled, 
      currentPersonality 
    } = get();
    
    if (!speechEnabled) {
      return;
    }
    
    try {
      setCurrentSpeakingMessageId(message.id);
      setIsSynthesizing(true);
      
      const personality = message.personality || currentPersonality;
      
      await voiceManager.speak(message.text, personality, {
        onStart: () => {
          setIsSynthesizing(false);
          setIsSpeaking(true);
        },
        onEnd: () => {
          setIsSpeaking(false);
          setCurrentSpeakingMessageId(null);
        },
        onError: (error) => {
          console.error('Speech synthesis error:', error);
          setIsSynthesizing(false);
          setIsSpeaking(false);
          setCurrentSpeakingMessageId(null);
        }
      });
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsSynthesizing(false);
      setIsSpeaking(false);
      setCurrentSpeakingMessageId(null);
    }
  },
  
  stopSpeaking: () => {
    const { setIsSpeaking, setCurrentSpeakingMessageId, setIsSynthesizing } = get();
    voiceManager.stop();
    setIsSpeaking(false);
    setIsSynthesizing(false);
    setCurrentSpeakingMessageId(null);
  },
  
  // Complex actions
  sendMessage: (text) => {
    const { 
      addMessage, 
      setIsTyping, 
      setIsSynthesizing,
      currentPersonality, 
      autoSpeakBot, 
      speakMessage 
    } = get();
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    
    addMessage(userMessage);
    setIsTyping(true);
    
    // Generate bot response text
    const botResponseText = getBotResponse(text, currentPersonality);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponseText,
      sender: 'bot',
      timestamp: new Date(),
      personality: currentPersonality
    };
    
    // Start voice synthesis immediately if auto-speak is enabled
    let synthesisPromise: Promise<void> | null = null;
    if (autoSpeakBot) {
      setIsSynthesizing(true);
      synthesisPromise = voiceManager.synthesize(
        botMessage.text, 
        currentPersonality,
        {
          onSynthesisStart: () => {
            console.log('Voice synthesis started');
          },
          onSynthesisComplete: () => {
            setIsSynthesizing(false);
            console.log('Voice synthesis completed');
          },
          onError: (error) => {
            console.error('Voice synthesis error:', error);
            setIsSynthesizing(false);
          }
        }
      ).then(() => undefined).catch((error) => {
        console.error('Synthesis failed:', error);
        setIsSynthesizing(false);
      });
    }
    
    // Simulate typing duration (ensure minimum time for synthesis)
    const typingDuration = Math.max(
      2000 + Math.random() * 1500, // Natural typing time
      autoSpeakBot ? 3000 : 1500   // Extra time for synthesis if needed
    );
    
    setTimeout(async () => {
      // Add bot message to chat
      addMessage(botMessage);
      setIsTyping(false);
      
      // If auto-speak is enabled and synthesis is ready, start playback
      if (autoSpeakBot && synthesisPromise) {
        try {
          // Wait for synthesis to complete if still in progress
          await synthesisPromise;
          
          // Small delay to let the message appear first
          setTimeout(() => {
            speakMessage(botMessage);
          }, 300);
        } catch (error) {
          console.error('Failed to play synthesized speech:', error);
        }
      }
    }, typingDuration);
  },
  
  changePersonality: (personality) => {
    const { addMessage, setCurrentPersonality, autoSpeakBot, speakMessage } = get();
    
    setCurrentPersonality(personality);
    
    // Add personality switch message
    const switchMessage: Message = {
      id: Date.now().toString(),
      text: getPersonalitySwitchMessage(personality),
      sender: 'bot',
      timestamp: new Date(),
      personality
    };
    
    addMessage(switchMessage);
    
    // Auto-speak personality switch message if enabled
    if (autoSpeakBot) {
      setTimeout(() => {
        speakMessage(switchMessage);
      }, 300);
    }
  }
}));

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