import {useQuery, UseQueryResult} from '@tanstack/react-query';
import {useEffect} from 'react';

import {GET_LIST_OF_AGENTS_URI} from '../../common/consts/urls';
import {EHttpMethods} from '../../common/models/enums/http-methods';
import {ESnackbarTypes} from '../../common/models/enums/snackbar-types';
import {IAgentInfo} from '../../common/models/interfaces/agent-info';
import {IApiContext, useApi} from '../../contexts/ApiProvider';
import {ISnackbarContext, useSnackbar} from '../../contexts/SnackbarProvider';

export const QUERY_KEY = 'listOfAgents';

const useListOfAgents = (): UseQueryResult<IAgentInfo[]> => {
  const {apiClient}: IApiContext = useApi();
  const {showSnackbar}: ISnackbarContext = useSnackbar();

  const listOfAgentsQuery: UseQueryResult<IAgentInfo[]> = useQuery<
    IAgentInfo[]
  >({
    queryKey: [QUERY_KEY],
    queryFn: () =>
      apiClient<IAgentInfo[]>(GET_LIST_OF_AGENTS_URI, {
        method: EHttpMethods.Get,
      }),
    refetchInterval: 10 * 60 * 10000, // 10 minutes
  });

  useEffect(() => {
    if (listOfAgentsQuery.error) {
      showSnackbar(listOfAgentsQuery.error.message, ESnackbarTypes.Error);
    }
  }, [listOfAgentsQuery.error, showSnackbar]);

  return listOfAgentsQuery;
};

export default useListOfAgents;
