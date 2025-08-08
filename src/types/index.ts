// Chat and Agent Types
export type PersonalityMode = 'default' | 'roast' | 'hype' | 'conspiracy' | 'motivational' | 'sleepy';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  personality?: PersonalityMode;
}

export interface AgentRequest {
  message: string;
  personality: PersonalityMode;
  mood: number;
  userId?: string;
  sessionId?: string;
}

export interface AgentResponse {
  message: string;
  personality: PersonalityMode;
  confidence: number;
  responseTime: number;
  suggestions?: string[];
}

export interface AgentError {
  error: string;
  code: number;
  message: string;
}