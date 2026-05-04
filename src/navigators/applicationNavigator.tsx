import { Loader } from '@/components/molecules';
import { AlertPopup, ImagePopup, TemplatePopup } from '@/components/template';
import BiometricPopup from '@/components/template/biometricPopup/biometricPopup';
import NotificationManager, {
  notificationSeenApi,
} from '@/components/template/notificationManager/notificationManager';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetNotificationListModel,
  NotificationDataModel,
} from '@/services/models';
import signalRService from '@/services/signalRService';
import {
  appStartStore,
  badgesStore,
  biometricStore,
  templateStore,
  userStore,
} from '@/store';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import {
  getFirebaseAnalytics,
  getFirebaseMessaging,
} from '@/utils/firebase';
import Log from '@/utils/logger';
import { DdRumReactNavigationTracking } from '@datadog/mobile-react-navigation';
import { NetInfoState, useNetInfo } from '@react-native-community/netinfo';
import { logEvent } from '@react-native-firebase/analytics';
import {
  getInitialNotification,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';
import {
  LinkingOptions,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { PaperProvider } from 'react-native-paper';
import { RootNavigator } from './routes';
import { RootStackParamList } from './types';

const messaging = getFirebaseMessaging();
const analytics = getFirebaseAnalytics();

const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: ['fynancialapp://'],
  config: {
    screens: {
      Home: 'home', // for demo purpose
      Message: 'message/:id', // for demo purpose
      CustomNotification: 'customNotification/:id',
      Notification: 'notification/:url',
      Drawer: {
        screens: {
          Bottom_Bar: {
            screens: {
              Dashboard: '',
              Demo: 'demo',
            },
          },
        },
      },
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (typeof url === 'string') {
      return url;
    }
    if (!messaging) {
      return undefined;
    }
    //getInitialNotification: When the application is opened from a quit state.
    const message = await getInitialNotification(messaging);
    notificationSeenApi({
      notificationData: message?.data as NotificationDataModel,
    });
  },
  subscribe(listener: (url: string) => void) {
    const onReceiveURL = ({ url }: { url: string }) => listener(url);

    // Listen to incoming links from deep linking
    const linkingSubscription = Linking.addEventListener('url', onReceiveURL);

    //onNotificationOpenedApp: When the application is running, but in the background.
    const unsubscribe = messaging
      ? onNotificationOpenedApp(messaging, message => {
          notificationSeenApi({
            notificationData: message?.data as NotificationDataModel,
          });
        })
      : () => {};

    return () => {
      linkingSubscription.remove();
      unsubscribe();
    };
  },
};

/**
 * Added by @Tarun 05-02-2025 -> logic to handle navigation after login or
 * splash (FYN-4204)
 *
 * @param {NativeStackNavigationProp<RootStackParamList>} navigation - useAppNavigation hook
 * @param {Function} forwardFunction - function to do something after all checks where done
 * @returns {} returns void
 */
export const navigateFromApi = (
  navigation: NativeStackNavigationProp<RootStackParamList>,
  forwardFunction?: () => void,
) => {
  const userDetails = userStore.getState().userDetails;
  if (userDetails?.shouldChangePasswordOnNextLogin) {
    navigation.reset({
      index: 0,
      routes: [{ name: 'PasswordSetup' }],
    });
  } else if (userDetails?.restrictLogin) {
    navigation.reset({
      index: 0,
      routes: [{ name: 'SettingSetup' }],
    });
  } else if (!userDetails?.isOnboardingComplete && !userDetails?.isAdvisor) {
    navigation.reset({
      index: 0,
      routes: [{ name: 'TimeZone' }],
    });
  } else if (userDetails?.isInvitedIntoTemplate) {
    navigation.reset({
      index: 0,
      routes: [{ name: 'SettingSetup' }],
    });
  } else if (!userDetails?.isAgreementComplete) {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Agreement' }],
    });
  } else {
    forwardFunction?.();
  }
};

function ApplicationNavigator() {
  const theme = useTheme(); // access theme

  const { t } = useTranslation(); // translation for language specific strings.

  const navigationRef = useNavigationContainerRef(); // for analytics purpose.

  const routeNameRef = useRef<string | undefined>(undefined); // for analytics purpose.

  const internetState: NetInfoState = useNetInfo(); // to check internet connectivity.

  const isFirstRender = useRef(true); // to check internet connectivity.

  const [initialCheckDone, setInitialCheckDone] = useState(false); // to check internet connectivity.

  const appStarted = appStartStore(state => state.appStartedFromNotification);

  const userDetails = userStore(state => state.userDetails);

  const setBadges = badgesStore(state => state.setBadges);

  const biometricCompleted = biometricStore(state => state.biometricCompleted);

  /* pass this appTheme to PaperProvider and NavigationContainer to set global theme START */

  const appTheme = useTheme();

  const { isInternetReachable, isConnected } = useNetInfo();

  useEffect(() => {
    if (userDetails?.userID) {
      if (Platform.OS == 'ios' && isConnected) {
        signalRService.start();
      } else if (isInternetReachable) {
        signalRService.start();
      }
    }
  }, [isInternetReachable, isConnected]);

  /* pass this appTheme to PaperProvider and NavigationContainer to set global theme END */
  // as it shows frequent no internet temp comented
  /* Show snackbar when internet state change START */
  // useEffect(() => {
  //   if (isFirstRender.current) {
  //     isFirstRender.current = false;
  //     return;
  //   }
  //   if (initialCheckDone) {
  //     if (internetState.isInternetReachable === true) {
  //       showSnackbar(t('Online'), 'success');
  //     } else {
  //       showSnackbar(t('InternetNotAvailable'), 'danger');
  //     }
  //   } else {
  //     setInitialCheckDone(true);
  //     if (internetState.isInternetReachable === false) {
  //       showSnackbar(t('InternetNotAvailable'), 'danger');
  //     }
  //   }
  // }, [internetState.isInternetReachable]);
  /* Show snackbar when internet state change END */

  /* Check for in app updates START */
  // const inAppUpdates = new SpInAppUpdates(false);

  // inAppUpdates.checkNeedsUpdate().then(result => {
  //   if (result.shouldUpdate) {
  //     let updateOptions: StartUpdateOptions = {};
  //     if (Platform.OS === 'android') {
  //       updateOptions = {
  //         updateType: IAUUpdateKind.FLEXIBLE,
  //       };
  //     }
  //     inAppUpdates.startUpdate(updateOptions);
  //   }
  // });
  /* Check for in app updates END */

  /**
   * Added by @Tarun 05-08-2025 -> Trigger notification APIs after app starts (FYN-8554)
   */
  // useEffect(() => {
  //   if (userDetails && appStarted) {
  //     Log('App Started');
  //     callNotificationsApis();
  //   }
  // }, [appStarted]);

  /**
   * Added by @Tarun 05-08-2025 -> Fetch new feed info for non-advisors on template change (FYN-8554)
   */
  useEffect(() => {
    if (userDetails && !userDetails?.isAdvisor && appStarted) {
      getFeedHasNewInfoApi.mutate({
        Id: templateStore.getState().selectedTemplate?.groupID,
      });
    }
  }, [templateStore.getState().selectedTemplate]);

  /**
   * Added by @Tarun 05-08-2025 -> Call notifications API when app becomes active (FYN-8554)
   */
  useEffect(() => {
    if (userDetails && biometricCompleted) {
      Log('Biometric Completed');
      signalRService.start();
      callNotificationsApis();
    }
  }, [biometricCompleted]);

  /**
   * Added by @Tarun 05-08-2025 -> Calls all notification related APIs (FYN-8554)
   */
  const callNotificationsApis = () => {
    getUnseenThreadCountApi.mutate({});
    getUserNotificationsApi.mutate({});
    if (!userDetails?.isAdvisor && templateStore.getState().selectedTemplate) {
      getFeedHasNewInfoApi.mutate({
        Id: templateStore.getState().selectedTemplate?.groupID,
      });
    }
  };

  /**
   * Added by @Tarun 05-08-2025 -> API to get unseen message thread count (FYN-8554)
   */
  const getUnseenThreadCountApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<number>({
        endpoint: ApiConstants.GetUnseenThreadCount,
        method: HttpMethodApi.Get,
        data: sendData,
        byPassRefresh: true,
      }); // API Call
    },
    onSuccess(data, variables, context) {
      setBadges(prev => ({
        ...prev,
        messageCount: data.result,
      }));
    },
  });

  /**
   * Added by @Tarun 05-08-2025 -> API call for fetching notification bell count (FYN-8554)
   */
  const getUserNotificationsApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<GetNotificationListModel>({
        endpoint: ApiConstants.GetUserNotifications,
        method: HttpMethodApi.Get,
        data: sendData,
        byPassRefresh: true,
      }); // API Call
    },
    onSuccess(data, variables, context) {
      // Success Response

      setBadges(prev => ({
        ...prev,
        notificationCount:
          data.result?.unseenCount == 0 ? 0 : data.result?.unseenCount,
      }));
    },
  });

  /**
   * Added by @Tarun 05-08-2025 -> API to check if feed has new information (FYN-8554)
   */
  const getFeedHasNewInfoApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.GetFeedHasNewInfo,
        method: HttpMethodApi.Get,
        data: sendData,
        byPassRefresh: true,
      }); // API Call
    },
    onSuccess(data, variables, context) {
      setBadges(prev => ({
        ...prev,
        hasNewFeed: data.result,
      }));
    },
  });

  return (
    <PaperProvider theme={appTheme}>
      <>
        <NavigationContainer
          theme={appTheme}
          linking={linking}
          ref={navigationRef}
          onReady={() => {
            routeNameRef.current = navigationRef.getCurrentRoute()?.name;
            DdRumReactNavigationTracking.startTrackingViews(
              navigationRef.current,
            );
          }}
          onStateChange={async () => {
            const previousRouteName = routeNameRef.current;
            const currentRouteName = navigationRef.getCurrentRoute()?.name;

            const trackScreenView = async (screenName: string | undefined) => {
              if (!analytics) {
                return;
              }
              await logEvent(analytics, 'screen_view' as any, {
                screen_name: currentRouteName,
                screen_class: currentRouteName,
              });
            };

            if (previousRouteName !== currentRouteName) {
              routeNameRef.current = currentRouteName;
              trackScreenView(currentRouteName);
            }
          }}
        >
          <RootNavigator />

          <TemplatePopup />
          <AlertPopup />
          <ImagePopup />
          <NotificationManager />
          <BiometricPopup />
          <Loader />

          <FlashMessage position="bottom" style={{ marginBottom: 64 }} />
        </NavigationContainer>

        {/* <AuthenticationBg /> */}
      </>
    </PaperProvider>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    headerIcon: { height: 30, width: 30 },
  });

export default ApplicationNavigator;
