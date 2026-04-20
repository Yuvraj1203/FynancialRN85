import {useMutation, UseMutationResult} from '@tanstack/react-query';

import {UPLOAD_FILE_TO_CONVERSATION_URI} from '../../common/consts/urls';
import {EHttpMethods} from '../../common/models/enums/http-methods';
import {ESnackbarTypes} from '../../common/models/enums/snackbar-types';
import {IUploadFileToChatPayload} from '../../common/models/interfaces/upload-file-to-chat-payload';
import {IUploadFileToChatResponse} from '../../common/models/interfaces/upload-file-to-chat-response';
import {IApiContext, useApi} from '../../contexts/ApiProvider';
import {ISnackbarContext, useSnackbar} from '../../contexts/SnackbarProvider';

export const MUTATION_KEY = 'uploadFileToConversation';

const useUploadFileToChat = (): UseMutationResult<
  IUploadFileToChatResponse,
  Error,
  IUploadFileToChatPayload
> => {
  const {apiClient}: IApiContext = useApi();
  const {showSnackbar}: ISnackbarContext = useSnackbar();

  return useMutation<
    IUploadFileToChatResponse,
    Error,
    IUploadFileToChatPayload
  >({
    mutationKey: [MUTATION_KEY],
    mutationFn: (payload: IUploadFileToChatPayload) =>
      apiClient<IUploadFileToChatResponse, FormData>(
        UPLOAD_FILE_TO_CONVERSATION_URI,
        {
          method: EHttpMethods.Post,
          body: payload.file,
          pathParams: {
            conversationId: payload.selectedChatId,
          },
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      ),
    onError: (error: Error) =>
      showSnackbar(error.message, ESnackbarTypes.Error),
    onSuccess: () =>
      showSnackbar(
        'The file was uploaded successfully!',
        ESnackbarTypes.Success,
      ),
  });
};

export default useUploadFileToChat;
