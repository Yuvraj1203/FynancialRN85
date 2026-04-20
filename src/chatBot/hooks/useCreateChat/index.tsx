import { useMutation, UseMutationResult } from '@tanstack/react-query';

import { CREATE_CHAT_URI } from '../../common/consts/urls';
import { EHttpMethods } from '../../common/models/enums/http-methods';
import { ICreateChatResponse } from '../../common/models/interfaces/create-chat-response';
import { ICreateChatPayload } from '../../common/models/interfaces/create-chat-payload';
import { IApiContext, useApi } from '../../contexts/ApiProvider';
import { ISnackbarContext, useSnackbar } from '../../contexts/SnackbarProvider';
import { ESnackbarTypes } from '../../common/models/enums/snackbar-types';

export const MUTATION_KEY = 'createChat';

const useCreateChat = (): UseMutationResult<ICreateChatResponse, Error, ICreateChatPayload> => {
  const { apiClient }: IApiContext = useApi();
  const { showSnackbar }: ISnackbarContext = useSnackbar();

  return useMutation<ICreateChatResponse, Error, ICreateChatPayload>({
    mutationKey: [MUTATION_KEY],
    mutationFn: (payload: ICreateChatPayload) =>
      apiClient<ICreateChatResponse>(CREATE_CHAT_URI, {
        method: EHttpMethods.Post,
        body: payload,
      }),
    onError: (error: Error) => showSnackbar(error.message, ESnackbarTypes.Error),
  });
};

export default useCreateChat;
