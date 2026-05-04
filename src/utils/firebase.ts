import { getAnalytics } from '@react-native-firebase/analytics';
import { getApp, getApps } from '@react-native-firebase/app';
import { getMessaging } from '@react-native-firebase/messaging';

export const isFirebaseConfigured = () => getApps().length > 0;

export const getFirebaseApp = () => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  return getApp();
};

export const getFirebaseMessaging = () => {
  const app = getFirebaseApp();
  return app ? getMessaging(app) : null;
};

export const getFirebaseAnalytics = () => {
  const app = getFirebaseApp();
  return app ? getAnalytics(app) : null;
};
