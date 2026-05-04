import { AppVersion, storage } from '@/App';
import { CustomButton, CustomText, Tap } from '@/components/atoms';
import { ButtonVariants } from '@/components/atoms/customButton/customButton';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomDropDownPopup, FormTextInput } from '@/components/molecules';
import {
  InputModes,
  InputTextCapitalization,
} from '@/components/molecules/customTextInput/formTextInput';
import { UserRoleEnum } from '@/services/models';

import { SafeScreen } from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { sessionService } from '@/components/template/biometricPopup/sessionService';
import { navigateFromApi } from '@/navigators/applicationNavigator';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  AuthenticateViaAuth0Model,
  GetTenantByUserEmailModel,
  GetTenantIdByNameModel,
  UpdateLastSignInForUserModel,
} from '@/services/models';
import {
  GetUserDetailForProfileModel,
  LoginWith,
} from '@/services/models/getUserDetailForProfileModel/getUserDetailForProfileModel';
import {
  authenticationTokenStore,
  badgesStore,
  biometricStore,
  tenantDetailStore,
  useLogoutStore,
  userStore,
} from '@/store';
import { UserBiometricOption } from '@/store/biometricStore/biometricStore';
import { TenantInfo } from '@/tenantInfo';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { biometricExist, checkBiometric } from '@/utils/biometricUtils';
import { saveAccessTokenInKeychain } from '@/utils/keychainUtils';
import Log from '@/utils/logger';
import {
  parseRouteToDynamicReset,
  useAppNavigation,
} from '@/utils/navigationUtils';
import { cancelNotification } from '@/utils/notificationUtils';
import {
  isEmpty,
  openAppSettings,
  showSnackbar,
  useLogout,
} from '@/utils/utils';
import { DdSdkReactNative } from '@datadog/mobile-react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Sentry from '@sentry/react-native';
import { useMutation } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import {
  Credentials,
  useAuth0,
  WebAuthorizeParameters,
} from 'react-native-auth0';
import DeviceInfo from 'react-native-device-info';
import { Divider } from 'react-native-paper';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { z } from 'zod';
import AppBanner from './components/appBanner';
import OktaButton from './components/oktaButton';
import UserInfoView from './components/userInfoView';

function Login() {
  /** Added by @Tarun 05-02-2025 -> navigate to different screen (FYN-4204) */
  const navigation = useAppNavigation();

  /** Added by @Tarun 05-02-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-4204) */
  const theme = useTheme();

  /** Added by @Tarun 05-02-2025 -> access StylesSheet with theme implemented (FYN-4204) */
  const styles = makeStyles(theme);

  /** Added by @Tarun 05-02-2025 -> translations for labels (FYN-4204) */
  const { t } = useTranslation();

  /** Added by @Tarun 05-02-2025 -> tenant details store (FYN-4204) */
  const tenantDetail = tenantDetailStore();

  const authenticationTokenDetails = authenticationTokenStore();

  /** Added by @Tarun 05-02-2025 -> user store to store user information (FYN-4204) */
  const userData = userStore();

  const setBadges = badgesStore(state => state.setBadges);

  /** Added by @Tarun 05-02-2025 -> hide and show password (FYN-4204) */
  const [showPassword, setShowPassword] = useState<boolean>(true);

  /** Added by @Tarun 05-02-2025 -> loading state for multitenant login (FYN-4204) */
  const [loading, setLoading] = useState<boolean>(false);

  const [oktaLoading, setOktaLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [auth0EmailLoading, setAuth0EmailLoading] = useState(false);

  /**
   * Added by @Tarun 05-02-2025 -> loading state for fetching tenant list in
   * multitenant login (FYN-4204)
   * */
  const [emailLoading, setEmailLoading] = useState(false);

  /** Added by @Tarun 05-02-2025 -> tenant list (FYN-4204) */
  const [tenantList, setTenantList] = useState<GetTenantByUserEmailModel[]>([]);

  /** Added by @Tarun 05-02-2025 -> selected tenant by user (FYN-4204) */
  const [selectedTenant, setSelectedTenant] =
    useState<GetTenantByUserEmailModel>();

  /** Added by @Tarun 05-02-2025 -> show tenant dropdown for tenant selection (FYN-4204) */
  const [showTenantDropDown, setShowTenantDropdown] = useState(false);

  /** Added by @Tarun 05-02-2025 -> Auth0 hook for login (FYN-4204) */
  const { authorize, clearSession, cancelWebAuth } = useAuth0();

  /** Added by @Tarun 05-02-2025 -> logout user if any api fails (FYN-4204) */
  const { logout, resetUser } = useLogout();

  //userdata
  const [userInfo, setUserInfo] = useState(userData.userDetails);

  const biometricLoading = biometricStore(state => state.biometricLoading);

  const setAuthenticatedFromSplash = biometricStore(
    state => state.setAuthenticatedFromSplash,
  );

  useEffect(() => {
    Log('biometricLoading=>' + biometricLoading);
    if (biometricLoading) {
      handleLoading();
      if (userInfo?.userID == undefined) {
        setUserInfo(userData.userDetails);
      }
    }
  }, [biometricLoading]);

  /**
   * Added by @Tarun 05-02-2025 -> Schema defined for validation of form
   * Zod(https://zod.dev/?id=form-integrations)
   */
  const schema = z.object({
    /**
     * Added by @Tarun 05-02-2025 -> for multitenant login when no tenant exist
     * for user email (FYN-4204)
     */
    tenant: z.string().optional(),
    email: z
      .string()
      .min(1, { message: t('PleaseEnterEmail') })
      .email({ message: t('PleaseEnterValidEmail') }),
    password: z.string().min(1, { message: t('PleaseEnterPassword') }),
  });

  /**
   * Added by @Tarun 05-02-2025 -> converted schema to type for React-hook-form (FYN-4204)
   */
  type Schema = z.infer<typeof schema>;

  /**
   * Added by @Tarun 05-02-2025 -> React hook form (https://www.react-hook-form.com/get-started)
   */
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors, validatingFields },
  } = useForm<Schema>({
    defaultValues: {
      tenant: '',
      email: '',
      password: '',
    },
    resolver: zodResolver(schema),
  });

  /**
   * Added by @Tarun 05-02-2025 -> to know if any api call is ongoing (FYN-4204)
   */
  const isLoading = () => {
    if (
      loading ||
      oktaLoading ||
      smsLoading ||
      auth0EmailLoading ||
      biometricLoading
    ) {
      return true;
    } else {
      return false;
    }
  };

  /**
   * Added by @Tarun 05-02-2025 -> handle tenant selection and set tenant detail
   * in store for api call (FYN-4204)
   */
  const handleTenantSelect = (data: GetTenantByUserEmailModel) => {
    setValue('tenant', data.tenantName ?? '');

    /**
     * Added by @Tarun 05-02-2025 -> setSelectedTenant for tenant dropdown (FYN-4204)
     */
    setSelectedTenant(data);

    /**
     * Added by @Tarun 05-02-2025 -> store tenant detail in store and auth0 and okta is disabled
     * in multitenant app (FYN-4204)
     */
    tenantDetail.setTenantDetails({
      tenantId: data.tenantId,
      tenancyName: getTenancyName(data?.tenantURL) ?? TenantInfo.TenancyName,
      tenantName: data.tenantName,
      tenantURL: data.tenantURL,
      isAuth0Enable: false,
      isOktaEnabled: false,
    });

    /**
     * Added by @Tarun 05-02-2025 -> hide tenant dropdown (FYN-4204)
     */
    setShowTenantDropdown(false);
  };

  /**
   * Added by @Tarun 05-02-2025 -> validate email when user completes email input (FYN-4204)
   */
  const validateEmail = () => {
    if (!isEmpty(getValues('email'))) {
      const emailSchema = z.string().email();
      try {
        if (emailSchema.parse(getValues('email'))) {
          getTenantByUserEmailApi.mutate({
            EmailAddress: getValues('email'),
          });
        }
      } catch (e) {
        showSnackbar(t('PleaseEnterValidEmail'), 'danger');
      }
    }
  };

  /**
   * Added by @Tarun 05-02-2025 -> login user in multitenant login (FYN-4204)
   */
  const onSubmit = (data: Schema) => {
    if (!isLoading() && !emailLoading) {
      authenticateApi.mutate({
        userNameOrEmailAddress: data.email,
        password: data.password,
      });
    }
  };

  const handleLoading = () => {
    setOktaLoading(false);
    setAuth0EmailLoading(false);
    setSmsLoading(false);
    setLoading(false);
  };

  // /** Added by @Tarun 05-02-2025 -> login user in auth0 login (FYN-4204) */
  // const loginWithAuth0 = async (type?: string, okta?: boolean) => {
  //   /** Added by @Tarun 05-02-2025 -> to show loading on specific button (FYN-4204) */
  //   if (okta) {
  //     setOktaLoading(true);
  //   } else {
  //     if (type == 'sms') {
  //       setSmsLoading(true);
  //     } else {
  //       setAuth0EmailLoading(true);
  //     }
  //   }

  //   /** Added by @Tarun 05-02-2025 -> auth0 login (FYN-4204) */
  //   if (TenantInfo.Auth0Organization) {
  //     useLogoutStore.getState().setIsLoggingOut(true);
  //     Log('isLoggingOut=>Auth0 with organisation = true');
  //     await authorize(
  //       {
  //         scope: 'openid profile email offline_access',
  //         connection: type,
  //         audience: `https://${TenantInfo.Auth0Domain}/api/v2/`,
  //         organization: TenantInfo.Auth0Organization ?? undefined,
  //         additionalParameters: { prompt: 'login' },
  //       },
  //       Platform.OS == 'ios'
  //         ? {
  //             //ephemeralSession: true,
  //             useSFSafariViewController: true,
  //           }
  //         : undefined,
  //     )
  //       .then(async credentials => {
  //         Log('accessToken=>' + JSON.stringify(credentials));

  //         if (credentials) {
  //           if (userInfo?.userID) {
  //             await resetUser();
  //           }

  //           await saveAccessTokenInKeychain(JSON.stringify(credentials));
  //           authenticationTokenDetails.setAuth0Type(type);

  //           storage.set('browserTokenRefresh', new Date().getTime()); //for browser token refresh
  //           /**
  //            * Added by @Tarun 05-02-2025 -> auth0 logged in successfully
  //            * call authenticateViaAuth0Api to get server token (FYN-4204)
  //            */
  //           userData.setUserDetails({
  //             loginWith: okta ? LoginWith.oktaWithAuth0 : LoginWith.auth0,
  //           });

  //           if (okta) {
  //             try {
  //               const decoded: { sub: string } = jwtDecode(
  //                 credentials.accessToken,
  //               );
  //               oktaAuthenticateApiCall.mutate(decoded.sub);
  //             } catch (e) {
  //               console.error('Invalid token', e);
  //               handleLoading();
  //               useLogoutStore.getState().setIsLoggingOut(false);
  //               Log('isLoggingOut=>Auth0 with organisation okta = false');
  //               logout({});
  //             }
  //           } else {
  //             /** Added by @Tarun 05-02-2025 -> call getUserDetailForProfileApiCall to get user details(FYN-4204) */
  //             getUserDetailForProfileApiCall.mutate({
  //               apiPayload: {},
  //               loginWith: okta ? LoginWith.oktaWithAuth0 : LoginWith.auth0,
  //             });
  //           }
  //         } else {
  //           /** Added by @Tarun 05-02-2025 -> auth0 logged failed hide loading (FYN-4204) */
  //           handleLoading();
  //         }
  //         useLogoutStore.getState().setIsLoggingOut(false);
  //         Log('isLoggingOut=>Auth0 with organisation end = false');
  //       })
  //       .catch(error => {
  //         /**
  //          * Added by @Tarun 05-02-2025 -> auth0 login failed show snackbar and
  //          * hide loading(FYN-4204)
  //          */
  //         if (error.code == 'TRANSACTION_ACTIVE_ALREADY') {
  //           cancelWebAuth();
  //           loginWithAuth0(type, okta);
  //         }
  //         Log('auth0 error=>' + JSON.stringify(error));

  //         // showSnackbar(error.message, 'danger');

  //         handleLoading();
  //         useLogoutStore.getState().setIsLoggingOut(false);
  //         Log('isLoggingOut=>Auth0 with organisation catch = false');
  //       });
  //   } else {
  //     useLogoutStore.getState().setIsLoggingOut(true);
  //     Log('isLoggingOut=>Auth0 = true');
  //     await authorize(
  //       {
  //         scope: 'openid profile email offline_access',
  //         connection: type,
  //         audience: `https://${TenantInfo.Auth0Domain}/api/v2/`,
  //         additionalParameters: { prompt: 'login' },
  //       },
  //       Platform.OS == 'ios'
  //         ? {
  //             //ephemeralSession: true,
  //             useSFSafariViewController: true,
  //           }
  //         : undefined,
  //     )
  //       .then(async credentials => {
  //         Log('accessToken=>' + JSON.stringify(credentials));

  //         if (credentials) {
  //           if (userInfo?.userID) {
  //             await resetUser();
  //           }

  //           await saveAccessTokenInKeychain(JSON.stringify(credentials));
  //           authenticationTokenDetails.setAuth0Type(type);

  //           storage.set('browserTokenRefresh', new Date().getTime()); //for browser token refresh
  //           /**
  //            * Added by @Tarun 05-02-2025 -> auth0 logged in successfully
  //            * call authenticateViaAuth0Api to get server token (FYN-4204)
  //            */
  //           userData.setUserDetails({
  //             loginWith: okta ? LoginWith.oktaWithAuth0 : LoginWith.auth0,
  //           });

  //           if (okta) {
  //             try {
  //               const decoded: { sub: string } = jwtDecode(
  //                 credentials.accessToken,
  //               );
  //               oktaAuthenticateApiCall.mutate(decoded.sub);
  //             } catch (e) {
  //               console.error('Invalid token', e);
  //               handleLoading();
  //               useLogoutStore.getState().setIsLoggingOut(false);
  //               Log('isLoggingOut=>Auth0 okta = false');
  //               logout({});
  //             }
  //           } else {
  //             /** Added by @Tarun 05-02-2025 -> call getUserDetailForProfileApiCall to get user details(FYN-4204) */
  //             getUserDetailForProfileApiCall.mutate({
  //               apiPayload: {},
  //               loginWith: okta ? LoginWith.oktaWithAuth0 : LoginWith.auth0,
  //             });
  //           }
  //         } else {
  //           /** Added by @Tarun 05-02-2025 -> auth0 logged failed hide loading (FYN-4204) */
  //           handleLoading();
  //         }
  //         useLogoutStore.getState().setIsLoggingOut(false);
  //         Log('isLoggingOut=>Auth0 end = false');
  //       })
  //       .catch(error => {
  //         /**
  //          * Added by @Tarun 05-02-2025 -> auth0 login failed show snackbar and
  //          * hide loading(FYN-4204)
  //          */

  //         if (error.code == 'TRANSACTION_ACTIVE_ALREADY') {
  //           cancelWebAuth();
  //           loginWithAuth0(type, okta);
  //         }

  //         Log('auth0 error=>' + JSON.stringify(error));

  //         // showSnackbar(error.message, 'danger');

  //         handleLoading();
  //         useLogoutStore.getState().setIsLoggingOut(false);
  //         Log('isLoggingOut=>Auth0 catch = false');
  //       });
  //   }
  // };

  const loginWithAuth0 = async (type?: string, okta?: boolean) => {
    try {
      // ✅ Start: set loading states clearly
      if (okta) {
        setOktaLoading(true);
      } else if (type === 'sms') {
        setSmsLoading(true);
      } else {
        setAuth0EmailLoading(true);
      }

      useLogoutStore.getState().setIsLoggingOut(true);

      const hasOrganization = !!TenantInfo?.Auth0Organization;
      Log(`isLoggingOut => Auth0 with organisation = ${hasOrganization}`);

      // ✅ Define authorize params safely
      const authParams: WebAuthorizeParameters = {
        scope: 'openid profile email offline_access',
        connection: type,
        audience: `https://${TenantInfo?.Auth0Domain}/api/v2/`,
        additionalParameters: { prompt: 'login' },
      };

      if (hasOrganization) {
        authParams.organization = TenantInfo.Auth0Organization;
      }

      // ✅ Platform-specific options
      const platformOptions =
        Platform.OS === 'ios' ? { useSFSafariViewController: true } : undefined;

      // ✅ Perform Auth0 login
      const credentials = await authorize(authParams, platformOptions);
      Log('accessToken => ' + JSON.stringify(credentials));

      if (!credentials) {
        handleLoading();
        useLogoutStore.getState().setIsLoggingOut(false);
        Log('Auth0 login failed: no credentials');
        return;
      }

      // ✅ Reset user if already logged in
      if (userInfo?.userID) {
        await resetUser();
      }

      // ✅ Save token and Auth0 connection type
      await saveAccessTokenInKeychain(JSON.stringify(credentials));
      authenticationTokenDetails?.setAuth0Type?.(type);
      storage?.set?.('browserTokenRefresh', new Date().getTime());

      // ✅ Mark login type
      userData?.setUserDetails?.({
        loginWith: okta ? LoginWith.oktaWithAuth0 : LoginWith.auth0,
      });

      cancelNotification({ clearAll: true }); // clear notifications

      // ✅ Okta handling
      if (okta) {
        try {
          const decoded: { sub: string } = jwtDecode(credentials.accessToken);
          oktaAuthenticateApiCall?.mutate?.(decoded.sub);
        } catch (e) {
          console.error('Invalid token', e);
          handleLoading();
          useLogoutStore.getState().setIsLoggingOut(false);
          Log('isLoggingOut => Auth0 Okta = false');
          logout({ hardLogout: true });
        }
      } else {
        // ✅ Fetch user details
        getUserDetailForProfileApiCall?.mutate?.({
          apiPayload: {},
          loginWith: LoginWith.auth0,
        });
      }

      useLogoutStore.getState().setIsLoggingOut(false);
      Log(`isLoggingOut => Auth0 with organisation end = false`);
    } catch (error: any) {
      // ✅ Handle transaction overlap
      if (error?.code === 'TRANSACTION_ACTIVE_ALREADY') {
        cancelWebAuth?.();
        Log('Retrying Auth0 login after TRANSACTION_ACTIVE_ALREADY');
        return loginWithAuth0(type, okta);
      }

      Log('Auth0 login error => ' + JSON.stringify(error));
      handleLoading();
      useLogoutStore.getState().setIsLoggingOut(false);
      Log('isLoggingOut => Auth0 catch = false');
    }
  };

  const getTenancyName = (url?: string) => {
    const match = url?.match(/^https?:\/\/([^\.]+)/);
    return match?.[1] ?? null;
  };

  /**
   * Added by @Tarun 05-02-2025 -> getTenantByUserEmailApi call to get tenant list for
   * multi tenant app START (FYN-4204)
   */
  const getTenantByUserEmailApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetTenantByUserEmailModel[]>({
        endpoint: ApiConstants.GetTenantByUserEmail,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      /** Added by @Tarun 05-02-2025 -> show email loading (FYN-4204) */
      setEmailLoading(true);
    },
    onSettled(data, error, variables, context) {
      /** Added by @Tarun 05-02-2025 -> hide email loading (FYN-4204) */
      setEmailLoading(false);
    },
    onSuccess(data, variables, context) {
      /**
       * Added by @Tarun 05-02-2025 -> if user email is enrolled in any tenant then tenant list
       * is returned in api (FYN-4204)
       */
      if (data.result && data.result.length > 0) {
        setTenantList(data.result);

        /** Added by @Tarun 05-02-2025 -> select first tenant by default (FYN-4204) */

        const firstTenant = data?.result?.at(0);

        if (firstTenant?.tenantName) {
          /** Added by @Tarun 05-02-2025 -> set tenant name in Input fields (FYN-4204) */
          setValue('tenant', firstTenant?.tenantName!);
        }

        /** Added by @Tarun 05-02-2025 -> select tenant to show in drop down (FYN-4204)*/
        setSelectedTenant(firstTenant);

        /** Added by @Tarun 05-02-2025 -> store tenant detail in Tenant store (FYN-4204) */

        tenantDetail.setTenantDetails({
          tenantId: firstTenant?.tenantId,
          tenancyName:
            getTenancyName(firstTenant?.tenantURL) ?? TenantInfo.TenancyName,
          tenantName: firstTenant?.tenantName,
          tenantURL: firstTenant?.tenantURL,
          isAuth0Enable: false,
          isOktaEnabled: false,
        });

        /**
         * Added by @Tarun 05-02-2025 -> show drop down when more than 1 tenant is there
         * for user email (FYN-4204)
         */
        if (data.result.length > 1) {
          setShowTenantDropdown(true);
        }
        clearErrors('email');
      } else {
        /**
         * Added by @Tarun 05-02-2025 -> empty state when user email is not enrolled in
         * any tenant (FYN-4204)
         */

        setTenantList([]);

        setSelectedTenant(undefined);

        setValue('tenant', '');
        setError('email', {
          type: 'manual',
          message: t('EmailDoesNotExist'),
        });

        tenantDetail.setTenantDetails(undefined);
        showSnackbar(t('EmailDoesNotExist'), 'danger');
      }
    },
    onError(error, variables, context) {
      /** Added by @Tarun 05-02-2025 -> empty state when api fails (FYN-4204) */
      showSnackbar(error.message, 'danger');

      setTenantList([]);

      setSelectedTenant(undefined);

      setValue('tenant', '');

      tenantDetail.setTenantDetails(undefined);
    },
  });
  /**
   * Added by @Tarun 05-02-2025 -> getTenantByUserEmailApi call to get tenant list for
   * multi tenant app START (FYN-4204)
   */

  /** Added by @Tarun 05-02-2025 -> authenticate call to sign in END (FYN-4204) */
  const authenticateApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<AuthenticateViaAuth0Model>({
        endpoint: ApiConstants.Authenticate,
        method: HttpMethodApi.Post,
        data: sendData,
        byPassRefresh: true,
      });
    },
    onMutate(variables) {
      /** Added by @Tarun 05-02-2025 -> show loading on login button(FYN-4204) */
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      /**
       * Added by @Tarun 05-02-2025 -> hide loading on login button
       * if any api error occurs (FYN-4204)
       */
      if (error || data?.result == null) {
        setLoading(false);
      }
    },
    onSuccess: async (data, variables, context) => {
      if (data.result) {
        /** Added by @Tarun 05-02-2025 -> store token detail in store (FYN-4204) */
        //accessTokenData(data.result);
        const cred: Credentials = {
          accessToken: data.result?.accessToken ?? '',
          idToken: '',
          refreshToken: data.result.refreshToken,
          tokenType: 'Bearer',
          expiresAt: data.result?.expireInSeconds ?? 1234,
        };

        await saveAccessTokenInKeychain(JSON.stringify(cred));

        /** Added by @Tarun 05-02-2025 -> call getUserDetailForProfileApiCall to get user details(FYN-4204) */
        getUserDetailForProfileApiCall.mutate({
          apiPayload: {},
          loginWith: LoginWith.multiTenant,
        });

        getTenantIdByNameApiCall.mutate({
          TenancyName:
            getTenancyName(tenantDetail?.tenantDetails?.tenantURL) ??
            TenantInfo.TenancyName,
        });
      } else {
        showSnackbar(data.error?.message ?? t('LoginFailedMsg'), 'danger');
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });
  /** Added by @Tarun 05-02-2025 -> authenticate call to sign in END (FYN-4204) */

  /** Added by @Ajay 23-06-2025 -> getTenantIdByNameApiCall call to auth0 to sign in START (FYN-4204) */
  const getTenantIdByNameApiCall = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetTenantIdByNameModel>({
        endpoint: ApiConstants.GetTenantIdByName,
        method: HttpMethodApi.Get,
        data: sendData,
      }); // API Call
    },
    onSuccess(data, variables, context) {
      /** Added by @Ajay 23-06-2025 -> store tenant details in store (FYN-4204) */
      tenantDetail.setTenantDetails(data.result);
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });
  /** Added by  @Ajay 23-06-2025 -> getTenantIdByNameApiCall call to auth0 to sign in END (FYN-4204) */

  /** Added by @Tarun 31-01-2025 -> getUserDetailForProfileApiCall call to get user detail START (FYN-4204) */
  const getUserDetailForProfileApiCall = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      loginWith?: LoginWith;
    }) => {
      return makeRequest<GetUserDetailForProfileModel>({
        endpoint: ApiConstants.GetUserDetailForProfile,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      /**
       * Added by @Tarun 05-02-2025 -> hide loading on auth0 login button
       * if any api error occurs (FYN-4204)
       */
      if (error) {
        handleLoading();
      }
    },
    onSuccess: async (data, variables, context) => {
      if (data?.result) {
        if (
          data.result.role != UserRoleEnum.Customer &&
          data.result.role != UserRoleEnum.Lead &&
          data.result.role != UserRoleEnum.Prospect &&
          data.result.role != UserRoleEnum.Advisor &&
          data.result.role != UserRoleEnum.Admin &&
          data.result.role != UserRoleEnum.Coach &&
          data.result.role != UserRoleEnum.OfficeAdmin &&
          data.result.role != UserRoleEnum.OfficeAdminSpace &&
          data.result.role != UserRoleEnum.Marketing &&
          data.result.role != UserRoleEnum.Compliance &&
          data.result.role != UserRoleEnum.Operations &&
          data.result.role != UserRoleEnum.SupportStaff &&
          data.result.role != UserRoleEnum.SupportStaffSpace &&
          data.result.role != UserRoleEnum.Client &&
          data.result.role != UserRoleEnum.ContentEditor
        ) {
          /** Added by @Tarun 05-02-2025 -> user is not allowed to login in app (FYN-4204) */

          showAlertPopup({
            title: t('Message'),
            msg: t('AppNotAccessibleForApp'),
            PositiveText: t('Done'),
            dismissOnBackPress: false,
            onPositivePress: () => {
              logout({});
            },
          });
        } else {
          /** Added by @Tarun 05-02-2025 -> save user details in store (FYN-4204) */
          const userDetail: GetUserDetailForProfileModel = {
            ...data?.result,
            loginWith: variables.loginWith ?? LoginWith.multiTenant,
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
          userData.setUserDetails(userDetail);
          if (userInfo?.userID) {
            if (userInfo?.userID != userDetail.userID) {
              cancelNotification({ clearAll: true });
            }
            setUserInfo(userDetail);
          }

          setBadges({
            notificationCount: 0,
            hasNewFeed: false,
            messageCount: 0,
          });
          authenticationTokenStore.getState().setIsLoggedIn(true);
          /**
           * Added by @Tarun 05-02-25 ---> if fcm token is fetched from Firebase messaging
           * then call createOrEditApi to update fcm token on server for notifications (FYN-4042)
           */
          if (storage.getString('FcmToken')) {
            createOrEditApi.mutate({
              apiPayload: {
                udid: storage.getString('FcmToken'),
                deviceId: await DeviceInfo.getUniqueId(),
                deviceOS: Platform.OS,
                deviceModel: DeviceInfo.getModel(),
                deviceType: Platform.OS,
                deviceVersion: Platform.Version,
                appVersion: DeviceInfo.getVersion(),
                callPoint: 'App',
                AppBuildVersion: AppVersion,
                id: 0,
              },
              userDetails: userDetail,
            });
          } else {
            try {
              Sentry.withScope(scope => {
                scope.setExtra('deviceInfo', {
                  udid: storage.getString('FcmToken'),
                  deviceId: DeviceInfo.getUniqueId(),
                  deviceOS: Platform.OS,
                  deviceModel: DeviceInfo.getModel(),
                  deviceType: Platform.OS,
                  deviceVersion: Platform.Version,
                  appVersion: DeviceInfo.getVersion(),
                  callPoint: 'App',
                  id: 0,
                });

                Sentry.captureMessage('FCM token failure');
              });
            } catch (e) {
              Log('sentry error=>' + e);
            }
            /**
             * Added by @Tarun 05-02-25 ---> if app is  whitelabelled then ask for biometric authentication
             * else navigate to desired screen (FYN-4042)
             */
            if (
              variables.loginWith == LoginWith.auth0 ||
              variables.loginWith == LoginWith.okta ||
              variables.loginWith == LoginWith.oktaWithAuth0
            ) {
              /** Added by @Tarun 05-02-25 ---> show biometric prompt to user after successfull login (FYN-4042) */
              biometricCheck();
            } else {
              handleBiometricDisabled();
            }
          }
        }
      }
    },
    onError(error, variables, context) {
      Log('getprofile error=>');
      showAlertPopup({
        title: t('LoginFailed'),
        msg: t('LoginFailedMsg'),
        PositiveText: t('Done'),
        dismissOnBackPress: false,
        onPositivePress: () => {
          /** Added by @Tarun 05-02-2025 -> if can't get user info then delete user details from app(FYN-4204) */
          logout({});
        },
      });
    },
  });
  /** Added by @Tarun 31-01-2025 -> getUserDetailForProfileApiCall call to get user detail END (FYN-4204) */

  /** Added by @Tarun 31-01-2025 -> updatelastSignInForUserApi call to update Last Sign in START (FYN-4204) */
  const updatelastSignInForUserApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      userDetails?: GetUserDetailForProfileModel;
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

      const userDetails = {
        ...variables.userDetails,
        isInvitedIntoTemplate: data.result?.isInvitedIntoTemplate,
        inviteLoadingMsg: data.result?.message,
        restrictLogin: data.result?.restrictLogin,
        IsOnboardingComplete: data.result?.isOnboardingComplete,
      } as GetUserDetailForProfileModel;

      /** Added by @Tarun 09-02-25 ---> store user details in store (FYN-4042) */
      userData.setUserDetails(userDetails);

      try {
        DdSdkReactNative.setUserInfo({
          id: userDetails.userID!.toString(),
          name: userDetails.fullName,
          email: userDetails.email,
          extraInfo: {
            type: userDetails.isAdvisor ? 'advisor' : 'contact',
          },
        });

        Sentry.setUser({
          email: userDetails.email,
          username: userDetails.fullName,
        });
      } catch {
        Log('error in setting user in data dog and sentry');
      }

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
      });
    },
    onError(error, variables, context) {
      /** Added by @Tarun 31-01-2025 -> display snackbar when request fails (FYN-4204) */
      showSnackbar(error.message, 'danger');
    },
  });
  /** Added by @Tarun 31-01-2025 -> updatelastSignInForUserApi call to update Last Sign in END (FYN-4204) */

  /**
   * Added by @Tarun 31-01-2025 -> createOrEditApi call to set device detail and
   * fcm token START (FYN-4204)
   */
  const createOrEditApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      userDetails?: GetUserDetailForProfileModel;
    }) => {
      return makeRequest<null>({
        endpoint: ApiConstants.CreateOrEdit,
        method: HttpMethodApi.Post,
        data: sendData.apiPayload,
        byPassRefresh: true,
      }); // API Call
    },
    onSettled(data, error, variables, context) {
      /**
       * Added by @Tarun 05-02-2025 -> hide loading on login button's
       *  if any api error occurs (FYN-4204)
       */
      if (error) {
        handleLoading();
      }
    },
    onSuccess(data, variables, context) {
      /**
       * Added by @Tarun 05-02-25 ---> if app is  whitelabelled then ask for biometric authentication
       * else navigate to desired screen (FYN-4042)
       */
      sendSlientNotificationOnLoginApi.mutate({});
      if (
        variables.userDetails?.loginWith == LoginWith.auth0 ||
        variables.userDetails?.loginWith == LoginWith.okta ||
        variables.userDetails?.loginWith == LoginWith.oktaWithAuth0
      ) {
        /** Added by @Tarun 05-02-25 ---> show biometric prompt to user after successfull login (FYN-4042) */
        biometricCheck();
      } else {
        handleBiometricDisabled();
      }
    },
    onError(error, variables, context) {
      showSnackbar(error.message, 'danger');
    },
  });
  /**
   * Added by @Tarun 31-01-2025 -> createOrEditApi call to set device detail and
   * fcm token END (FYN-4204)
   */

  /** Added by @Tarun 18-09-2025 -> OktaAuthenticate api call needed for okta to sign in START (FYN-10113) */
  const oktaAuthenticateApiCall = useMutation({
    mutationFn: (sendData: string) => {
      return makeRequest<{ status?: number; message?: string }>({
        endpoint: ApiConstants.OktaAuthenticate,
        method: HttpMethodApi.Post,
        data: JSON.stringify(sendData),
        byPassRefresh: true,
      }); // API Call
    },
    onSuccess(data, variables, context) {
      if (data.result?.status == 1) {
        getUserDetailForProfileApiCall.mutate({
          apiPayload: {},
          loginWith: LoginWith.oktaWithAuth0,
        });
      } else {
        showAlertPopup({
          msg:
            data.result?.message ?? data.error?.message ?? t('LoginFailedMsg'),
          PositiveText: t('Ok'),
          dismissOnBackPress: false,
          onPositivePress: () => {
            /** Added by @Tarun 05-02-2025 -> if can't get user info then delete user details from app(FYN-4204) */
            logout({});
          },
        });
      }
    },
    onError(error, variables, context) {
      // Error Response
      showAlertPopup({
        title: t('LoginFailed'),
        msg: t('LoginFailedMsg'),
        PositiveText: t('Ok'),
        dismissOnBackPress: false,
        onPositivePress: () => {
          /** Added by @Tarun 05-02-2025 -> if can't get user info then delete user details from app(FYN-4204) */
          logout({});
        },
      });
    },
  });
  /** Added by  @Tarun 23-06-2025 -> OktaAuthenticate api call needed for okta to sign in START (FYN-10113) */

  /** Added by  @Tarun 06-11-2025 -> sendSlientNotificationOnLoginApi api call needed for badge count update on login START (FYN-11041) */
  const sendSlientNotificationOnLoginApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.SendSlientNotificationOnLogin,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
  });
  /** Added by  @Tarun 06-11-2025 -> sendSlientNotificationOnLoginApi api call needed for badge count update on login END (FYN-11041) */

  const handleBiometricClick = async () => {
    try {
      if (Platform.OS === 'ios') {
        const status = await check(PERMISSIONS.IOS.FACE_ID);
        Log('FaceID Permission Login => ' + status);

        if (status === RESULTS.DENIED || status === RESULTS.BLOCKED) {
          // Try requesting permission if not permanently blocked
          const newStatus = await request(PERMISSIONS.IOS.FACE_ID);
          Log('FaceID Request Result Login=> ' + newStatus);

          if (newStatus === RESULTS.DENIED || newStatus === RESULTS.BLOCKED) {
            useLogoutStore.getState().setIsLoggingOut(true);
            showAlertPopup({
              title: t('FaceIDPermissionRequired'),
              msg: t('EnableFaceIdMsg'),
              PositiveText: t('OpenSettings'),
              NegativeText: t('Cancel'),
              dismissOnBackPress: false,
              onPositivePress: () => {
                useLogoutStore.getState().setIsLoggingOut(false);
                storage.set('FaceIdSettings', true);
                openAppSettings();
              },
              onNegativePress() {
                useLogoutStore.getState().setIsLoggingOut(false);
              },
            });
          } else if (newStatus === RESULTS.GRANTED) {
            handleStartBiometric(true);
          }
        } else if (status === RESULTS.UNAVAILABLE) {
          //showSnackbar(t('FaceIdNotAvailable'), 'danger');
        } else if (status === RESULTS.GRANTED) {
          handleStartBiometric(true);
        }
      } else {
        handleStartBiometric(true);
      }
    } catch (error) {
      Log('handleBiometricClick Error => ' + JSON.stringify(error));
      //showSnackbar(t('FaceIdNotAvailable'), 'danger');
    }
  };

  const handleStartBiometric = (alreadyLoggedIn?: boolean) => {
    if (alreadyLoggedIn) {
      setAuthenticatedFromSplash(true);
    } else {
      checkBiometric({
        withPasscode: false,
        onDone(value) {
          if (value) {
            biometricStore
              .getState()
              .setUserBiometricEnabled(UserBiometricOption.enabled);

            storage.set('biometricAuthenticateTime', new Date().getTime());
          } else {
            biometricStore
              .getState()
              .setUserBiometricEnabled(UserBiometricOption.disabled);

            biometricStore.getState().setBiometricCompleted(true);

            // may delete later
            storage.set('inactiveTime', new Date().getTime());
          }
          sessionService.start();
          biometricStore.getState().setBiometricCompleted(true);

          updatelastSignInForUserApi.mutate({
            apiPayload: {},
            userDetails: userStore.getState().userDetails,
          });
        },
      });
    }
  };

  const handleBiometricDisabled = () => {
    useLogoutStore.getState().setIsLoggingOut(false);
    /**
     * Added by @Tarun 05-02-2025 -> when user denies it then save it in store
     * navigate user (FYN-4204)
     */
    biometricStore
      .getState()
      .setUserBiometricEnabled(UserBiometricOption.disabled);

    biometricStore.getState().setBiometricCompleted(true);

    storage.set('inactiveTime', new Date().getTime());

    sessionService.start();

    updatelastSignInForUserApi.mutate({
      apiPayload: {},
      userDetails: userStore.getState().userDetails,
    });
  };

  const biometricCheck = async () => {
    useLogoutStore.getState().setIsLoggingOut(true);
    const biometricType = await biometricExist();

    if (biometricType) {
      /**
       * Added by @Tarun 05-02-2025 -> if biometric exist ask for enabling it (FYN-4204)
       */

      showAlertPopup({
        title:
          biometricType === 'FaceID'
            ? t('EnableFaceId')
            : biometricType === 'TouchID'
            ? t('EnableTouchId')
            : biometricType === 'Biometrics'
            ? t('EnableFingerprint')
            : '',
        msg:
          biometricType === 'FaceID'
            ? t('FaceIdMsg')
            : biometricType === 'TouchID'
            ? t('TouchIDMsg')
            : biometricType === 'Biometrics'
            ? t('FingerprintMsg')
            : '',
        PositiveText: t('Yes'),
        NegativeText: t('No'),
        dismissOnBackPress: false,
        onPositivePress: () => {
          useLogoutStore.getState().setIsLoggingOut(false);
          /**
           * Added by @Tarun 05-02-2025 -> when user agrees to it then ask to
           * authenticate and store it in store (FYN-4204)
           */

          handleStartBiometric();
        },
        onNegativePress() {
          handleBiometricDisabled();
        },
      });
    } else {
      handleBiometricDisabled();
    }
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.select({ ios: 10, android: 500 })}
          style={styles.container}
        >
          <View style={styles.main}>
            {tenantDetail.tenantDetails?.isAuth0Enable ? (
              userInfo?.userID ? (
                <View style={styles.container}>
                  {tenantDetail?.tenantDetails?.isOktaEnabled && (
                    <OktaButton
                      loading={oktaLoading}
                      onPress={async () => {
                        if (!isLoading()) {
                          loginWithAuth0(TenantInfo.OktaTenancyName, true);
                        }
                      }}
                    />
                  )}

                  <View style={styles.parent}>
                    <AppBanner />

                    <View style={styles.btnLayout}>
                      <UserInfoView
                        loading={biometricLoading}
                        onPress={() => {
                          if (!isLoading()) {
                            handleBiometricClick();
                          }
                        }}
                        userInfo={userInfo}
                      />

                      <View style={styles.orLayout}>
                        <View style={styles.dividerLay}>
                          <Divider
                            horizontalInset
                            bold
                            style={styles.divider}
                          />
                        </View>
                        <CustomText
                          variant={TextVariants.labelLarge}
                          style={styles.or}
                        >
                          {t('Or')}
                        </CustomText>
                      </View>

                      <CustomText
                        variant={TextVariants.labelLarge}
                        style={styles.textCenter}
                      >
                        {`${t('Not')} ${userInfo?.firstName}? ${t(
                          'LoginAsAnotherUser',
                        )}`}
                      </CustomText>
                    </View>
                    <CustomText
                      variant={TextVariants.bodyLarge}
                      style={styles.buttonContainerText}
                    >
                      {t('LoginWith')}
                    </CustomText>
                    <View style={styles.buttonsContainer}>
                      <CustomButton
                        loading={smsLoading}
                        style={styles.container}
                        icon={{
                          source: Images.contactUs,
                          type: ImageType.svg,
                        }}
                        onPress={() => {
                          if (!isLoading()) {
                            loginWithAuth0('sms');
                          }
                        }}
                      >
                        {t('LoginWithPhoneShort')}
                      </CustomButton>
                      <CustomButton
                        mode={ButtonVariants.outlined}
                        loading={auth0EmailLoading}
                        style={styles.container}
                        icon={{ source: Images.email, type: ImageType.svg }}
                        onPress={() => {
                          if (!isLoading()) {
                            loginWithAuth0(TenantInfo.TenancyName);
                          }
                        }}
                      >
                        {t('LoginWithEmailShort')}
                      </CustomButton>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.container}>
                  <View style={styles.parent}>
                    <AppBanner />

                    <View style={styles.btnLayout}>
                      <CustomButton
                        loading={smsLoading}
                        icon={{ source: Images.contactUs, type: ImageType.svg }}
                        onPress={() => {
                          if (!isLoading()) {
                            loginWithAuth0('sms');
                          }
                        }}
                      >
                        {t('LoginWithPhone')}
                      </CustomButton>
                      <View style={styles.orLayout}>
                        <View style={styles.dividerLay}>
                          <Divider
                            horizontalInset
                            bold
                            style={styles.divider}
                          />
                        </View>
                        <CustomText
                          variant={TextVariants.labelLarge}
                          style={styles.or}
                        >
                          {t('Or')}
                        </CustomText>
                      </View>

                      <CustomButton
                        mode={ButtonVariants.outlined}
                        loading={auth0EmailLoading}
                        icon={{ source: Images.email, type: ImageType.svg }}
                        onPress={() => {
                          if (!isLoading()) {
                            loginWithAuth0(TenantInfo.TenancyName);
                          }
                        }}
                      >
                        {t('LoginWithEmail')}
                      </CustomButton>
                    </View>
                  </View>

                  {tenantDetail?.tenantDetails?.isOktaEnabled && (
                    <OktaButton
                      loading={oktaLoading}
                      onPress={async () => {
                        if (!isLoading()) {
                          loginWithAuth0(TenantInfo.OktaTenancyName, true);
                        }
                      }}
                    />
                  )}
                </View>
              )
            ) : (
              <View style={styles.parent}>
                <AppBanner />

                <View style={styles.loginLayout}>
                  <CustomText
                    variant={TextVariants.titleLarge}
                    style={styles.title}
                  >
                    {t('LetsSignYouIn')}
                  </CustomText>
                  {tenantList.length > 1 && (
                    <Tap
                      disableRipple
                      onPress={() => {
                        if (tenantList.length > 1) {
                          setShowTenantDropdown(true);
                        }
                      }}
                      style={styles.tenant}
                    >
                      <FormTextInput
                        name={'tenant'}
                        control={control}
                        showLabel={false}
                        placeholder={t('Tenant')}
                        prefixIcon={{
                          source: Images.home,
                          type: ImageType.svg,
                        }}
                        enabled={false}
                      />
                    </Tap>
                  )}
                  <FormTextInput
                    control={control}
                    name="email"
                    showLabel={false}
                    placeholder={t('Email')}
                    prefixIcon={{ source: Images.email, type: ImageType.svg }}
                    loading={emailLoading}
                    onChangeText={value => {
                      if (errors.email?.message == t('EmailDoesNotExist')) {
                        clearErrors('email');
                      }
                    }}
                    textCapitalization={InputTextCapitalization.none}
                    onBlur={validateEmail}
                    onSubmitEditing={e => {
                      validateEmail();
                    }}
                  />
                  <FormTextInput
                    control={control}
                    name="password"
                    inputMode={InputModes.password}
                    placeholder={t('Password')}
                    showLabel={false}
                    prefixIcon={{ source: Images.lock, type: ImageType.svg }}
                    suffixIcon={{
                      source: showPassword ? Images.eye : Images.eyeClosed,
                      type: ImageType.svg,
                      tap() {
                        setShowPassword(!showPassword);
                      },
                    }}
                    hideText={showPassword}
                  />

                  <CustomButton
                    style={styles.loginBtn}
                    loading={loading}
                    onPress={handleSubmit(onSubmit)}
                  >
                    {t('Login')}
                  </CustomButton>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>

        <CustomDropDownPopup
          loading={emailLoading}
          shown={showTenantDropDown}
          setShown={setShowTenantDropdown}
          title={t('SelectTenant')}
          items={tenantList ?? []}
          displayKey="tenantName"
          idKey="tenantId"
          selectedItem={selectedTenant}
          onItemSelected={handleTenantSelect}
        />
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    main: {
      flex: 1,
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    parent: {
      flex: 1,
      justifyContent: 'center',
      alignContent: 'center',
    },
    title: {
      marginBottom: 15,
    },
    forgetPassword: {
      alignSelf: 'flex-end',
    },
    loginBtn: {
      marginTop: 5,
    },
    orLayout: {
      flexDirection: 'column',
      alignContent: 'center',
      justifyContent: 'center',
    },
    dividerLay: { marginHorizontal: 30 },
    divider: { height: 1.5 },
    or: {
      position: 'absolute',
      backgroundColor: theme.colors.surface,
      alignSelf: 'center',
      paddingHorizontal: 10,
    },
    btnLayout: {
      marginTop: 50,
      marginHorizontal: 20,
      gap: 30,
    },
    loginLayout: {
      marginTop: 50,
      marginHorizontal: 10,
    },
    tenant: {
      padding: 0,
    },
    loginOptions: {
      marginTop: 10,
    },
    logo: {
      alignSelf: 'center',
      marginTop: 10,
      height: 100,
      width: '80%',
    },
    userInfoContainerTap: {
      overflow: 'visible',
    },
    userInfoContainer: {
      paddingTop: 45,
      gap: 10,
    },
    biometricImage: {
      alignSelf: 'center',
      marginVertical: 5,
      height: 50,
      width: 50,
    },
    profileImageView: {
      position: 'absolute',
      top: -35,
      alignSelf: 'center',
      width: 70,
      height: 70,
      borderRadius: 999,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileImage: {
      width: 70,
      height: 70,
      borderRadius: 999,
    },
    advisorLay: {
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      marginTop: 30,
    },
    textCenter: {
      textAlign: 'center',
    },
    buttonContainerText: {
      textAlign: 'center',
      marginVertical: 20,
    },
    buttonsContainer: {
      flexDirection: 'row',
      gap: 15,
    },
  });

export default Login;
