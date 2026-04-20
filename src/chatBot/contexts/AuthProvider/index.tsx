import {UseMutationResult} from '@tanstack/react-query';
import React, {
  Context,
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {StyleSheet} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {URL, URLSearchParams} from 'react-native-url-polyfill';
import {WebView} from 'react-native-webview';
import {ChatBotInfo} from '../../chatbotInfo';

import {GET_FYNANCIAL_CODE_URI} from '../../common/consts/urls';
import {ESnackbarTypes} from '../../common/models/enums/snackbar-types';
import {IAuthenticatePayload} from '../../common/models/interfaces/authenticate-payload';
import {IAuthenticateResponse} from '../../common/models/interfaces/authenticate-response';
import ActivityIndicator from '../../components/ActivityIndicator';
import useAuthenticate from '../../hooks/useAuthenticate';
import {
  IChatState,
  useChatStore,
} from '../../storage/zustandStorage/useChatStore';
import {ISnackbarContext, useSnackbar} from '../SnackbarProvider';

export interface IAuthContext {
  accessToken: string | null;
  isLoading: boolean;
  login: () => void;
  refreshAuth: () => Promise<string | null>;
}

const AuthContext: Context<IAuthContext | undefined> = createContext<
  IAuthContext | undefined
>(undefined);

export const AuthProvider: React.FC<PropsWithChildren> = ({
  children,
}: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<
    ((token: string) => void)[]
  >([]);
  const {showSnackbar}: ISnackbarContext = useSnackbar();
  const {accessToken, setAccessToken} = useChatStore((state: IChatState) => ({
    accessToken: state.accessToken,
    setAccessToken: state.setAccessToken,
  }));

  const authenticateMutation: UseMutationResult<
    IAuthenticateResponse,
    Error,
    IAuthenticatePayload
  > = useAuthenticate();

  useEffect(() => {
    console.log('access token:', accessToken);

    if (accessToken) {
      setIsLoading(false);
    } else {
      login();
    }
  }, []);

  const login = useCallback(() => {
    setIsLoading(true);

    const params = new URLSearchParams({
      client_id: ChatBotInfo.CLIENT_ID,
      redirect_uri: ChatBotInfo.REDIRECT_URI,
      response_type: 'code',
      userid: ChatBotInfo.USER_ID,
    });
    console.log('setAuthUrl PARAM ', JSON.stringify(params?.toString()));

    setAuthUrl(GET_FYNANCIAL_CODE_URI + '?' + params.toString());
  }, []);

  const handleWebViewNavigation = (event: any) => {
    if (event.url.startsWith(ChatBotInfo.REDIRECT_URI)) {
      setIsLoading(true);
      const urlParams = new URL(event.url);
      const code = urlParams.searchParams.get('code');
      console.log(
        'handleWebViewNavigation ',
        JSON.stringify(urlParams + 'CODE--' + code),
      );
      if (code) {
        setAuthUrl(null);
        return getAccessToken(code);
      } else {
        setIsLoading(false);
        showSnackbar('No authorization code found', ESnackbarTypes.Error);
      }
    }
  };

  const getAccessToken = async (code: string) => {
    console.log('IN getAccessToken METHOD ------------------------------');
    try {
      const response: IAuthenticateResponse =
        await authenticateMutation.mutateAsync({
          client_id: ChatBotInfo.CLIENT_ID,
          client_secret: ChatBotInfo.CLIENT_SECRET,
          code,
        });
      console.log(
        'IN getAccessToken METHOD Response------------------------------ ',
        JSON.stringify(response),
      );

      setAccessToken(response.access_token);
      setIsLoading(false);

      await Promise.all(
        pendingRequests.map(retry => retry(response.access_token)),
      );
      setPendingRequests([]);
    } catch (error) {
      console.log('Error fetching access token:', error);
      setIsLoading(false);
    }
  };

  const refreshAuth = async (): Promise<string | null> => {
    return new Promise(resolve => {
      setPendingRequests(prev => [
        ...prev,
        async (token: string) => resolve(token),
      ]);
      login();
    });
  };

  if (authenticateMutation.isError && !authUrl && !isLoading) {
    return (
      <SafeAreaView style={styles.centralizedContainer}>
        <Text variant={'bodyLarge'}>Oops, authentication is failed</Text>
        <Button mode={'contained'} onPress={login}>
          Try again
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <AuthContext.Provider value={{accessToken, isLoading, login, refreshAuth}}>
      {authUrl ? (
        <WebView
          source={{uri: authUrl}}
          onNavigationStateChange={handleWebViewNavigation}
          containerStyle={styles.webViewContainer}
        />
      ) : (
        children
      )}
      <ActivityIndicator isLoading={isLoading} />
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  centralizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewContainer: {position: 'absolute', width: 0, height: 0},
  loadingArea: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});

export const useAuth = (): IAuthContext => {
  const context: IAuthContext | undefined = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
