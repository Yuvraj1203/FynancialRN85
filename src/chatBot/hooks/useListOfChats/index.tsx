import { useEffect } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { EHttpMethods } from '../../common/models/enums/http-methods';
import { GET_LIST_OF_CHATS_URI } from '../../common/consts/urls';
import { IChatInfo } from '../../common/models/interfaces/chat-info';
import { IApiContext, useApi } from '../../contexts/ApiProvider';
import { ISnackbarContext, useSnackbar } from '../../contexts/SnackbarProvider';
import { ESnackbarTypes } from '../../common/models/enums/snackbar-types';

export const QUERY_KEY = 'listOfChats';

const useListOfChats = (): UseQueryResult<IChatInfo[]> => {
  const { apiClient }: IApiContext = useApi();
  const { showSnackbar }: ISnackbarContext = useSnackbar();

  const listOfChatsQuery: UseQueryResult<IChatInfo[]> = useQuery<IChatInfo[]>({
    queryKey: [QUERY_KEY],
    queryFn: () =>
      apiClient<IChatInfo[]>(GET_LIST_OF_CHATS_URI, {
        method: EHttpMethods.Get,
        queryParams: {
          results: 50,
        },
      }),
  });

  useEffect(() => {
    if (listOfChatsQuery.error) {
      showSnackbar(listOfChatsQuery.error.message, ESnackbarTypes.Error);
    }
  }, [listOfChatsQuery.error, showSnackbar]);

  return listOfChatsQuery;
};

export default useListOfChats;
