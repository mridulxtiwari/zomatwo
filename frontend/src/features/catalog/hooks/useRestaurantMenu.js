import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';

export function useRestaurantMenu(restaurantId) {
  return useQuery({
    queryKey: ['restaurant-menu', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      const response = await axiosClient.get(ENDPOINTS.CATALOG.RESTAURANT_BY_ID(restaurantId));
      return response.data;
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
