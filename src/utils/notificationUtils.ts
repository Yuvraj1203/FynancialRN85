import { storage } from '@/App';

import {
  NotificationDataModel,
  NotificationModel,
  UserChatList,
} from '@/services/models';
import { notificationPermissionStore } from '@/store';
import { TenantInfo } from '@/tenantInfo';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { t } from 'i18next';
import { Linking, NativeModules, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {
  RESULTS,
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';
import Log from './logger';
import { checkIntervalTime, formatDate, isEmpty, parseDate } from './utils';

const defaultChannelId = 'default';
const defaultChannelName = 'Default';
const dailyChannelId = 'daily';
const dailyChannelName = 'Daily';
const uploadDownloadChannelId = 'uploadDownload';
const uploadDownloadChannelName = 'Uploads and Downloads';
const smallIcon = 'notification_icon';

export const onMessageReceived = async (
  message: FirebaseMessagingTypes.RemoteMessage,
  type: string,
) => {
  Log(type + ' Notification=> ' + JSON.stringify(message));

  const data = message.data as NotificationDataModel;
  const notificationId = message.messageId;
  const { title, body, android } = message.notification || {};
  const timestamp = message.sentTime;
  const showTimestamp = Boolean(timestamp);
  const imageUrl = data?.fcm_options?.image || android?.imageUrl;

  try {
    const notifData: NotificationModel =
      message.data?.action && JSON.parse(message.data?.action as string);

    const isMessaging = notifData.NotiType === 'Messaging';
    const isSilent = data.type === 'silent';

    if (isMessaging) {
      if (isSilent) {
        if (!isEmpty(notifData.SenderId)) {
          removeMessageNotifications({
            groupId: notifData.GroupId,
            targetUserId: notifData.SenderId
              ? parseInt(notifData.SenderId)
              : undefined,
          });
        }
      } else {
        notificationPermissionStore
          .getState()
          .setNotificationsList(prev => [...prev, message]);
      }
    }
  } catch (e) {
    Log('Error in saving notification Data=>' + JSON.stringify(e));
  }
  if (type === 'foreground') {
    /**
     * Added by @Tarun 05-08-2025 -> Set badge count for silent push notifications
     * on iOS and Android (FYN-8554)
     */
    let badge = 0;
    if (Platform.OS == 'ios') {
      if (message.contentAvailable) {
        notifee.setBadgeCount(parseInt(message.notification?.ios?.badge!));
        return;
      } else {
        if (message.notification?.ios?.badge) {
          badge = parseInt(message.notification?.ios?.badge);
        }
      }
    } else if (Platform.OS == 'android') {
      if (data.type == 'silent' && data.Badge) {
        notifee.setBadgeCount(parseInt(data.Badge));
        return;
      } else {
        if (data?.Badge) {
          badge = parseInt(data?.Badge);
        }
      }
    }
    if (imageUrl) {
      bigPictureNotification({
        notificationId,
        title,
        body,
        imageUrl,
        timestamp,
        showTimestamp,
        data: message.data,
        badge: badge,
      });
    } else if (body) {
      const isShortBody = body.length < 60;
      if (isShortBody) {
        showNotification({
          notificationId,
          title,
          body: body,
          timestamp,
          showTimestamp,
          data: message.data,
          badge: badge,
        });
      } else {
        bigTextNotification({
          notificationId,
          title,
          body: body.substring(0, 60),
          description: body,
          timestamp,
          showTimestamp,
          data: message.data,
          badge: badge,
        });
      }
    } else {
      showNotification({
        notificationId,
        body: title,
        timestamp,
        showTimestamp,
        data: message.data,
        badge: badge,
      });
    }
  } else {
    await notifee.displayNotification(message);
  }
};

type ChatData = {
  groupId?: string | null;
  targetUserId?: number | null;
};

type NotificationData = {
  GroupId?: string | null;
  SenderId?: string | null;
};

const NULL_GROUP_ID = '00000000-0000-0000-0000-000000000000';

export const isNotificationForCurrentChat = ({
  userChatData,
  notifData,
}: {
  userChatData?: ChatData;
  notifData?: NotificationData;
}): boolean => {
  const notifGroupId = notifData?.GroupId || null;
  const notifSenderId = notifData?.SenderId
    ? parseInt(notifData.SenderId)
    : null;

  const isNotifGroup = !!notifGroupId && notifGroupId !== NULL_GROUP_ID;

  const userGroupId = userChatData?.groupId || null;
  const isUserGroupChat = !!userGroupId && userGroupId !== NULL_GROUP_ID;

  // 🟦 CASE 1: User is in group chat
  if (isUserGroupChat) {
    return (
      isNotifGroup && userGroupId!.toLowerCase() === notifGroupId!.toLowerCase()
    );
  }

  // 🟩 CASE 2: User is in individual chat
  return !isNotifGroup && userChatData?.targetUserId === notifSenderId;
};

export const removeMessageNotifications = async (
  userChatData: UserChatList,
) => {
  const notifList =
    notificationPermissionStore.getState().notificationsList || [];

  // 1️⃣ Cancel Notifee displayed notifications for this chat
  const displayed = await notifee.getDisplayedNotifications();

  for (const notif of displayed) {
    try {
      const raw = notif.notification?.data?.action;
      if (!raw) continue;

      const dispData: NotificationModel = JSON.parse(raw as string);

      if (
        isNotificationForCurrentChat({
          userChatData,
          notifData: dispData,
        }) &&
        dispData.NotiType == 'Messaging'
      ) {
        Log('Cancelling displayed notification ID: ' + notif.id);
        cancelNotification({ notificationId: notif.id });
      }
    } catch (e) {
      Log('Error parsing displayed notification => ' + JSON.stringify(e));
    }
  }

  const filteredList = notifList.filter(msg => {
    try {
      if (!msg?.data?.action) return true; // keep if no data
      const notifData: NotificationModel = JSON.parse(
        msg.data.action as string,
      );

      return !isNotificationForCurrentChat({
        userChatData,
        notifData,
      });
    } catch (e) {
      Log(
        'Error parsing notification data for message ID: ' + JSON.stringify(e),
      );
      return true; // keep on parse error
    }
  });

  notificationPermissionStore.getState().setNotificationsList(filteredList);
};

export type NotificationUtilsProps = {
  notificationId?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  data?: {
    [key: string]: string | number | object;
  };
  scheduleTime?: number;
  repeatFrequency?: RepeatFrequency;
  progressMax?: number;
  progressCurrent?: number;
  indeterminate?: boolean;
  imageUrl?: string;
  description?: string;
  timestamp?: number;
  showTimestamp?: boolean;
  showChronometer?: boolean;
  clearAll?: boolean;
  badge?: number;
};

// show simple notification
export async function showNotification(props: NotificationUtilsProps) {
  // Display a notification
  if (Platform.OS === 'android') {
    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: defaultChannelId,
      name: defaultChannelName,
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      id: props.notificationId,
      title: props.title,
      subtitle: props.subtitle,
      body: props.body,
      data: props.data,
      android: {
        channelId,
        smallIcon: smallIcon,
        timestamp: props.timestamp,
        showTimestamp: props.showTimestamp,
        lightUpScreen: true,
        badgeCount: props.badge,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
    });
  } else {
    await notifee.displayNotification({
      id: props.notificationId,
      title: props.title,
      subtitle: props.subtitle,
      body: props.body,
      data: props.data,
      ios: { badgeCount: props.badge },
    });
  }
}

export async function setDailyNotifications() {
  // // daily notification list and time
  // const times = [
  //   {
  //     hour: 11,
  //     minute: 5,
  //     notificationID: '324',
  //     title: 'Stay Hydrated for Better Health!',
  //     body: 'Water is essential for your body’s functions. Remember to drink at least 8 glasses a day to stay hydrated, boost energy, and improve overall health. Your body will thank you!',
  //   }, // trigger at 11:05 AM
  //   {
  //     hour: 16,
  //     minute: 5,
  //     notificationID: '195',
  //     title: 'Make Time for Daily Exercise!',
  //     body: 'Exercise isn’t just about losing weight; it’s about feeling great. Aim for at least 30 minutes of physical activity each day to improve your mood, strengthen your heart, and enhance your overall well-being. Let’s get moving!',
  //   }, // trigger at 4:05 PM
  // ];
  // for (const notification of times) {
  //   const nextOccurrence = getNextOccurrence(
  //     notification.hour,
  //     notification.minute,
  //   );
  //   // Create a time-based trigger
  //   createTriggerNotification({
  //     notificationId: notification.notificationID,
  //     title: notification.title,
  //     body: notification.body,
  //     timestamp: nextOccurrence,
  //     showTimestamp: true,
  //     scheduleTime: nextOccurrence,
  //     repeatFrequency: RepeatFrequency.DAILY,
  //   });
  // }
}

// cancel simple notification
export async function cancelNotification(props: NotificationUtilsProps) {
  if (props.notificationId) {
    await notifee.cancelNotification(props.notificationId);
  } else if (props.clearAll) {
    await notifee.setBadgeCount(0);
    await notifee.cancelAllNotifications();
  }
}

// schedule a notification
export async function createTriggerNotification({
  notificationId = '1475',
  title = DeviceInfo.getApplicationName(),
  scheduleTime: time = new Date().getTime(),
  repeatFrequency = RepeatFrequency.DAILY,
  ...props
}: NotificationUtilsProps) {
  // Create a time-based trigger
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: time,
    repeatFrequency: repeatFrequency,
    alarmManager: true,
  };

  // Create a trigger notification
  if (Platform.OS === 'android') {
    const channelId = await notifee.createChannel({
      id: dailyChannelId,
      name: dailyChannelName,
      importance: AndroidImportance.HIGH,
    });

    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: title,
        subtitle: props.subtitle,
        body: props.body,
        data: props.data,
        android: {
          channelId: channelId,
          smallIcon: smallIcon,
          timestamp: props.timestamp,
          showTimestamp: props.showTimestamp,
          lightUpScreen: true,
        },
      },
      trigger,
    );
  } else {
    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: title,
        subtitle: props.subtitle,
        body: props.body,
        data: props.data,
      },
      trigger,
    );
  }
}

// show progress notification
async function progressNotification({
  notificationId = '1',
  title = DeviceInfo.getApplicationName(),
  progressMax = 10,
  progressCurrent = 5,
  indeterminate = true,
  ...props
}: NotificationUtilsProps) {
  if (Platform.OS === 'android') {
    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: uploadDownloadChannelId,
      name: uploadDownloadChannelName,
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      id: notificationId,
      title: title,
      subtitle: props.subtitle,
      body: props.body,
      data: props.data,
      android: {
        channelId,
        smallIcon: smallIcon,
        timestamp: props.timestamp,
        lightUpScreen: true,
        showTimestamp: props.showTimestamp,
        progress: {
          max: progressMax,
          current: progressCurrent,
          indeterminate: indeterminate,
        },
      },
    });
  } else {
    await notifee.displayNotification({
      id: notificationId,
      title: title,
      subtitle: props.subtitle,
      body: props.body,
      data: props.data,
    });
  }
}

// show big picture notification
export async function bigPictureNotification(props: NotificationUtilsProps) {
  if (Platform.OS === 'android') {
    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: defaultChannelId,
      name: defaultChannelName,
      importance: AndroidImportance.HIGH,
    });
    await notifee.displayNotification({
      id: props.notificationId,
      title: props.title,
      subtitle: props.subtitle,
      body: props.body,
      data: props.data,
      android: {
        channelId,
        smallIcon: smallIcon,
        timestamp: props.timestamp,
        showTimestamp: props.showTimestamp,
        lightUpScreen: true,
        badgeCount: props.badge,
        style: {
          type: AndroidStyle.BIGPICTURE,
          picture: props.imageUrl ?? '',
        },
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
    });
  } else {
    await notifee.displayNotification({
      id: props.notificationId,
      title: props.title,
      subtitle: props.subtitle,
      body: props.body,
      data: props.data,
      ios: {
        badgeCount: props.badge,
        attachments: [
          {
            url: props.imageUrl ?? '',
          },
        ],
      },
    });
  }
}

// show session out/ logged out notification
export async function sessionOutNotification(props: NotificationUtilsProps) {
  const title = props.title ?? TenantInfo.AppName;
  const body = props.body ?? t('UserLoggedOut');

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: props.scheduleTime!, // Use scheduleTime to schedule the notification
  };

  if (Platform.OS === 'android') {
    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: 'security',
      name: 'Security',
      importance: AndroidImportance.MIN,
    });

    await notifee.createTriggerNotification(
      {
        id: props.notificationId,
        title: title,
        body: body,
        data: props.data,
        android: {
          channelId,
          smallIcon: smallIcon,
          showTimestamp: true,
          lightUpScreen: true,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: body,
          },
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
      },
      trigger,
    );
  } else {
    Log('Schedule time=>' + props.scheduleTime);
    await notifee.createTriggerNotification(
      {
        id: props.notificationId,
        title: title,
        body: body,
        data: props.data,
        ios: {
          foregroundPresentationOptions: {
            sound: false,
          },
        },
      },
      trigger,
    );
  }
}

// show big Text notification
export async function bigTextNotification(props: NotificationUtilsProps) {
  if (Platform.OS === 'android') {
    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: defaultChannelId,
      name: defaultChannelName,
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      id: props.notificationId,
      title: props.title,
      subtitle: props.subtitle,
      body: props.body,
      data: props.data,
      android: {
        channelId,
        smallIcon: smallIcon,
        timestamp: props.timestamp,
        showTimestamp: props.showTimestamp,
        lightUpScreen: true,
        badgeCount: props.badge,
        style: {
          type: AndroidStyle.BIGTEXT,
          text: props.description ?? '',
        },
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
    });
  } else {
    await notifee.displayNotification({
      id: props.notificationId,
      title: props.title,
      subtitle: props.subtitle,
      body: props.description,
      data: props.data,
      ios: {
        badgeCount: props.badge,
      },
    });
  }
}

// Helper function to get the next occurrence of a specific time
function getNextOccurrence(hour: number, minute: number = 0): number {
  const now = new Date();
  const targetTime = new Date();

  targetTime.setHours(hour, minute, 0, 0);

  if (now > targetTime) {
    // If the target time has already passed today, set it for tomorrow
    targetTime.setDate(targetTime.getDate() + 1);
  }

  return targetTime.getTime();
}

export const checkNotificationPermission = async (
  checkSingle?: boolean,
): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const { status } = await checkNotifications();

    if (status === RESULTS.GRANTED) {
      storage.set('notificationPermissionAsked', -1);
      return true;
    } else {
      if (checkSingle) {
        return false;
      }
      const result = await requestNotifications();
      if (result.status == RESULTS.GRANTED) {
        storage.set('notificationPermissionAsked', -1);
        return true;
      } else {
        const denialCount =
          (storage.getNumber('notificationPermissionAsked') ?? 0) + 1;
        storage.set('notificationPermissionAsked', denialCount);
        return false;
      }
    }
  } else {
    // checking for ios if user is asked for more than once
    const { status } = await checkNotifications();

    if (status === RESULTS.GRANTED) {
      storage.set('notificationPermissionAsked', -1);
      return true;
    } else {
      const denialCount =
        (storage.getNumber('notificationPermissionAsked') ?? 0) + 1;
      storage.set('notificationPermissionAsked', denialCount);
      return false;
    }
  }
};

export const openNotificationSettings = () => {
  if (Platform.OS === 'android') {
    // open android notification settings
    const packageName = NativeModules.RNDeviceInfo?.bundleId ?? '';
    return Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
      {
        key: 'android.provider.extra.APP_PACKAGE',
        value: packageName,
      },
    ]);
  } else {
    // open ios notification settings
    const bundleId = DeviceInfo.getBundleId() ?? '';
    return Linking.openURL(`App-Prefs:NOTIFICATIONS_ID&path=${bundleId}`);
  }
};

export const checkNotificationPermissionGranted = async () => {
  Log(' 1 ] checkNotificationPermissionGranted function call ');
  const permissionSettings = await notifee.requestPermission();
  return permissionSettings.authorizationStatus;
};

// Utility to check if reminder popup needs to be shown
export const shouldShowReminderPopup = (setTime?: boolean) => {
  const lastReminderDate =
    notificationPermissionStore.getState().lastReminderDate;
  if (!lastReminderDate || setTime) {
    // If no reminder has been shown yet, show the popup and store the date in Zustand store
    const date = formatDate({
      date: new Date(),
      returnFormat: 'YYYY-MM-DDTHH:mm',
    });

    notificationPermissionStore.getState().setLastReminderDate(date);
    return true;
  }

  const lastDate = parseDate({
    date: lastReminderDate,
    parseFormat: 'YYYY-MM-DDTHH:mm',
  })?.getTime();

  if (lastDate && checkIntervalTime(lastDate, { days: 7 })) {
    // If it's been 2 minutes, show the popup and update the date in Zustand store
    const date = formatDate({
      date: new Date(),
      returnFormat: 'YYYY-MM-DDTHH:mm',
    });

    notificationPermissionStore.getState().setLastReminderDate(date);
    return true;
  }

  return false;
};
