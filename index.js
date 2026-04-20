/**
 * @format
 */

import notifee, { EventType } from '@notifee/react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import 'react-native-url-polyfill/auto'; //needed for signal R
import { name as appName } from './app.json';
import App from './src/App';
import { onMessageReceived } from './src/utils/notificationUtils';

if (!AbortSignal.prototype.throwIfAborted) {
  AbortSignal.prototype.throwIfAborted = function () {
    if (this.aborted) {
      const error = new Error('This operation was aborted.');
      error.name = 'AbortError';
      throw error;
    }
  };
}

if (!AbortSignal.any) {
  AbortSignal.any = function (signals) {
    const controller = new AbortController();

    function onAbort() {
      controller.abort();
      signals.forEach(s => s.removeEventListener('abort', onAbort));
    }

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }
      signal.addEventListener('abort', onAbort);
    }

    return controller.signal;
  };
}

const messaging = getMessaging();

// background notification event listener
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  // Check if the user pressed the "Mark as read" action
  if (type === EventType.ACTION_PRESS) {
    //await notifee.cancelNotification(notification.id);
  }
});

// receive background notification
setBackgroundMessageHandler(messaging, async message => {
  //if (userStore?.getState?.()?.userDetails?.userID) {
  onMessageReceived(message, 'background');
  //}
});

// Check if app was launched in the background and conditionally render null if so
function HeadlessCheck({ isHeadless }) {
  if (isHeadless) {
    // App has been launched in the background by iOS, ignore
    return null;
  }

  // Render the app component on foreground launch
  return <App />;
}

//AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent(appName, () => HeadlessCheck);
