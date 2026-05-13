// SessionService.ts
import { storage } from '@/App';
import { LoginWith } from '@/services/models';
import {
  biometricStore,
  tenantDetailStore,
  useLogoutStore,
  userStore,
} from '@/store';
import { UserBiometricOption } from '@/store/biometricStore/biometricStore';
import i18n from '@/translations';
import Log from '@/utils/logger';
import {
  cancelNotification,
  NotificationUtilsProps,
  sessionOutNotification,
} from '@/utils/notificationUtils';
import { checkIntervalTime, isEmpty } from '@/utils/utils';
import { AppState, AppStateStatus, Platform } from 'react-native';

export const biometricSessionExpireTime = 5;
export const sessionExpireTime = 20;

class SessionService {
  private static instance: SessionService;
  private appStateListener?: { remove: () => void };
  private active = false;

  private activeStateRef = false;

  static getInstance() {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  start() {
    // If already active, restart fresh
    if (this.active) {
      Log('[SessionService] Restarting...');
      this.stop();
    }

    this.active = true;

    // Always re-create listener to ensure fresh state
    this.appStateListener = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );

    Log('[SessionService] Started');
  }

  stop() {
    if (!this.active) {
      Log('[SessionService] Stop called but already inactive');
      return;
    }

    this.active = false;

    // Safely remove listener if it exists
    try {
      this.appStateListener?.remove?.();
    } catch (e) {
      Log('[SessionService] Error removing AppState listener: ' + e);
    } finally {
      this.appStateListener = undefined;
    }

    Log('[SessionService] Stopped');
  }

  private handleAppStateChange = async (state: AppStateStatus) => {
    const { userDetails } = userStore.getState();
    const { isLoggingOut } = useLogoutStore.getState();

    const { apiLoading } = biometricStore.getState();

    Log(
      'AppState=> ' +
        state +
        ' isLoggingOut=>' +
        isLoggingOut +
        ' apiLoading=>' +
        apiLoading,
    );

    if (!userDetails?.userID || isLoggingOut) return;

    if (state === 'active') {
      await this.onForeground();
    } else if (/inactive|background/.test(state)) {
      await this.onBackground();
    }
  };

  public scheduleSessionExpireNotification = async (
    clearNotification = false,
  ) => {
    const scheduleTime = new Date().getTime() + sessionExpireTime * 60 * 1000; // 20 minutes later

    const notificationProps: NotificationUtilsProps = {
      notificationId: 'scheduled-session-expiry',
      timestamp: scheduleTime,
      data: {},
      showTimestamp: true,
    };

    if (clearNotification) {
      cancelNotification(notificationProps);
      return;
    }
    if (!tenantDetailStore.getState().tenantDetails?.isSessionTimeoutAllowed) {
      // don't show session out notification
      return;
    }
    //if (!loginScreenOpened(navigation)) {
    sessionOutNotification({
      ...notificationProps,
      scheduleTime,
      body: !isEmpty(
        tenantDetailStore.getState().tenantDetails?.sessionTimeoutNotifBody,
      )
        ? tenantDetailStore.getState().tenantDetails?.sessionTimeoutNotifBody
        : i18n.t('UserLoggedOut'),
    });
    //}
  };

  private async onForeground() {
    try {
      const { userDetails } = userStore.getState();

      const {
        userBiometricEnabled,
        showBiometricPopup,
        setBiometricCompleted,
        setShowBiometricBgPopup,
        setShowBiometricPopup,
        setSessionOutPopup,
        apiLoading,
        setAuthenticated,
        setPseudoLogout,
        fromSplashWithFaceIdEnabled,
        setFromSplashWithFaceIdEnabled,
        authenticatedFromSplash,
        setAuthenticatedFromSplash,
      } = biometricStore.getState();

      if (userBiometricEnabled == UserBiometricOption.enabled) {
        const biometricAuthenticateTime = storage.getNumber(
          'biometricAuthenticateTime',
        );
        const shouldAuthenticate =
          biometricAuthenticateTime === undefined ||
          checkIntervalTime(biometricAuthenticateTime, {
            min: biometricSessionExpireTime,
          });

        const shouldPseudoLogout =
          biometricAuthenticateTime === undefined ||
          checkIntervalTime(biometricAuthenticateTime, {
            min: sessionExpireTime,
          });

        setBiometricCompleted(false);

        this.scheduleSessionExpireNotification(true);

        if (Platform.OS === 'ios' && showBiometricPopup) {
          return;
        }

        if (shouldPseudoLogout) {
          setPseudoLogout(true);
          setShowBiometricBgPopup(false);
          return;
        }

        if (shouldAuthenticate) {
          setShowBiometricPopup(true);
        } else {
          setShowBiometricBgPopup(false);
          if (
            !apiLoading &&
            !fromSplashWithFaceIdEnabled &&
            !authenticatedFromSplash
          ) {
            setAuthenticated(true);
          } else {
            setBiometricCompleted(true);
            setFromSplashWithFaceIdEnabled(false);
            setAuthenticatedFromSplash(false);
          }
        }
      } else {
        const inactiveTime = storage.getNumber('inactiveTime');

        if (inactiveTime) {
          setBiometricCompleted(false);
          setShowBiometricBgPopup(false);
          if (
            userDetails?.loginWith == LoginWith.auth0 ||
            userDetails?.loginWith == LoginWith.okta ||
            userDetails?.loginWith == LoginWith.oktaWithAuth0
          ) {
            if (checkIntervalTime(inactiveTime, { min: sessionExpireTime })) {
              this.activeStateRef = false;
              setSessionOutPopup(true);
            } else {
              this.activeStateRef = true;
              //this.scheduleSessionExpireNotification(true);
              if (
                !apiLoading &&
                !fromSplashWithFaceIdEnabled &&
                !authenticatedFromSplash
              ) {
                setAuthenticated(true);
              } else {
                setFromSplashWithFaceIdEnabled(false);
                setAuthenticatedFromSplash(false);
              }
            }
          } else {
            this.activeStateRef = true;
            if (
              !apiLoading &&
              !fromSplashWithFaceIdEnabled &&
              !authenticatedFromSplash
            ) {
              setAuthenticated(true);
            } else {
              setFromSplashWithFaceIdEnabled(false);
              setAuthenticatedFromSplash(false);
            }
          }
        }
      }
    } catch (error) {
      Log('[SessionService] onForeground error: ' + JSON.stringify(error));
    }
  }

  private async onBackground() {
    try {
      const { userDetails } = userStore.getState();

      const {
        userBiometricEnabled,
        biometricCompleted,
        setBiometricCompleted,
        setShowBiometricBgPopup,
        setAuthenticated,
        setAuthenticatedFromSplash,
        setFromSplashWithFaceIdEnabled,
      } = biometricStore.getState();

      setShowBiometricBgPopup(true); // Hide screen in recent apps
      setBiometricCompleted(false);
      setAuthenticated(false);
      setAuthenticatedFromSplash(false);
      setFromSplashWithFaceIdEnabled(false);

      if (
        userBiometricEnabled == UserBiometricOption.enabled &&
        biometricCompleted
      ) {
        this.scheduleSessionExpireNotification();
        storage.set('biometricAuthenticateTime', new Date().getTime());
      } else {
        const inactiveTime = storage.getNumber('inactiveTime');
        if (inactiveTime === undefined || this.activeStateRef) {
          if (
            userDetails?.loginWith === LoginWith.auth0 ||
            userDetails?.loginWith === LoginWith.okta ||
            userDetails?.loginWith === LoginWith.oktaWithAuth0
          ) {
            this.scheduleSessionExpireNotification();
          }
          storage.set('inactiveTime', new Date().getTime());
        }
      }
    } catch (error) {
      Log('[SessionService] onBackground error: ' + JSON.stringify(error));
    }
  }
}

export const sessionService = SessionService.getInstance();
