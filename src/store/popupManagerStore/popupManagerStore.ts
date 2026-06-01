import { create } from 'zustand';

type PopupDismisser = () => void;

interface PopupManagerState {
  popups: Map<string, PopupDismisser>;
  registerPopup: (id: string, dismisser: PopupDismisser) => void;
  unregisterPopup: (id: string) => void;
  dismissAllPopups: () => void;
  getPopupCount: () => number;
}

export const usePopupManagerStore = create<PopupManagerState>((set, get) => ({
  popups: new Map(),

  registerPopup: (id: string, dismisser: PopupDismisser) => {
    set(state => {
      const newMap = new Map(state.popups);
      newMap.set(id, dismisser);
      return { popups: newMap };
    });
  },

  unregisterPopup: (id: string) => {
    set(state => {
      const newMap = new Map(state.popups);
      newMap.delete(id);
      return { popups: newMap };
    });
  },

  dismissAllPopups: () => {
    const state = get();
    // Call all dismissers in reverse order (LIFO - Last In First Out)
    // This ensures nested popups are dismissed from top to bottom
    const dismissers = Array.from(state.popups.values()).reverse();
    dismissers.forEach(dismisser => {
      try {
        dismisser();
      } catch (error) {
        console.error('Error dismissing popup:', error);
      }
    });
    // Clear all popups after dismissing
    set({ popups: new Map() });
  },

  getPopupCount: () => {
    return get().popups.size;
  },
}));
