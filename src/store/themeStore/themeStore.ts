import { zustandStorage } from '@/App';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export enum ThemeVariants {
  light = 'light',
  dark = 'dark',
  system = 'system',
}
/* zustand state management, different states START */
interface AppThemeState {
  AppTheme: ThemeVariants; // app theme for whole app
  changeAppTheme: (value?: ThemeVariants) => void; // call this function to change app theme
}
/* zustand state management, different states END */

/* zustand store creation START */
const useAppThemeStore = create<AppThemeState>()(
  persist(
    (set, get) => ({
      // Getter Setter
      AppTheme: ThemeVariants.light, // default value
      changeAppTheme: (value?: ThemeVariants) => {
        set({ AppTheme: value }); // set value
      },
    }),
    {
      name: 'themeStorage', // unique name for every store
      storage: createJSONStorage(() => zustandStorage), // local storage
    },
  ),
);
/* zustand store creation END */

export default useAppThemeStore;
