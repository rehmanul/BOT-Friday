import { useQuery } from '@tanstack/react-query';

export function useAIModels() {
  return useQuery({
    queryKey: ['/api/ai/models'],
    queryFn: async () => {
      const response = await fetch('/api/ai/models');
      if (!response.ok) throw new Error('Failed to fetch AI models');
      return response.json();
    },
  });
}
