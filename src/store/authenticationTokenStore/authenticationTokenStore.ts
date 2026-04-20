import { zustandStorage } from '@/App';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/* zustand state management, different states START */
interface Aauth0TokenState {
  auth0Type?: string;
  setAuth0Type: (value?: string) => void;
  isLoggedIn?: boolean;
  setIsLoggedIn: (value?: boolean) => void; // call this function to set isLoggedIn value
  clearAll: () => void;
}
/* zustand state management, different states END */

/* zustand store creation START */
const useAccessTokenStore = create<Aauth0TokenState>()(
  persist(
    (set, get) => ({
      // Getter Setter
      auth0Type: undefined, // default value
      setAuth0Type: (value?: string) => {
        set({ auth0Type: value }); // set value
      },
      isLoggedIn: undefined, // default value
      setIsLoggedIn: (value?: boolean) => {
        set({ isLoggedIn: value }); // set value
      },
      clearAll() {
        set({
          auth0Type: undefined,
        });
      },
    }),
    {
      name: 'auth0TokenStorage', // unique name for every store
      storage: createJSONStorage(() => zustandStorage), // local storage
      version: 2, // ⬅️ bump this when you add fields
      migrate: (persistedState: any, version) => {
        const state = persistedState as Aauth0TokenState;
        if (version < 2) {
          return {
            ...state,
            isLoggedIn: state?.isLoggedIn ?? undefined,
          };
        }
        return state;
      },
    },
  ),
);
/* zustand store creation END */

export default useAccessTokenStore;
