import { useMutation, UseMutationResult } from '@tanstack/react-query';

import { SUBMIT_FEEDBACK_URI } from '../../common/consts/urls';
import { EHttpMethods } from '../../common/models/enums/http-methods';
import { ESnackbarTypes } from '../../common/models/enums/snackbar-types';
import { ISubmitFeedbackResponse } from '../../common/models/interfaces/submit-feedback-response';
import { ISubmitFeedbackPayload } from '../../common/models/interfaces/submit-feedback-payload';
import { IApiContext, useApi } from '../../contexts/ApiProvider';
import { ISnackbarContext, useSnackbar } from '../../contexts/SnackbarProvider';

const MUTATION_KEY = 'submitFeedback';

const useSubmitFeedback = (): UseMutationResult<
  ISubmitFeedbackResponse,
  Error,
  ISubmitFeedbackPayload
> => {
  const { apiClient }: IApiContext = useApi();
  const { showSnackbar }: ISnackbarContext = useSnackbar();

  return useMutation<ISubmitFeedbackResponse, Error, ISubmitFeedbackPayload>({
    mutationKey: [MUTATION_KEY],
    mutationFn: async (payload: ISubmitFeedbackPayload) =>
      apiClient<ISubmitFeedbackResponse>(SUBMIT_FEEDBACK_URI, {
        method: EHttpMethods.Post,
        queryParams: {
          ...payload,
        },
      }),
    onError: (error: Error) => showSnackbar(error.message, ESnackbarTypes.Error),
  });
};

export default useSubmitFeedback;
