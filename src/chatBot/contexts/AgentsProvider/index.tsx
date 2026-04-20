import {UseQueryResult} from '@tanstack/react-query';
import React, {
  Context,
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
} from 'react';

import {IAgentInfo} from '../../common/models/interfaces/agent-info';
import useListOfAgents from '../../hooks/useListOfAgents';

export interface IAgentsContext {
  listOfAgentsQuery: UseQueryResult<IAgentInfo[]>;
}

const AgentsContext: Context<IAgentsContext | undefined> = createContext<
  IAgentsContext | undefined
>(undefined);

export const AgentsProvider: React.FC<PropsWithChildren> = ({
  children,
}: PropsWithChildren) => {
  const listOfAgentsQuery: UseQueryResult<IAgentInfo[]> = useListOfAgents();

  const values: IAgentsContext = useMemo(
    () => ({listOfAgentsQuery}),
    [
      listOfAgentsQuery.data,
      listOfAgentsQuery.isLoading,
      listOfAgentsQuery.isFetching,
    ],
  );

  return (
    <AgentsContext.Provider value={values}>{children}</AgentsContext.Provider>
  );
};

export const useAgents = (): IAgentsContext => {
  const context: IAgentsContext | undefined = useContext(AgentsContext);
  if (!context) {
    throw new Error('useAgents must be used within an AgentsProvider');
  }
  return context;
};
