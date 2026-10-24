import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      restaurant: null, // { id, name, area, imageUrl, deliveryFee }
      items: [], // [{ id, name, price, isVeg, quantity, imageUrl }]
      conflictModalOpen: false,
      pendingRestaurant: null,
      pendingItem: null,

      addItem: (restaurant, item) => {
        const { restaurant: currentRestaurant, items } = get();

        // Single Restaurant Guard Check
        if (items.length > 0 && currentRestaurant && currentRestaurant.id !== restaurant.id) {
          set({
            conflictModalOpen: true,
            pendingRestaurant: restaurant,
            pendingItem: item,
          });
          return;
        }

        // Add or increment item
        const existingIndex = items.findIndex((i) => i.id === item.id);
        let updatedItems;

        if (existingIndex > -1) {
          updatedItems = items.map((i, idx) =>
            idx === existingIndex ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          updatedItems = [...items, { ...item, quantity: 1 }];
        }

        set({
          restaurant: {
            id: restaurant?.id || currentRestaurant?.id || 101,
            name: restaurant?.name || currentRestaurant?.name || 'Restaurant',
            area: restaurant?.area || restaurant?.city || currentRestaurant?.area || 'Kharadi, Pune',
            imageUrl: restaurant?.imageUrl || currentRestaurant?.imageUrl,
            deliveryFee: restaurant?.deliveryFee || 35,
          },
          items: updatedItems,
        });
      },

      incrementItem: (itemId) => {
        const { items } = get();
        const updatedItems = items.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
        );
        set({ items: updatedItems });
      },

      decrementItem: (itemId) => {
        const { items } = get();
        const target = items.find((i) => i.id === itemId);
        if (!target) return;

        if (target.quantity <= 1) {
          const updatedItems = items.filter((i) => i.id !== itemId);
          set({
            items: updatedItems,
            restaurant: updatedItems.length === 0 ? null : get().restaurant,
          });
        } else {
          const updatedItems = items.map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
          );
          set({ items: updatedItems });
        }
      },

      removeItem: (itemId) => {
        const { items } = get();
        const updatedItems = items.filter((i) => i.id !== itemId);
        set({
          items: updatedItems,
          restaurant: updatedItems.length === 0 ? null : get().restaurant,
        });
      },

      clearCart: () => {
        set({
          restaurant: null,
          items: [],
          conflictModalOpen: false,
          pendingRestaurant: null,
          pendingItem: null,
        });
      },

      confirmReplaceCart: () => {
        const { pendingRestaurant, pendingItem } = get();
        if (pendingRestaurant && pendingItem) {
          set({
            restaurant: {
              id: pendingRestaurant.id,
              name: pendingRestaurant.name,
              area: pendingRestaurant.area || 'Pune',
              imageUrl: pendingRestaurant.imageUrl,
              deliveryFee: pendingRestaurant.deliveryFee || 35,
            },
            items: [{ ...pendingItem, quantity: 1 }],
            conflictModalOpen: false,
            pendingRestaurant: null,
            pendingItem: null,
          });
        }
      },

      cancelReplaceCart: () => {
        set({
          conflictModalOpen: false,
          pendingRestaurant: null,
          pendingItem: null,
        });
      },

      getItemQuantity: (itemId) => {
        const { items } = get();
        const found = items.find((i) => i.id === itemId);
        return found ? found.quantity : 0;
      },

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
      },

      getTotalItemsCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'zomatwo_cart_storage',
      partialize: (state) => ({
        restaurant: state.restaurant,
        items: state.items,
      }),
    }
  )
);
