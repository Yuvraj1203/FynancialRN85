import {zustandStorage} from '@/App';
import {BadgesModel} from '@/services/models';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

/* zustand state management, different states START */
interface BadgesState {
  badges?: BadgesModel; // value to user detail in different screens
  setBadges: (
    value: BadgesModel | ((prev?: BadgesModel) => BadgesModel),
  ) => void; // call this function to set user detail
  clearAll: () => void;
}
/* zustand state management, different states END */

/* zustand store creation START */
const useBadgesStore = create<BadgesState>()(
  persist(
    (set, get) => ({
      // Getter Setter
      badges: undefined, // default value
      setBadges: value =>
        set({
          badges: typeof value === 'function' ? value(get().badges) : value,
        }),
      clearAll: () => {
        set({badges: undefined});
      },
    }),
    {
      name: 'badgesStorage', // unique name for every store
      storage: createJSONStorage(() => zustandStorage), // local storage
    },
  ),
);
/* zustand store creation END */

export default useBadgesStore;
