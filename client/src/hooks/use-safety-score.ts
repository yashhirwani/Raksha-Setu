import { useQuery } from '@tanstack/react-query';
import type { TouristSafetyScore } from '@shared/schema';

export function useSafetyScore(touristId: string | undefined) {
  return useQuery<TouristSafetyScore | null>({
    queryKey: ['safety-score', touristId],
    enabled: !!touristId,
    queryFn: async () => {
      if (!touristId) return null;
      const res = await fetch(`/api/tourists/${touristId}/safety-score`);
      if (!res.ok) throw new Error('Failed to load safety score');
      return res.json();
    },
    staleTime: 60_000,
  });
}
