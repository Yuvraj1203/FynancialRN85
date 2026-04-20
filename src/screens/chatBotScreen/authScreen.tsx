import TypingText from '@/chatBot/components/TypingText';
import { CustomImage } from '@/components/atoms';
import { SafeScreen } from '@/components/template';
import { ApiConstants } from '@/services/apiConstants';
import {
  HttpMethodApi,
  makeRequestWithoutBaseModel,
} from '@/services/apiInstance';
import { ChatBotAccessTokenModel } from '@/services/models';
import useChatBotAccessTokenStore from '@/store/chatBotAccessTokenStore/chatBotAccessTokenStore';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import { useAppNavigation } from '@/utils/navigationUtils';
import { showSnackbar } from '@/utils/utils';
import { useIsFocused } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

const AuthScreen = () => {
  const navigation = useAppNavigation();

  const { t } = useTranslation();

  const theme = useTheme();

  const styles = makeStyles(theme);

  const isFocused = useIsFocused();

  const [isLoading, setIsLoading] = useState(false);

  const { accesstoken, setAccessToken } = useChatBotAccessTokenStore();

  const params = new URLSearchParams({
    client_id: ApiConstants.ChatBotClientId,
    redirect_uri: ApiConstants.ChatBotRedirectUri,
    response_type: 'code',
    userid: ApiConstants.ChatBotUserId,
  });

  const [authUrl, setAuthUrl] = useState<string>();

  // Prevents onNavigationStateChange from exchanging the code twice.
  // The callback fires for both the start and end of the redirect navigation.
  const hasExchangedCodeRef = useRef(false);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    init();
  }, [isFocused]);

  const init = () => {
    Log('Chatbot access token:' + accesstoken?.access_token);

    if (accesstoken) {
      setIsLoading(false);

      navigation.navigate('DrawerRoutes', {
        screen: 'BottomBarRoutes',
        params: {
          screen: 'ChatBotRoutes',
          params: {
            screen: 'ChatBotScreen',
          },
        },
      });
    } else {
      login();
    }
  };

  const login = () => {
    hasExchangedCodeRef.current = false; // reset for a fresh login attempt
    setAuthUrl(undefined);
    setTimeout(() => {
      setAuthUrl(ApiConstants.GetFynancialCode + '?' + params.toString());
    }, 100);
  };

  const handleWebViewNavigation = (event: any) => {
    if (event.url.startsWith(ApiConstants.ChatBotRedirectUri)) {
      // Guard: onNavigationStateChange fires twice for the same redirect URL
      // (once when loading starts, once when it finishes). The auth code is
      // single-use, so only exchange it on the first call.
      if (hasExchangedCodeRef.current) return;

      setIsLoading(true);
      const urlParams = new URL(event.url);
      const code = urlParams.searchParams.get('code');
      Log('authCode=>' + code);
      if (code) {
        hasExchangedCodeRef.current = true;
        setAuthUrl(undefined);
        const formData = new FormData();
        formData.append('client_id', ApiConstants.ChatBotClientId);
        formData.append('client_secret', ApiConstants.ChatBotClientSecret);
        formData.append('code', code);
        getAccessToken.mutate(formData);
      } else {
        setIsLoading(false);
        showSnackbar('No authorization code found', 'danger');
      }
    }
  };

  const getAccessToken = useMutation({
    mutationFn: (sendData: FormData) => {
      return makeRequestWithoutBaseModel<ChatBotAccessTokenModel>({
        customBaseUrl: ApiConstants.ChatBotBaseUrl,
        endpoint: ApiConstants.ChatBotAccessToken,
        method: HttpMethodApi.Post,
        data: sendData,
      });
    },
    onSettled(data, error, variables, onMutateResult, context) {
      setIsLoading(false);
    },
    onSuccess(data, variables, context) {
      setAccessToken(data);
      navigation.navigate('DrawerRoutes', {
        screen: 'BottomBarRoutes',
        params: {
          screen: 'ChatBotRoutes',
          params: {
            screen: 'ChatBotScreen',
          },
        },
      });
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
      setAccessToken(undefined);
    },
  });

  return (
    <SafeScreen bottom={false}>
      <View style={styles.main}>
        {authUrl && (
          <WebView
            source={{ uri: authUrl }}
            onNavigationStateChange={handleWebViewNavigation}
            containerStyle={styles.webViewContainer}
          />
        )}
        <View style={styles.emptyLay}>
          <CustomImage
            source={theme.dark ? Images.FynAIDark : Images.FynAILight}
            style={{ height: 100, width: 100 }}
          />
          <TypingText
            mode="typing"
            text={t('FynAI')}
            speed={100}
            style={styles.emptyChatText}
          />
        </View>
      </View>
    </SafeScreen>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    webViewContainer: { position: 'absolute', width: 0, height: 0 },
    emptyChatText: {
      marginTop: 8,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    emptyLay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default AuthScreen;
