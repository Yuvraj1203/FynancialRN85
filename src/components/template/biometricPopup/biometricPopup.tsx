import { storage } from '@/App';
import { navigateFromApi } from '@/navigators/applicationNavigator';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  AuthenticateViaAuth0Model,
  GetUserDetailForProfileModel,
  LoginWith,
  UpdateLastSignInForUserModel,
  UserRoleEnum,
} from '@/services/models';
import {
  authenticationTokenStore,
  biometricStore,
  useLogoutStore,
  userStore,
} from '@/store';
import { UserBiometricOption } from '@/store/biometricStore/biometricStore';
import useSignalRStore from '@/store/signalRStore/signalRStore';
import { TenantInfo } from '@/tenantInfo';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { checkBiometric } from '@/utils/biometricUtils';
import {
  getAccessTokenFromKeychain,
  saveAccessTokenInKeychain,
} from '@/utils/keychainUtils';
import Log from '@/utils/logger';
import {
  parseRouteToDynamicReset,
  useAppNavigation,
} from '@/utils/navigationUtils';
import {
  checkIntervalTime,
  internetReachable,
  loginScreenOpened,
  triggerSentry,
  useLogout,
} from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet } from 'react-native';
import {
  Credentials,
  useAuth0,
  WebAuthorizeParameters,
} from 'react-native-auth0';
import { sessionExpireTime, sessionService } from './sessionService';

/**
 * Added by @Tarun 05-02-2025 -> Biometric Authentication popup and session out popup (FYN-4204)
 */
function BiometricPopup() {
  /** Added by @Tarun 05-02-2025 -> navigate to different screen (FYN-4204) */
  const navigation = useAppNavigation();

  /** Added by @Tarun 05-02-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4204) */
  const theme = useTheme();

  /** Added by @Tarun 05-02-2025 -> access StylesSheet with theme implemented (FYN-4204) */
  const styles = makeStyles(theme);

  /** Added by @Tarun 05-02-2025 -> translations for labels (FYN-4204) */
  const { t } = useTranslation();

  /** Added by @Tarun 05-02-2025 -> logout user if any api fails (FYN-4204) */
  const { logout } = useLogout();

  const {
    pseudoLogout,
    authenticated,
    authenticatedFromSplash,
    fromSplashWithFaceIdEnabled,
    showBiometricPopup,
    sessionOutPopup,
    userBiometricEnabled,
    setBiometricLoading,
    setBiometricCompleted,
    setShowBiometricBgPopup,
  } = biometricStore();

  const setApiLoading = biometricStore(state => state.setApiLoading);

  const setShowBiometricPopup = biometricStore(
    state => state.setShowBiometricPopup,
  );

  const setAuthenticatedFromSplash = biometricStore(
    state => state.setAuthenticatedFromSplash,
  );

  const setFromSplashWithFaceIdEnabled = biometricStore(
    state => state.setFromSplashWithFaceIdEnabled,
  );

  const setPseudoLogout = biometricStore(state => state.setPseudoLogout);

  const userDetails = userStore(state => state.userDetails);

  const setUserDetails = userStore(state => state.setUserDetails);

  const isLoggingOut = useLogoutStore(state => state.isLoggingOut);

  const makeLoggingOut = useSignalRStore(state => state.userLogOut); // signal R force logout state
  const setUserLogOut = useSignalRStore(state => state.setUserLogOut);

  const setIsLoggingOut = useLogoutStore(state => state.setIsLoggingOut);

  const { getCredentials, authorize, cancelWebAuth } = useAuth0(); // Auth0 authentication

  useEffect(() => {
    if (pseudoLogout) {
      setPseudoLogout(false);
      logout({ noNavigation: true });
    }
  }, [pseudoLogout]);

  useEffect(() => {
    // Check if logout has already been executed to prevent multiple logout calls
    if (makeLoggingOut?.userId == userStore.getState().userDetails?.userID) {
      setUserLogOut(undefined); // Reset the SignalR logout state to prevent multiple triggers
      logout({ hardLogout: true });
      Log('🚪 User is being hard logged out via SignalR');
    }
  }, [makeLoggingOut]);

  useEffect(() => {
    if (showBiometricPopup) {
      setShowBiometricBgPopup(true);
      checkBiometric({
        onDone(value) {
          setShowBiometricBgPopup(false);
          setShowBiometricPopup(false);
          setAuthenticatedFromSplash(false);
          if (value) {
            storage.set('biometricAuthenticateTime', new Date().getTime());

            checkAuthenticationCredentials(!loginScreenOpened(navigation));
          } else {
            if (!loginScreenOpened(navigation)) {
              logout({});
            }
          }
        },
      });
    }
  }, [showBiometricPopup]);

  useEffect(() => {
    if (authenticated) {
      Log('Authenticated');
      checkAuthenticationCredentials(true);
    }
  }, [authenticated]);

  useEffect(() => {
    if (authenticatedFromSplash) {
      if (userBiometricEnabled == UserBiometricOption.enabled) {
        setShowBiometricBgPopup(true);
        checkBiometric({
          onDone(value) {
            setShowBiometricBgPopup(false);
            setShowBiometricPopup(false);

            if (value) {
              storage.set('biometricAuthenticateTime', new Date().getTime());

              checkAuthenticationCredentials();
              sessionService.start();
            } else {
              setAuthenticatedFromSplash(false);
              if (!loginScreenOpened(navigation)) {
                logout({});
              }
            }
          },
        });
      } else {
        setAuthenticatedFromSplash(false);
        checkAuthenticationCredentials();
        sessionService.start();
      }
    }
  }, [authenticatedFromSplash]);

  useEffect(() => {
    if (fromSplashWithFaceIdEnabled) {
      useLogoutStore.getState().setIsLoggingOut(true);
      setShowBiometricBgPopup(true);
      try {
        checkBiometric({
          withPasscode: false,
          onDone(value) {
            setShowBiometricBgPopup(false);
            setShowBiometricPopup(false);
            setAuthenticatedFromSplash(false);

            useLogoutStore.getState().setIsLoggingOut(false);
            if (value) {
              biometricStore
                .getState()
                .setUserBiometricEnabled(UserBiometricOption.enabled);

              storage.set('biometricAuthenticateTime', new Date().getTime());
            } else {
              biometricStore
                .getState()
                .setUserBiometricEnabled(UserBiometricOption.disabled);

              storage.set('inactiveTime', new Date().getTime());
            }
            checkAuthenticationCredentials();
            sessionService.start();
          },
        });
      } catch (e) {
        setFromSplashWithFaceIdEnabled(false);
      }
    }
  }, [fromSplashWithFaceIdEnabled]);

  useEffect(() => {
    if (sessionOutPopup) {
      setSessionOut();
    }
  }, [sessionOutPopup]);

  const setSessionOut = (cred?: Record<string, any>) => {
    const sessionOutData = {
      title: 'Session Out',
      data: {
        userDetails: {
          userid: userDetails?.userID,
          email: userDetails?.email,
        },
        biometricStore: JSON.parse(JSON.stringify(biometricStore.getState())),
        biometricTime: storage.getNumber('biometricAuthenticateTime'),
        inactiveTime: storage.getNumber('inactiveTime'),
        currentTime: new Date().getTime(),
        credError: cred || {},
        credErrorJson: cred ? JSON.stringify(cred) : undefined,
      },
    };

    Log('Session Out Data => ' + JSON.stringify(sessionOutData));
    triggerSentry(sessionOutData);
    setApiLoading(false);

    setBiometricLoading(false); //biometric loading false on session out

    logout({ noNavigation: true, hardLogout: true });

    navigation.reset({
      index: 0,
      routes: [{ name: 'SessionOutScreen' }],
    });
  };

  const handleNavigation = async (fromResumeApp?: boolean) => {
    if (userDetails != undefined && !isLoggingOut) {
      const internetAvailable = await internetReachable();
      if (!internetAvailable) {
        Log('Biometric Popup=>' + t('InternetNotAvailable'));
        setBiometricLoading(false);
        return;
      }
      setApiLoading(true);
      updatelastSignInForUserApi.mutate({
        apiPayload: {},
        fromResumeApp: fromResumeApp,
      });
    }
  };

  const navigateToInitialScreen = () => {
    setBiometricLoading(false);
    navigateFromApi(navigation, () => {
      navigation.reset(
        parseRouteToDynamicReset({
          screen: 'DrawerRoutes',
          params: {
            screen: 'BottomBarRoutes',
            params: {
              screen: userDetails?.isAdvisor ? 'ContactListing' : 'Dashboard',
            },
          },
        }),
      );
      setBiometricCompleted(true);
    });
  };

  //to get the access token for browser - just before the access token gets expired
  // module-scope single-flight handle
  let auth0InFlight: Promise<any | undefined> | null = null;

  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  const getAuth0Token = async (): Promise<any | undefined> => {
    // Coalesce concurrent callers
    if (auth0InFlight) {
      Log('Auth0: coalesced on in-flight request');
      return auth0InFlight;
    }

    auth0InFlight = (async () => {
      const TOTAL_BUDGET_MS = 60_000; // stop after 60s
      const ATTEMPT_TIMEOUT_MS = 10_000; // retry every 10s if nothing happens
      const COOLDOWN_MS = 600; // cooldown after cancel

      setIsLoggingOut(true);
      Log('isLoggingOut => getAuth0Token = true');

      const params: WebAuthorizeParameters = {
        scope: 'openid profile email offline_access',
        connection: authenticationTokenStore.getState().auth0Type,
        audience: `https://${TenantInfo.Auth0Domain}/api/v2/`,
        additionalParameters: { prompt: 'none' }, // silent
        ...(TenantInfo.Auth0Organization
          ? { organization: TenantInfo.Auth0Organization }
          : {}),
      };

      const started = Date.now();

      // Clean slate in case a previous flow is lingering
      try {
        cancelWebAuth();
      } catch {}
      await sleep(150);

      try {
        let attempt = 0;

        while (Date.now() - started < TOTAL_BUDGET_MS) {
          attempt += 1;

          const remaining = TOTAL_BUDGET_MS - (Date.now() - started);
          const thisTimeout = Math.min(
            ATTEMPT_TIMEOUT_MS,
            Math.max(500, remaining),
          );

          Log(
            `Auth0 silent authorize attempt ${attempt} (timeout=${thisTimeout}ms)`,
          );

          try {
            const credentials = await Promise.race([
              authorize(
                params,
                Platform.OS === 'ios'
                  ? { useSFSafariViewController: true }
                  : undefined,
              ),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error('TimeoutError')),
                  thisTimeout,
                ),
              ),
            ]);

            if (credentials) {
              Log('Auth0: received credentials');
              storage.set('browserTokenRefresh', Date.now());
              return credentials;
            }

            Log('Auth0: no credentials returned; retrying…');
          } catch (err: any) {
            const code = err?.code;
            const msg = String(err?.message || err);
            Log(`Auth0 authorize error: ${msg}`);

            // Timeout or active transaction → cancel and retry (single web flow at a time)
            if (
              msg === 'TimeoutError' ||
              code === 'TRANSACTION_ACTIVE_ALREADY'
            ) {
              try {
                cancelWebAuth();
              } catch {}
              await sleep(COOLDOWN_MS);
              continue;
            }

            // Any other error: keep UI responsive; bail out as undefined
            Log('Auth0: non-timeout error; returning undefined.');
            return undefined;
          }

          // Small spacer to avoid tight loop, still respecting total budget
          await sleep(
            Math.min(
              300,
              Math.max(0, TOTAL_BUDGET_MS - (Date.now() - started)),
            ),
          );
        }

        Log('Auth0: total 30s budget exhausted; returning undefined.');
        return undefined;
      } finally {
        setIsLoggingOut(false);
        Log('isLoggingOut => getAuth0Token = false');
      }
    })();

    try {
      return await auth0InFlight;
    } finally {
      auth0InFlight = null; // release single-flight lock
    }
  };

  const checkAuthenticationCredentials = async (fromResumeApp?: boolean) => {
    const internetAvailable = await internetReachable();
    if (!internetAvailable) {
      Log('Biometric Popup=>' + t('InternetNotAvailable'));
      return;
    }
    setApiLoading(true);
    if (
      userDetails?.loginWith == LoginWith.auth0 ||
      userDetails?.loginWith == LoginWith.oktaWithAuth0
    ) {
      setBiometricLoading(true);
      await getCredentials()
        .then(async credentials => {
          //comparing access token
          Log(
            'auth0 Token Refreshed biometricpopup=>' +
              JSON.stringify(credentials),
          );
          if (credentials) {
            await saveAccessTokenInKeychain(JSON.stringify(credentials));
            /**
             * Added by @Yuvraj 09-10-2025 -> pre access token time check, if exceeds open the browser to refresh token
             */
            const browserTokenTime = storage.getNumber('browserTokenRefresh');
            const shouldSetBrowserToken = checkIntervalTime(browserTokenTime!, {
              min: sessionExpireTime, // access token set time in browser,
            });

            Log(
              'browserTokenTime=>' +
                browserTokenTime +
                ' shouldSetBrowserToken=>' +
                shouldSetBrowserToken,
            );
            //just few minutes before if app gets open refresh token in browser
            if (shouldSetBrowserToken) {
              const cred = await getAuth0Token();

              if (!cred) {
                setSessionOut({
                  auth0TokenErrorAuth0:
                    'Unable to refresh Auth0 token via browser',
                });
                return;
              }
            }

            handleNavigation(fromResumeApp);
          } else {
            setSessionOut({
              auth0TokenErrorCred:
                'Unable to refresh Auth0 token via getCredentials',
            });
          }
        })
        .catch(error => {
          Log('refresh auth0 Token Error=>' + JSON.stringify(error));
          setSessionOut({
            auth0TokenErrorCredCatch:
              'Unable to refresh Auth0 token via getCredentials catch',
          });
        });
    } else {
      const access = await getAccessTokenFromKeychain();
      refreshTokenApi.mutate({
        apiPayload: {
          refreshToken: access?.refreshToken,
        },
        fromResumeApp: fromResumeApp,
      });
    }
  };

  /** Added by @Tarun 26-09-2025 -> refreshTokenApi call to update access token START (FYN-9538) */
  const refreshTokenApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      fromResumeApp?: boolean;
    }) => {
      /** Added by @Tarun 31-01-2025 -> Makes a POST request to update Last Sign in (FYN-4204) */
      return makeRequest<AuthenticateViaAuth0Model>({
        endpoint: ApiConstants.RefreshToken,
        method: HttpMethodApi.Post,
        data: sendData.apiPayload,
        refreshToken: true,
      }); // API Call
    },
    onSuccess: async (data, variables, context) => {
      if (data.result?.accessToken) {
        const cred: Credentials = {
          accessToken: data.result?.accessToken,
          idToken: '',
          refreshToken: variables.apiPayload.refreshToken,
          tokenType: 'Bearer',
          expiresAt: data.result?.expireInSeconds ?? 1234,
        };

        await saveAccessTokenInKeychain(JSON.stringify(cred));

        handleNavigation(variables.fromResumeApp);
      } else {
        Log('Token regeneration failed: No access token received');
        setSessionOut();
      }
    },
    onError(error, variables, context) {
      //showSnackbar(error.message, 'danger');
      setSessionOut();
    },
  });
  /** Added by @Tarun 26-09-2025 -> refreshTokenApi call to update access token END (FYN-9538) */

  /** Added by @Tarun 31-01-2025 -> updatelastSignInForUserApi call to update Last Sign in START (FYN-4204) */
  const updatelastSignInForUserApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      fromResumeApp?: boolean;
    }) => {
      /** Added by @Tarun 31-01-2025 -> Makes a POST request to update Last Sign in (FYN-4204) */
      return makeRequest<UpdateLastSignInForUserModel>({
        endpoint: ApiConstants.UpdateLastSignInForUser,
        method: HttpMethodApi.Put,
        data: sendData.apiPayload,
      }); // API Call
    },
    onSuccess(data, variables, context) {
      /** Added by @Tarun 09-02-25 ---> add invite detail to user details (FYN-4042) */

      const userData = {
        ...userDetails,
        isInvitedIntoTemplate: data.result?.isInvitedIntoTemplate,
        inviteLoadingMsg: data.result?.message,
        restrictLogin: data.result?.restrictLogin,
        IsOnboardingComplete: data.result?.isOnboardingComplete,
      } as GetUserDetailForProfileModel;

      /** Added by @Tarun 09-02-25 ---> store user details in store (FYN-4042) */
      setUserDetails(userData);

      if (variables.fromResumeApp) {
        setApiLoading(false);
        if (data.result?.isInvitedIntoTemplate || data.result?.restrictLogin) {
          navigateToInitialScreen();
        } else {
          if (loginScreenOpened(navigation)) {
            navigateToInitialScreen();
          } else {
            setBiometricCompleted(true);
          }
        }
      } else {
        navigateToInitialScreen();
        getUserDetailForProfileApiCall.mutate({
          apiPayload: {},
          userDetails: userData,
        });
      }
    },
    onError(error, variables, context) {
      /** Added by @Tarun 31-01-2025 -> display snackbar when request fails (FYN-4204) */
      setApiLoading(false);
      setBiometricLoading(false);
    },
  });
  /** Added by @Tarun 31-01-2025 -> updatelastSignInForUserApi call to update Last Sign in END (FYN-4204) */

  /** Added by @Tarun 31-01-2025 -> getUserDetailForProfileApiCall call to get user detail START (FYN-4204) */
  const getUserDetailForProfileApiCall = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      userDetails?: GetUserDetailForProfileModel;
    }) => {
      return makeRequest<GetUserDetailForProfileModel>({
        endpoint: ApiConstants.GetUserDetailForProfile,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      setApiLoading(false);
      setBiometricLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data?.result) {
        /** Added by @Tarun 09-02-25 ---> store user details in store (FYN-4042) */
        const userData: GetUserDetailForProfileModel = {
          ...data.result,
          isInvitedIntoTemplate: variables.userDetails?.isInvitedIntoTemplate,
          inviteLoadingMsg: variables.userDetails?.inviteLoadingMsg,
          restrictLogin: variables.userDetails?.restrictLogin,
          loginWith: userDetails?.loginWith,
          isAdvisor:
            data?.result?.role == UserRoleEnum.Admin ||
            data?.result?.role == UserRoleEnum.Advisor ||
            data?.result?.role == UserRoleEnum.Coach ||
            data.result.role == UserRoleEnum.OfficeAdmin ||
            data.result.role == UserRoleEnum.OfficeAdminSpace ||
            data.result.role == UserRoleEnum.Marketing ||
            data.result.role == UserRoleEnum.Compliance ||
            data.result.role == UserRoleEnum.Operations ||
            data.result.role == UserRoleEnum.SupportStaff ||
            data.result.role == UserRoleEnum.SupportStaffSpace ||
            data.result.role == UserRoleEnum.ContentEditor
              ? true
              : false,
        };

        setUserDetails(userData);
      }
    },
  });
  /** Added by @Tarun 31-01-2025 -> getUserDetailForProfileApiCall call to get user detail END (FYN-4204) */

  return null;
}

const makeStyles = (theme: CustomTheme) => StyleSheet.create({});

export default BiometricPopup;
