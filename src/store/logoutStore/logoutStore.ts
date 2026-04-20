import {create} from 'zustand';

/* zustand state management, different states START */
type AppLogoutStore = {
  isLoggingOut: boolean;
  setIsLoggingOut: (value: boolean) => void;
};
/* zustand state management, different states END */

/* zustand store creation START */
const useLogoutStore = create<AppLogoutStore>()((set, get) => ({
  // Getter Setter
  isLoggingOut: false, // default value
  setIsLoggingOut: (value: boolean) => {
    set({isLoggingOut: value}); // set value
  },
}));
/* zustand store creation END */

export default useLogoutStore;
