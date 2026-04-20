import {zustandStorage} from '@/App';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

/* zustand state management, different states START */
interface AppLanguageState {
  appLanguage: string; // value to access app language in different screens
  changeAppLanguage: (value: string) => void; // call this function to change app language
}
/* zustand state management, different states END */

/* zustand store creation START */
const useAppLanguageStore = create<AppLanguageState>()(
  persist(
    (set, get) => ({
      // Getter Setter
      appLanguage: 'en', // default value
      changeAppLanguage: (value: string) => {
        set({appLanguage: value}); // set value
      },
    }),
    {
      name: 'languageStorage', // unique name for every store
      storage: createJSONStorage(() => zustandStorage), // local storage
    },
  ),
);
/* zustand store creation END */

export default useAppLanguageStore;
