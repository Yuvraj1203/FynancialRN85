import {useMutation, UseMutationResult} from '@tanstack/react-query';
import {URLSearchParams} from 'react-native-url-polyfill';

import {FYNANCIAL_AUTHENTICATE_URI} from '../../common/consts/urls';
import {EHttpMethods} from '../../common/models/enums/http-methods';
import {ESnackbarTypes} from '../../common/models/enums/snackbar-types';
import {IAuthenticatePayload} from '../../common/models/interfaces/authenticate-payload';
import {IAuthenticateResponse} from '../../common/models/interfaces/authenticate-response';
import {ISnackbarContext, useSnackbar} from '../../contexts/SnackbarProvider';

const MUTATION_KEY = 'authenticate';

const useAuthenticate = (): UseMutationResult<
  IAuthenticateResponse,
  Error,
  IAuthenticatePayload
> => {
  const {showSnackbar}: ISnackbarContext = useSnackbar();

  return useMutation({
    mutationKey: [MUTATION_KEY],
    mutationFn: async (payload: IAuthenticatePayload) => {
      const response: Response = await fetch(FYNANCIAL_AUTHENTICATE_URI, {
        method: EHttpMethods.Post,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({...payload}).toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      return response.json();
    },
    onError: (error: Error) =>
      showSnackbar(error.message, ESnackbarTypes.Error),
  });
};

export default useAuthenticate;
