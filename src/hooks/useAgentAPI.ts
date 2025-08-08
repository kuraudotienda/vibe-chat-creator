import { useMutation, useQuery } from '@tanstack/react-query';
import { agentService } from '../services/agentService';
import { AgentRequest, AgentResponse, PersonalityMode } from '../types';

export const useAgentChat = () => {
  return useMutation<AgentResponse, Error, AgentRequest>({
    mutationFn: (request: AgentRequest) => agentService.sendMessage(request),
    onError: (error) => {
      console.error('Agent API error:', error);
    }
  });
};

