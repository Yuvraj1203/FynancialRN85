import { ChatBotAccessTokenModel } from '@/services/models';
import { create } from 'zustand';

interface ChatBotAccessTokenState {
  accesstoken?: ChatBotAccessTokenModel;
  setAccessToken: (
    value:
      | ChatBotAccessTokenModel
      | ((prev?: ChatBotAccessTokenModel) => ChatBotAccessTokenModel)
      | undefined,
  ) => void; // call this function to set user detail
  clearAll: () => void;
}

const useChatBotAccessTokenStore = create<ChatBotAccessTokenState>()(
  (set, get) => ({
    accesstoken: undefined,
    setAccessToken: value =>
      set({
        accesstoken:
          typeof value === 'function' ? value(get().accesstoken) : value,
      }),
    clearAll: () => {
      set({ accesstoken: undefined });
    },
  }),
);

export default useChatBotAccessTokenStore;
