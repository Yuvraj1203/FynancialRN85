import {zustandStorage} from '@/App';
import {GetUserDetailForProfileModel} from '@/services/models/getUserDetailForProfileModel/getUserDetailForProfileModel';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

/* zustand state management, different states START */
interface UserState {
  userDetails?: GetUserDetailForProfileModel; // value to user detail in different screens
  setUserDetails: (
    value:
      | GetUserDetailForProfileModel
      | ((prev?: GetUserDetailForProfileModel) => GetUserDetailForProfileModel),
  ) => void; // call this function to set user detail
  clearAll: () => void;
}
/* zustand state management, different states END */

/* zustand store creation START */
const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Getter Setter
      userDetails: undefined, // default value
      setUserDetails: value =>
        set({
          userDetails:
            typeof value === 'function' ? value(get().userDetails) : value,
        }),
      clearAll: () => {
        set({userDetails: undefined});
      },
    }),
    {
      name: 'userStorage', // unique name for every store
      storage: createJSONStorage(() => zustandStorage), // local storage
    },
  ),
);
/* zustand store creation END */

export default useUserStore;
