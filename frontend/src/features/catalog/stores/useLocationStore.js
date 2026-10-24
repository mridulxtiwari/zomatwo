import { create } from 'zustand';

export const PUNE_NEIGHBORHOODS = [
  { name: 'Kharadi, Pune', area: 'Kharadi', lat: 18.5514, lng: 73.9352 },
  { name: 'Viman Nagar, Pune', area: 'Viman Nagar', lat: 18.5679, lng: 73.9143 },
  { name: 'Koregaon Park, Pune', area: 'Koregaon Park', lat: 18.5362, lng: 73.8940 },
  { name: 'Kalyani Nagar, Pune', area: 'Kalyani Nagar', lat: 18.5463, lng: 73.9033 },
  { name: 'Aundh, Pune', area: 'Aundh', lat: 18.5580, lng: 73.8075 },
];

export const useLocationStore = create((set) => ({
  currentLocation: PUNE_NEIGHBORHOODS[0],
  searchQuery: '',
  setLocation: (loc) => set({ currentLocation: loc }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
