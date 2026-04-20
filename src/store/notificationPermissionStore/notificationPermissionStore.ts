import { zustandStorage } from '@/App';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/* ? zustand state management, different states START */
interface notificationPermissionState {
  askPermission?: boolean; // value to check for notification permission
  setAskPermission: (show?: boolean) => void; // call this function to check notification permission

  lastReminderDate?: string; // To store the last reminder date
  setLastReminderDate: (date: string) => void; // Set last reminder date

  notificationsList: FirebaseMessagingTypes.RemoteMessage[];
  setNotificationsList: (
    value:
      | FirebaseMessagingTypes.RemoteMessage[]
      | ((
          prev: FirebaseMessagingTypes.RemoteMessage[],
        ) => FirebaseMessagingTypes.RemoteMessage[]),
  ) => void;

  clearAll: () => void;
}
/* zustand state management, different states END */

/* zustand store creation START */
const useNotificationPermissionStore = create<notificationPermissionState>()(
  persist(
    (set, get) => ({
      // Getter Setter
      askPermission: undefined, // default value
      setAskPermission: (value?: boolean) => {
        set({ askPermission: value }); // set value
      },

      // Getter Setter
      lastReminderDate: undefined, // default value
      setLastReminderDate: (value?: string) => {
        set({ lastReminderDate: value }); // set value
      },
      notificationsList: [],
      setNotificationsList: value => {
        set({
          notificationsList:
            typeof value === 'function'
              ? value(get().notificationsList)
              : value,
        });
      },

      clearAll: () => {
        set({
          askPermission: undefined,
          lastReminderDate: undefined,
          notificationsList: [],
        });
      },
    }),
    {
      name: 'notificationPermissionStorage', // unique name for every store
      storage: createJSONStorage(() => zustandStorage), // local storage
    },
  ),
);
/* zustand store creation END */

export default useNotificationPermissionStore;
