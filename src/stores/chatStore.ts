import { create } from 'zustand';
import { Message, PersonalityMode, AgentRequest } from '../types';
import { voiceManager } from '../services/voice/voiceManager';
import { agentService } from '../services/agentService';

interface ChatState {
  // Messages state
  messages: Message[];
  isTyping: boolean;
  
  // Session state
  sessionId: string;
  
  // Personality state
  currentPersonality: PersonalityMode;
  
  // Settings state
  mood: number;
  effectsEnabled: boolean;
  soundEnabled: boolean;
  keyboardSoundsEnabled: boolean;
  
  // Speech state
  isSpeaking: boolean;
  speechEnabled: boolean;
  autoSpeakBot: boolean;
  currentSpeakingMessageId: string | null;
  isSynthesizing: boolean;
  synthesisQueue: number;
  currentAudioElement: HTMLAudioElement | null;
  
  // Actions
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setIsTyping: (isTyping: boolean) => void;
  setCurrentPersonality: (personality: PersonalityMode) => void;
  setMood: (mood: number) => void;
  setEffectsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setKeyboardSoundsEnabled: (enabled: boolean) => void;
  
  // Speech actions
  setIsSpeaking: (speaking: boolean) => void;
  setSpeechEnabled: (enabled: boolean) => void;
  setAutoSpeakBot: (enabled: boolean) => void;
  setCurrentSpeakingMessageId: (id: string | null) => void;
  setIsSynthesizing: (synthesizing: boolean) => void;
  setSynthesisQueue: (count: number) => void;
  setCurrentAudioElement: (element: HTMLAudioElement | null) => void;
  speakMessage: (message: Message) => Promise<void>;
  stopSpeaking: () => void;
  
  // Complex actions
  sendMessage: (text: string) => Promise<void>;
  changePersonality: (personality: PersonalityMode) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state - empty messages for avatar mode
  messages: [],
  isTyping: false,
  sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`,
  currentPersonality: 'default',
  mood: 50,
  effectsEnabled: true,
  soundEnabled: true,
  keyboardSoundsEnabled: true,
  
  // Speech state
  isSpeaking: false,
  speechEnabled: true,
  autoSpeakBot: true,
  currentSpeakingMessageId: null,
  isSynthesizing: false,
  synthesisQueue: 0,
  currentAudioElement: null,
  
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

  setKeyboardSoundsEnabled: (enabled) => {
    set({ keyboardSoundsEnabled: enabled });
    // Update the keyboard sounds service
    import('../services/keyboardSounds').then(({ keyboardSounds }) => {
      keyboardSounds.setEnabled(enabled);
    });
  },
  
  // Speech actions
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  
  setSpeechEnabled: (enabled) => set({ speechEnabled: enabled }),
  
  setAutoSpeakBot: (enabled) => set({ autoSpeakBot: enabled }),
  
  setCurrentSpeakingMessageId: (id) => set({ currentSpeakingMessageId: id }),
  
  setIsSynthesizing: (synthesizing) => set({ isSynthesizing: synthesizing }),
  
  setSynthesisQueue: (count) => set({ synthesisQueue: count }),
  
  setCurrentAudioElement: (element) => set({ currentAudioElement: element }),
  
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
      setIsSynthesizing(true); // Brief synthesis phase
      
      const personality = message.personality || currentPersonality;
      
      // Remove emojis from text before speaking
      const textToSpeak = removeEmojis(message.text);
      
      await voiceManager.speak(textToSpeak, personality, {
        onStart: () => {
          // Synthesis complete, playback starting
          setIsSynthesizing(false);
          setIsSpeaking(true);
          // Track the current audio element for lip sync
          const currentAudio = voiceManager.getCurrentAudio();
          set({ currentAudioElement: currentAudio });
        },
        onEnd: () => {
          // Playback finished
          setIsSpeaking(false);
          setCurrentSpeakingMessageId(null);
          set({ currentAudioElement: null });
        },
        onError: (error) => {
          console.error('Speech synthesis error:', error);
          setIsSynthesizing(false);
          setIsSpeaking(false);
          setCurrentSpeakingMessageId(null);
          set({ currentAudioElement: null });
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
  sendMessage: async (text) => {
    const { 
      addMessage, 
      setIsTyping, 
      setIsSynthesizing,
      currentPersonality, 
      mood,
      messages,
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
    
    try {
      // Prepare API request
      const agentRequest: AgentRequest = {
        message: text,
        personality: currentPersonality,
        mood,
        sessionId: get().sessionId,
        userId: undefined // Set this if you have user authentication
      };
      
      // Call agent API
      const response = await agentService.sendMessage(agentRequest);
      console.log('##################');
      console.log('Agent response:', response);
      console.log('##################');
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'bot',
        timestamp: new Date(),
        personality: currentPersonality
      };
      
      // Simulate realistic typing duration
      const typingDuration = Math.min(
        Math.max(1500, response.responseTime || 2000), // Realistic minimum
        4000 // Maximum cap
      );
      
      setTimeout(() => {
        // For avatar mode, don't add bot message to chat - just speak it
        setIsTyping(false);
        
        // Start speech immediately for avatar mode
        if (autoSpeakBot) {
          setTimeout(() => {
            speakMessage(botMessage);
          }, 300); // Small delay for smooth transition
        }
      }, typingDuration);
      
    } catch (error) {
      console.error('Agent API error:', error);
      setIsTyping(false);
      
      // Fallback to old mock response system
      const fallbackResponse = getBotResponse(text, currentPersonality);
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackResponse,
        sender: 'bot',
        timestamp: new Date(),
        personality: currentPersonality
      };
      
      setTimeout(() => {
        // For avatar mode, don't add fallback message to chat - just speak it
        if (autoSpeakBot) {
          setTimeout(() => {
            speakMessage(fallbackMessage);
          }, 300);
        }
      }, 2000);
    }
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
    
    // For avatar mode, don't add switch message to chat - just speak it
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
    sleepy: "Sleepy mode activated... 😴 Let's make some chill, dreamy content... zzz... 🌙",
    funfact: "Fun fact mode! Activated!",
  };

  return messages[personality];
};

// Helper function to remove emojis from text before speaking
const removeEmojis = (text: string): string => {
  // Regex to match emoji characters and emoji sequences
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]/gu;
  
  return text.replace(emojiRegex, '').replace(/\s+/g, ' ').trim();
};