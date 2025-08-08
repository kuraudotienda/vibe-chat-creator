import { AgentRequest, AgentResponse } from '../types';

class AgentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8000/api';
  }

  async sendMessage(request: AgentRequest): Promise<AgentResponse> {
    // Build URL with sessionId query parameter if provided
    const url = new URL(`${this.baseUrl}/agent/chat`);
    if (request.sessionId) {
      url.searchParams.set('sessionId', request.sessionId);
    }
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: request.message,
        personality: request.personality,
        mood: request.mood,
        userId: request.userId, // Match backend property name
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    console.log('Agent response received:', response);

    return response.json();
  }

}

export const agentService = new AgentService();