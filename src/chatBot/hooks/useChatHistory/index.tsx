import { useEffect } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { IApiContext, useApi } from '../../contexts/ApiProvider';
import { EHttpMethods } from '../../common/models/enums/http-methods';
import { GET_CHAT_HISTORY_URI } from '../../common/consts/urls';
import { IChatHistory } from '../../common/models/interfaces/chat-history';
import { IChatState, useChatStore } from '../../storage/zustandStorage/useChatStore';
import { ISnackbarContext, useSnackbar } from '../../contexts/SnackbarProvider';
import { ESnackbarTypes } from '../../common/models/enums/snackbar-types';

export const QUERY_KEY = 'chatHistory';

const useChatHistory = (): UseQueryResult<IChatHistory, Error> => {
  const { apiClient }: IApiContext = useApi();
  const { selectedChat } = useChatStore((state: IChatState) => ({
    selectedChat: state.selectedChat,
  }));
  const { showSnackbar }: ISnackbarContext = useSnackbar();

  const chatHistoryQuery: UseQueryResult<IChatHistory, Error> = useQuery<IChatHistory, Error>({
    queryKey: [QUERY_KEY, selectedChat],
    queryFn: () =>
      apiClient<IChatHistory>(GET_CHAT_HISTORY_URI, {
        method: EHttpMethods.Get,
        pathParams: {
          conversationId: selectedChat!,
        },
      }),
    enabled: !!selectedChat,
    staleTime: 0,
  });

  useEffect(() => {
    if (chatHistoryQuery.error) {
      showSnackbar(chatHistoryQuery.error.message, ESnackbarTypes.Error);
    }
  }, [chatHistoryQuery.error, showSnackbar]);

  return chatHistoryQuery;
};

export default useChatHistory;
