import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';

export function useRestaurants({
  lat = 18.5514,
  lng = 73.9352,
  radiusKm = 10,
  cuisine = null,
  minRating = null,
  page = 0,
  size = 12,
}) {
  return useQuery({
    queryKey: ['restaurants', { lat, lng, radiusKm, cuisine, minRating, page, size }],
    queryFn: async () => {
      const params = { lat, lng, radiusKm, page, size };
      if (cuisine) params.cuisine = cuisine;
      if (minRating) params.minRating = minRating;

      const response = await axiosClient.get(ENDPOINTS.CATALOG.RESTAURANTS, { params });
      return response.data;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}
