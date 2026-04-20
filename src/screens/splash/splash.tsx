import { AppVersion, storage } from '@/App';
import { CustomImage, CustomText, Shadow } from '@/components/atoms';
import { ResizeModeType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { SafeScreen } from '@/components/template';
import { showAlertPopup } from '@/components/template/alertPopup/alertPopup';
import { sessionService } from '@/components/template/biometricPopup/sessionService';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import { CheckVersionModel, GetTenantIdByNameModel } from '@/services/models';
import {
  authenticationTokenStore,
  biometricStore,
  tenantDetailStore,
  userStore,
} from '@/store';
import { UserBiometricOption } from '@/store/biometricStore/biometricStore';
import { TenantInfo } from '@/tenantInfo';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { getAccessTokenFromKeychain } from '@/utils/keychainUtils';
import Log from '@/utils/logger';
import { useAppNavigation } from '@/utils/navigationUtils';
import {
  appResumeCallback,
  openUrl,
  showSnackbar,
  useLogout,
} from '@/utils/utils';
import notifee from '@notifee/react-native';
import { createConfig } from '@okta/okta-react-native';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, Platform, StyleSheet, View } from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';

const { width, height } = Dimensions.get('window');

function Splash() {
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

  /** Added by @Tarun 05-02-2025 -> store version data to show popup after user visit app store (FYN-4204) */
  const [checkVersionData, setCheckVersionData] = useState<CheckVersionModel>();

  const { authorize } = useAuth0();

  /** Added by @Tarun 05-02-2025 -> logout user if any api fails (FYN-4204) */
  const { logout } = useLogout();

  /** Added by @Yuvraj 07-10-2025 -> user store */
  const userData = userStore();

  /** Added by @Yuvraj 07-10-2025 -> user store */
  const showNoInternetRef = useRef<string>(undefined);

  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const retryCountRef = useRef(0);

  useEffect(() => {
    handleAppStart();
  }, []);

  const handleBadgeCount = async () => {
    await notifee.setBadgeCount(0);
  };

  const getTenancyName = (url?: string) => {
    const match = url?.match(/^https?:\/\/([^\.]+)/);
    return match?.[1] ?? null;
  };
  const handleAppStart = (retry?: boolean) => {
    if (retry) {
      if (showNoInternetRef.current != t('InternetNotAvailableShort')) {
        retryCountRef.current += 1;

        // Reset logout timer
        resetLogoutTimer();
      }
    }

    showNoInternetRef.current = undefined;
    sessionService.stop();
    setTimeout(() => {
      getTenantIdByNameApiCall.mutate({
        TenancyName:
          getTenancyName(tenantDetail?.tenantDetails?.tenantURL) ??
          TenantInfo.TenancyName,
      });
      if (tenantDetail?.tenantDetails) {
        checkVersionApiCall.mutate({
          buildVersion: AppVersion,
          tenantId: tenantDetail.tenantDetails?.tenantId,
        });
      }
    }, 10);
  };

  /** Added by @Tarun 05-02-2025 -> if user returns without updating app then show update popup (FYN-4204) */
  appResumeCallback(() => {
    if (checkVersionData) {
      if (checkVersionData?.isForceUpdate) {
        showAlertPopup({
          title: t('UpdateApp'),
          msg: checkVersionData?.message,
          PositiveText: t('Update'),
          dismissOnBackPress: false,
          onPositivePress: () => {
            if (Platform.OS == 'android') {
              openUrl(checkVersionData?.playStoreURL);
            } else {
              openUrl(
                'itms-apps://itunes.apple.com/us/app/apple-store/' +
                  checkVersionData?.appStoreURL,
              );
            }
          },
        });
      }
    }
  });

  const initializeOkta = async () => {
    await createConfig({
      issuer: `https://${TenantInfo.OktaDomain}/oauth2/default`,
      clientId: TenantInfo.OktaClientId,
      redirectUri: `${TenantInfo.PackageName}:/callback`,
      endSessionRedirectUri: `${TenantInfo.PackageName}:/logout`,
      discoveryUri: `https://${TenantInfo.OktaDomain}/oauth2/default`,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      requireHardwareBackedKeyStore: true,
    });
  };

  const forceLogout = async () => {
    // cleanup
    retryCountRef.current = 0;
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    await logout({ noNavigation: true, hardLogout: true });
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const startLogoutTimer = () => {
    // Clear any old running timer
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }

    // Start new 10s timer
    logoutTimerRef.current = setTimeout(() => {
      forceLogout();
    }, 10000);
  };

  const resetLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    startLogoutTimer();
  };

  const clearLogoutState = () => {
    retryCountRef.current = 0;

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const handleErrorCase = (msg?: string) => {
    if (t('InternetNotAvailable') === msg) {
      showNoInternetRef.current = t('InternetNotAvailableShort');
      return;
    }

    showNoInternetRef.current = msg;

    // If user has already retried 3 times → logout immediately
    if (retryCountRef.current >= 4) {
      forceLogout();
      return;
    }

    // Start the countdown timer
    startLogoutTimer();
  };

  /** Added by @Tarun 31-01-2025 -> getTenantIdByNameApiCall call to get tenant detail START (FYN-4204) */
  const getTenantIdByNameApiCall = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetTenantIdByNameModel>({
        endpoint: ApiConstants.GetTenantIdByName,
        method: HttpMethodApi.Get,
        data: sendData,
        cancelable: false, // ✅ this request should not be cancelled
        headers: { Authorization: ' ' },
      }); // API Call
    },
    onMutate(variables, context) {
      showNoInternetRef.current = undefined;
    },
    onSettled(data, error, variables, onMutateResult, context) {
      /** Added by @Tarun 18-02-2025 -> initialize okta (FYN-4042) */

      handleTenantApi(data?.result ?? tenantDetail.tenantDetails);
      if (data?.result) {
        clearLogoutState();
      }
    },
    onError(error, variables, context) {
      // Error Response
      Log('error=>' + error.message);
      if (error.message == t('InternetNotAvailable')) {
        showNoInternetRef.current = t('InternetNotAvailableShort');
      } else {
        showSnackbar(t('UnderMaintenance'), 'danger');
      }

      //handleErrorCase(error.message);
    },
  });
  /** Added by @Tarun 31-01-2025 -> getTenantIdByNameApiCall call to get tenant detail END (FYN-4204) */

  const handleTenantApi = (data?: GetTenantIdByNameModel) => {
    /** Added by @Tarun 09-02-25 ---> call check version api to force update app (FYN-4042) */
    if (!tenantDetail.tenantDetails) {
      checkVersionApiCall.mutate({
        buildVersion: AppVersion,
        tenantId: data?.tenantId,
      });
    }

    if (data?.isOktaEnabled) {
      initializeOkta();
      /** Added by @Tarun 31-01-2025 -> store tenant details in store (FYN-4204) */
      tenantDetail.setTenantDetails({ ...data, isOktaEnabled: true });
    } else {
      /** Added by @Tarun 31-01-2025 -> store tenant details in store (FYN-4204) */
      tenantDetail.setTenantDetails(data);
    }

    // /** Added by @Tarun 31-01-2025 -> store tenant details in store (FYN-4204) */
    // tenantDetail.setTenantDetails(data.result);
  };

  /** Added by @Tarun 31-01-2025 -> checkVersionApiCall call to force update app START (FYN-4204) */
  const checkVersionApiCall = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<CheckVersionModel>({
        endpoint: ApiConstants.CheckVersion,
        method: HttpMethodApi.Get,
        data: sendData,
        cancelable: false, // ✅ this request should not be cancelled
        headers: { Authorization: ' ' },
      });
    },
    onMutate(variables, context) {
      showNoInternetRef.current = undefined;
    },
    onSuccess: async (data, variables, context) => {
      clearLogoutState();
      if (data.result?.isForceUpdate) {
        /** Added by @Tarun 09-02-25 ---> if force update is avaibale then save in state (FYN-4042) */
        setCheckVersionData(data.result);

        /** Added by @Tarun 09-02-25 ---> show popup to update app (FYN-4042) */
        showAlertPopup({
          title: t('UpdateApp'),
          msg: data.result.message,
          PositiveText: t('Update'),
          dismissOnBackPress: false,
          onPositivePress: () => {
            /** Added by @Tarun 09-02-25 ---> platform specific url to update app (FYN-4042) */
            if (Platform.OS == 'android') {
              openUrl(data.result?.playStoreURL);
            } else {
              openUrl(
                'itms-apps://itunes.apple.com/us/app/apple-store/' +
                  data.result?.appStoreURL,
              );
            }
          },
        });
      } else {
        /**
         * Added by @Tarun 09-02-25 ---> if user is logged in then check if token is expired
         * if token is not expired then call further api's (FYN-4042)
         */

        if (
          userStore.getState().userDetails != undefined &&
          authenticationTokenStore.getState().isLoggedIn
        ) {
          const access = await getAccessTokenFromKeychain();

          if (access == undefined) {
            Log('Logged out beacuse of keychain token');
            logout({ noNavigation: false, hardLogout: true });
            return;
          }
          /** Added by @Tarun 09-02-25 ---> show session out popup (FYN-4042) */
          handleBiometricClick();
        } else {
          handleBadgeCount();
          /** Added by @Tarun 09-02-25 ---> go to login when user is not logged in (FYN-4042) */
          if (authenticationTokenStore.getState().isLoggedIn == undefined) {
            Log('before app version 2.0.2');
            logout({ noNavigation: false, hardLogout: true });
            return;
          }
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }
    },
    onError(error, variables, context) {
      // Error Response
      handleErrorCase(error.message);
    },
  });
  /** Added by @Tarun 31-01-2025 -> checkVersionApiCall call to force update app START (FYN-4204) */

  const handleBiometricClick = async () => {
    try {
      const openedSettings = storage.getBoolean('FaceIdSettings');
      if (Platform.OS === 'ios' && openedSettings) {
        storage.set('FaceIdSettings', false);
        const status = await check(PERMISSIONS.IOS.FACE_ID);
        Log('FaceID Permission splash => ' + status);

        if (status === RESULTS.DENIED || status === RESULTS.BLOCKED) {
          // Try requesting permission if not permanently blocked
          biometricStore.getState().setFromSplashWithFaceIdEnabled(true);
        } else {
          biometricStore
            .getState()
            .setUserBiometricEnabled(UserBiometricOption.enabled);

          biometricStore.getState().setAuthenticatedFromSplash(true);
        }
      } else {
        biometricStore.getState().setAuthenticatedFromSplash(true);
      }
    } catch (error) {
      Log('handleBiometricClick Error => ' + JSON.stringify(error));
      biometricStore.getState().setAuthenticatedFromSplash(true);
    }
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        <CustomImage
          source={Images.appBanner}
          style={[styles.image]}
          resizeMode={ResizeModeType.contain}
        />
        <View style={styles.splashLoading}>
          <Image
            source={Images.splashLoading}
            style={styles.splashLoadingGif}
          />
          {showNoInternetRef.current !== undefined && (
            <Shadow
              onPress={() => {
                handleAppStart(true);
              }}
              disableRipple={false}
              style={styles.noInternet}
              tapStyle={styles.noInternetTap}
            >
              <CustomText
                style={styles.noInternetDesc}
                color={theme.colors.onError}
              >
                {showNoInternetRef.current}
              </CustomText>
              <CustomText
                style={styles.retryTap}
                variant={TextVariants.bodyLarge}
                color={theme.colors.onErrorContainer}
              >
                {t('TapToRetry')}
              </CustomText>
            </Shadow>
          )}
        </View>
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: width * 0.5, // Adjust the size as needed
      height: height * 0.5, // Adjust the size as needed
    },
    splashLoading: {
      position: 'absolute',
      bottom: 50,
      left: 10,
      right: 10,
    },
    splashLoadingGif: {
      width: 150,
      height: 150,
      alignSelf: 'center',
    },
    noInternet: {
      alignItems: 'center',
      padding: 10,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.danger,
      flexDirection: 'row',
      gap: 10,
    },
    noInternetTap: {
      padding: 0,
      marginHorizontal: 5,
      borderRadius: theme.roundness,
    },
    noInternetDesc: {
      flex: 1,
    },
    retryTap: {
      backgroundColor: theme.colors.onError,
      padding: 10,
      borderRadius: theme.roundness,
    },
  });

export default Splash;
