import { persist, createJSONStorage } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

import { zustandStorage } from './zustandStorage';
import { IChatHistoryMessage } from '../../common/models/interfaces/chat-history';

export interface IChatState {
  accessToken: string | null;
  selectedAgent: string | null;
  selectedChat: string | null;
  chatMessages: IChatHistoryMessage[];
  setSelectedAgent: (selectedAgent: string | null) => void;
  setAccessToken: (accessToken: string) => void;
  setSelectedChat: (selectedChat: string | null) => void;
  addChatMessage: (message: IChatHistoryMessage) => void;
  updateChatMessage: (message: Partial<IChatHistoryMessage>) => void;
  syncChatMessages: (chatMessages: IChatHistoryMessage[]) => void;
}

const useStore = createWithEqualityFn<IChatState>()(
  persist(
    set => ({
      accessToken: null,
      selectedAgent: null,
      selectedChat: null,
      chatMessages: [],
      setSelectedAgent: (selectedAgent: string | null) => set({ selectedAgent }),
      setAccessToken: (accessToken: string) => set({ accessToken }),
      setSelectedChat: (selectedChat: string | null) => set({ selectedChat }),
      addChatMessage: (message: IChatHistoryMessage) =>
        set((state: IChatState) => ({ chatMessages: [...state.chatMessages, message] })),
      updateChatMessage: (updates: Partial<IChatHistoryMessage>) =>
        set((state: IChatState) => ({
          chatMessages: state.chatMessages.map((message: IChatHistoryMessage) =>
            message.id === updates.id ? { ...message, ...updates } : message,
          ),
        })),
      syncChatMessages: (chatMessages: IChatHistoryMessage[]) => set({ chatMessages }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

export const useChatStore = <T>(selector: (state: IChatState) => T): T => {
  return useStore(selector, shallow);
};
