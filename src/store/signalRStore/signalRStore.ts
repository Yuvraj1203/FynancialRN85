import {
  SignalRMessageModel,
  SignalRMessageReadModel,
} from '@/services/models';
import { create } from 'zustand';

/* Zustand Store Interface */
interface SignalRState {
  //sendMessage: (message: SignalRMessageModel) => Promise<void>; // Send message
  isConnected?: boolean;
  setIsConnected: (value?: boolean) => void;

  messageList?: SignalRMessageModel;
  setMessageList: (messageList?: SignalRMessageModel) => void; // Subscribe to message event

  userLogOut?: SignalRMessageModel;
  setUserLogOut: (userLogOut?: SignalRMessageModel) => void; // Subscribe to logout event

  deletedGroup?: SignalRMessageModel;
  setDeletedGroup: (deletedGroup?: SignalRMessageModel) => void; // Subscribe to message event

  userWithUpdatedStatus?: SignalRMessageModel;
  setUserWithUpdatedStatus: (
    userWithUpdatedStatus?: SignalRMessageModel,
  ) => void;

  messageRead?: SignalRMessageReadModel;
  setMessageRead: (userWithUpdatedStatus?: SignalRMessageReadModel) => void;

  notificationType?: string; // Store notification type

  setNotificationType: (value: string) => void; // Update notification type

  logout: () => void;
}

/* Zustand Store */
const useSignalRStore = create<SignalRState>((set, get) => ({
  // Getter Setter
  isConnected: undefined, // default value
  setIsConnected(value) {
    set({ isConnected: value }); // set value
  },

  messageList: undefined, // default value
  setMessageList: (messageList?: SignalRMessageModel) => {
    set({ messageList: messageList }); // set value
  },

  userLogOut: undefined, // default value
  setUserLogOut: (userLogOut?: SignalRMessageModel) => {
    set({ userLogOut: undefined }); // set value
    setTimeout(() => set({ userLogOut: userLogOut }), 0);
  },

  deletedGroup: undefined, // default value
  setDeletedGroup: (deletedGroup?: SignalRMessageModel) => {
    set({ deletedGroup: deletedGroup }); // set value
  },

  userWithUpdatedStatus: undefined,
  setUserWithUpdatedStatus: (userWithUpdatedStatus?: SignalRMessageModel) => {
    set({ userWithUpdatedStatus: userWithUpdatedStatus });
  },

  messageRead: undefined, // default value
  setMessageRead: (value?: SignalRMessageReadModel) => {
    set({ messageRead: value }); // set value
  },

  notificationType: undefined,

  setNotificationType: value => set({ notificationType: value }),

  logout: () => {
    set({
      messageList: undefined,
      userLogOut: undefined,
      userWithUpdatedStatus: undefined,
      messageRead: undefined,
      isConnected: undefined,
      notificationType: undefined,
      deletedGroup: undefined,
    });
  },
}));

export default useSignalRStore;
