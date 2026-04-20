import { zustandStorage } from '@/App';
import { UserChatMessageItem } from '@/services/models/getUserChatMessagesModel/getUserChatMessagesModel';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FailedMessageStore {
  failedMessages: Record<number, UserChatMessageItem[]>; // keyed by targetUserId
  addFailedMessage: (
    targetUserId: number,
    message: UserChatMessageItem,
  ) => void;
  clearFailedMessagesForUser: (targetUserId: number) => void;
  removeFailedMessage: (targetUserId: number, messageId: string) => void;
  getFailedMessagesForUser: (targetUserId: number) => UserChatMessageItem[];

  clearAll: () => void;
}

const useFailedMessageStore = create<FailedMessageStore>()(
  persist(
    (set, get) => ({
      failedMessages: {},

      addFailedMessage: (targetUserId, message) => {
        const existing = get().failedMessages[targetUserId] || [];
        set({
          failedMessages: {
            ...get().failedMessages,
            [targetUserId]: [message, ...existing],
          },
        });
      },

      clearFailedMessagesForUser: targetUserId => {
        const { [targetUserId]: removed, ...rest } = get().failedMessages;
        set({ failedMessages: rest });
      },

      removeFailedMessage: (targetUserId, messageId) => {
        const current = get().failedMessages[targetUserId] || [];
        const updated = current.filter(msg => msg.id !== messageId);
        set({
          failedMessages: {
            ...get().failedMessages,
            [targetUserId]: updated,
          },
        });
      },

      getFailedMessagesForUser: targetUserId => {
        return get().failedMessages[targetUserId] || [];
      },

      clearAll: () => {
        set({ failedMessages: {} });
      },
    }),
    {
      name: 'failedMessageStorage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

export default useFailedMessageStore;
