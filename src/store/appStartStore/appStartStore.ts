import {NotificationModel} from '@/services/models';
import signalRService from '@/services/signalRService';
import {create} from 'zustand';

/* zustand state management, different states START */
interface AppStartState {
  appStartedFromNotification?: boolean; // value to show app started successfully and all api calls are done
  setAppStartedFromNotification: (value: boolean) => void; // call this function to set app started value

  // value to open screen related to notification
  openedNotificationData?: NotificationModel;
  // call this function to set notification Data
  setOpenedNotificationData: (value?: NotificationModel) => void;

  clearAll: () => void;
}
/* zustand state management, different states END */

/* zustand store creation START */
const useAppStartStore = create<AppStartState>()((set, get) => ({
  // Getter Setter
  appStartedFromNotification: undefined, // default value
  setAppStartedFromNotification: (value: boolean) => {
    set({appStartedFromNotification: value}); // set value
    signalRService.start();
  },

  openedNotificationData: undefined, // default value
  setOpenedNotificationData: (value?: NotificationModel) => {
    set({openedNotificationData: value}); // set value
  },

  clearAll() {
    set({
      appStartedFromNotification: undefined,
      openedNotificationData: undefined,
    });
    signalRService.stop();
  },
}));
/* zustand store creation END */

export default useAppStartStore;
