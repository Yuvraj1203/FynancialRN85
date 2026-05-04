import { AppVersion, storage } from '@/App';
import { CustomButton, CustomImage, CustomText, Tap } from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomBottomPopup } from '@/components/molecules';
import { hideLoader, showLoader } from '@/components/molecules/loader/loader';
import { ChatProps, ChatScreenParent } from '@/screens/chat/chat';
import { CommunityParentScreenType } from '@/screens/community/community';
import { ContactVaultParentScreenType } from '@/screens/contactVault/contactVault';
import { FeedParentScreenType } from '@/screens/feed/feed';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetUserActiveTemplateModel,
  LoginWith,
  NotificationDataModel,
  NotificationModel,
} from '@/services/models';
import {
  appStartStore,
  biometricStore,
  notificationPermissionStore,
  templateStore,
  useLogoutStore,
  userStore,
} from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { getAccessTokenFromKeychain } from '@/utils/keychainUtils';
import Log from '@/utils/logger';
import {
  parseRouteToDynamicReset,
  useAppNavigation,
} from '@/utils/navigationUtils';
import {
  checkNotificationPermission,
  isNotificationForCurrentChat,
  onMessageReceived,
  openNotificationSettings,
  shouldShowReminderPopup,
} from '@/utils/notificationUtils';
import {
  appResumeCallback,
  formatDate,
  isEmpty,
  loginScreenOpened,
} from '@/utils/utils';
import notifee, {
  AndroidNotificationSetting,
  AuthorizationStatus,
  EventType,
} from '@notifee/react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import CustomPopup from '../../molecules/customPopup/customPopup';

// call notification data api and then call notification seen api and navigate
// to specific screen according to api response
type Props = {
  notificationData?: NotificationDataModel;
  fromNotificationScreen?: boolean;
};

export const notificationSeenApi = async (props: Props): Promise<boolean> => {
  const userDetails = userStore.getState().userDetails; // user store to access user information.
  if (userDetails == undefined) {
    return false;
  }
  try {
    // Determine notification ID if not provided
    if (props.notificationData?.action) {
      try {
        const notifData: NotificationModel = JSON.parse(
          props.notificationData.action,
        );

        // Navigate based on notification type
        if (notifData) {
          appStartStore.getState().setOpenedNotificationData({
            ...notifData,
            fromNotificationScreen: props.fromNotificationScreen,
          });
        }
      } catch (err) {
        Log('Error in notificationSeenApi parsing: ' + err);
        return false; // Return false if any error occurs during parsing
      }
    }

    return true; // Return true if everything was successful
  } catch (error) {
    Log('Error in notificationSeenApi: ' + error);
    return false; // Return false if any error occurs
  }
};

function NotificationManager() {
  const navigation = useAppNavigation(); // navigation

  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // access StylesSheet with theme implemented

  const { t } = useTranslation(); //translation

  const userDetails = userStore(state => state.userDetails); // user store to access user information.

  const notificationPermissionStoreData = notificationPermissionStore(); // notification Permission to show popup.

  const [showNotificationPermissionPopup, setShowNotificationPermissionPopup] =
    useState(false); // show notification Permission dialog

  const [
    showNotificationAlarmPermissionPopup,
    setShowNotificationAlarmPermissionPopup,
  ] = useState(false); // show notification Alarm Permission dialog

  const [openAppSettings, setOpenAppSettings] = useState(false); // when user open settings

  const [openAlarmSettings, setOpenAlarmSettings] = useState(false); // when user open alarm settings

  const notificationOpened = appStartStore(); // get notification data

  const biometricCompleted = biometricStore(state => state.biometricCompleted);

  const app = getApp();
  const messaging = getMessaging(app);
  const [showAllowNotiReminderPopup, setShowAllowNotiReminderPopup] =
    useState(false); // show Allow Notification Reminder dialog

  useEffect(() => {
    // ask for notification permission after 5 sec
    if (storage.getString('FcmToken')) {
      Log('FCM Token=>' + storage.getString('FcmToken'));
    }
    setTimeout(() => {
      init({ appStart: true });
    }, 3000);

    // receive foreground notification
    const foregroundNotificationListener = onMessage(messaging, message => {
      // if (navigation.getState() && navigation.getState().routes) {
      const currentRoute = navigation.getState().routes?.at(-1); // Get last route in stack
      if (currentRoute?.name == 'Chat') {
        //const signalRMessageReceived = useSignalRStore.getState().messageList;
        const params = currentRoute?.params as ChatProps;

        const notifData: NotificationModel =
          message.data?.action && JSON.parse(message.data?.action as string);

        if (
          message.data?.type != 'silent' &&
          isNotificationForCurrentChat({
            userChatData: params?.userChatData,
            notifData,
          })
        ) {
          return;
        }
      }

      return onMessageReceived(message, 'foreground');
      // } else {
      //   return onMessageReceived(message, 'foreground');
      // }
    });

    // foregorund notification event
    const foregroundNotificationEvent = notifee.onForegroundEvent(
      ({ type, detail }) => {
        switch (type) {
          case EventType.DISMISSED:
            //showSnackbar('Notification Dismissed', 'danger');
            break;
          case EventType.PRESS:
            // call api to mark notification seen and navigate user according to api response
            Log('NotifData=>' + JSON.stringify(detail));
            notificationSeenApi({
              notificationData: detail.notification
                ?.data as NotificationDataModel,
              fromNotificationScreen: true,
            });
            break;
        }
      },
    );

    const tokenRefresh = onTokenRefresh(messaging, async newToken => {
      Log('FCM Token Refreshed=>' + newToken);
      if (storage.getString('FcmToken')) {
        if (storage.getString('FcmToken') != newToken) {
          Log('FCM Token Refreshed stored=>' + newToken);
          storage.set('FcmToken', newToken);

          // if user allowed notification and user is logged in then call api to save fcm token on server
          if (userDetails) {
            callCreateOrEditApi();
          }
        }
      }
    });

    // unsubscribe listener when component dismount
    return () => {
      foregroundNotificationListener();
      foregroundNotificationEvent();
      tokenRefresh();
    };
  }, []);

  // handle redirection when app starts from notification
  useEffect(() => {
    if (userDetails && notificationOpened.appStartedFromNotification) {
      if (notificationOpened.openedNotificationData) {
        if (loginScreenOpened(navigation)) {
          handleBiometric();
        } else {
          if (biometricCompleted) {
            openNotifications();
          }
        }
      } else {
        checkNotifPermission();
      }
    }
  }, [
    notificationOpened.appStartedFromNotification,
    notificationOpened.openedNotificationData,
  ]);

  const handleBiometric = async () => {
    if (
      userDetails?.loginWith == LoginWith.auth0 ||
      userDetails?.loginWith == LoginWith.oktaWithAuth0
    ) {
      if (await InAppBrowser.isAvailable()) {
        InAppBrowser.close();
        setTimeout(() => {
          useLogoutStore.getState().setIsLoggingOut(false);
          Log('isLoggingOut=>Remove broswer = false');
        }, 0);
      }

      setTimeout(() => {
        biometricStore.getState().setAuthenticatedFromSplash(true);
      }, 0);
    } else {
      openNotifications();
    }
  };

  // handle redirection when app starts from notification
  useEffect(() => {
    if (userDetails && notificationOpened.appStartedFromNotification) {
      if (notificationOpened.openedNotificationData && biometricCompleted) {
        openNotifications();
      }
    }
  }, [biometricCompleted]);

  const openNotifications = async () => {
    if (await InAppBrowser.isAvailable()) {
      InAppBrowser.close();
      setTimeout(() => {
        useLogoutStore.getState().setIsLoggingOut(false);
        Log('isLoggingOut=>Remove broswer = false');
      }, 0);
    }

    setTimeout(() => {
      showLoader();
      handleNotification(notificationOpened.openedNotificationData);
    }, 100);
  };

  const checkNotifPermission = async () => {
    const showReminder = shouldShowReminderPopup();
    const permissionStatus = await checkNotificationPermission(true);
    if (showReminder && !permissionStatus) {
      // Show the reminder pop-up
      setShowAllowNotiReminderPopup(true);
    } else {
      handleAllowedNotif();
    }
  };

  const init = async ({ appStart = true, returnFromSettings = false }) => {
    if (appStart) {
      // called when app starts
      const notifPermissionCount =
        storage.getNumber('notificationPermissionAsked') ?? 0;

      const permissionStatus = await checkNotificationPermission(true);
      if (notifPermissionCount > 0 && !permissionStatus) {
        // if notification permission denied then don't proceed
        return null;
      }
    }
    if (!returnFromSettings) {
      var settings = await notifee.requestPermission(); // request notification permission

      if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
        handleAllowedNotif();
      } else if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
        handleDeniedNotif();
      } else if (
        settings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED
      ) {
        shouldShowReminderPopup(true);
      }
    } else {
      const permissionStatus = await checkNotificationPermission(true);
      if (permissionStatus) {
        handleAllowedNotif();
      } else {
        handleDeniedNotif();
      }
    }
  };

  const handleAllowedNotif = async () => {
    storage.set('notificationPermissionAsked', -1);

    // Get the token
    await registerDeviceForRemoteMessages(messaging);
    const token = await getToken(messaging);

    // storing fcm token
    Log('FCM Token=>' + token);

    if (token) {
      if (token != storage.getString('FcmToken')) {
        storage.set('FcmToken', token);
        const access = await getAccessTokenFromKeychain();
        if (access != undefined && userDetails?.userID) {
          callCreateOrEditApi();
        }
      } else {
        Log('Token matched');
      }
    }
    // daily updates notification need permission for alarm permission (Android specific)
    if (!storage.getBoolean('alarmPermission')) {
      if (Platform.OS === 'android') {
        const notifSettings = await notifee.getNotificationSettings();
        if (notifSettings.android.alarm == AndroidNotificationSetting.ENABLED) {
          storage.set('alarmPermission', true);
          setShowNotificationAlarmPermissionPopup(false);
        } else {
          setShowNotificationAlarmPermissionPopup(true);
        }
      }
    }
  };

  const handleDeniedNotif = () => {
    shouldShowReminderPopup(true);
    Log('User denied Notification permissions request');

    storage.set('notificationPermissionAsked', 1); // notification permission denied
  };

  appResumeCallback(() => {
    if (openAppSettings) {
      init({ appStart: false, returnFromSettings: true });
      setOpenAppSettings(false);
    }
    if (openAlarmSettings) {
      init({ appStart: false, returnFromSettings: true });
      setOpenAlarmSettings(false);
    }
    if (notificationOpened.appStartedFromNotification) {
      checkNotifPermission();
    }
  });

  const handleApiCall = async (notifData?: NotificationModel) => {
    await makeRequest<number>({
      endpoint: ApiConstants.SetNotificationAsRead,
      method: HttpMethodApi.Post,
      data: {
        id: notifData?.NotifId,
      },
    })
      .then(resp => {
        Log('Notification Seen=>' + JSON.stringify(resp));
      })
      .catch(error => {
        Log('Error in Notification Seen=>' + JSON.stringify(error));
      });

    if (!userDetails?.isAdvisor) {
      await makeRequest<GetUserActiveTemplateModel[]>({
        endpoint: ApiConstants.GetUserActiveTemplate,
        method: HttpMethodApi.Get,
        data: {},
      })
        .then(data => {
          if (data.result && data.result.length > 0) {
            /** Added by @Tarun 17-02-2025 -> format start date and end date for template */

            const newList = data.result.map(item => ({
              ...item,
              startDate: item.startDate
                ? formatDate({
                    date: item.startDate,
                    parseFormat: 'YYYY-MM-DDTHH:mm:ss',
                    returnFormat: 'MMMM DD, YYYY',
                  })
                : '',
              endDate: item.endDate
                ? formatDate({
                    date: item.endDate,
                    parseFormat: 'YYYY-MM-DDTHH:mm:ss',
                    returnFormat: 'MMMM DD, YYYY',
                  })
                : '',
            }));

            const templateList = newList;
            const templateData = templateStore.getState();

            if (templateData.templateList && templateData.selectedTemplate) {
              const findTemplate = templateList.find(
                item =>
                  item.programSessionID == notifData?.SessionId &&
                  item.groupID?.toLowerCase() ==
                    notifData?.GroupId?.toLowerCase(),
              );
              if (!findTemplate) {
                templateData.setSelectedTemplate(templateList.at(0));
              } else {
                if (
                  findTemplate.programSessionID !=
                  templateData.selectedTemplate?.programSessionID
                ) {
                  templateData.setSelectedTemplate(findTemplate);
                }
              }
              templateData.setTemplateList(templateList);
            } else {
              if (
                isEmpty(notifData?.SessionId) &&
                isEmpty(notifData?.GroupId)
              ) {
                templateData.setSelectedTemplate(templateList.at(0));
                templateData.setTemplateList(templateList);
              } else {
                templateData.setSelectedTemplate(
                  templateList.find(
                    item =>
                      item.programSessionID == notifData?.SessionId &&
                      item.groupID?.toLowerCase() ==
                        notifData?.GroupId?.toLowerCase(),
                  ),
                );
                templateData.setTemplateList(templateList);
              }
            }
          }
        })
        .catch(error => {
          Log('Session Api From Notification Error=>' + JSON.stringify(error));
        });
    }
  };

  const handleNotification = (notificationData?: NotificationModel) => {
    // reset notification data when app gets opened and redirected to desired screen
    handleApiCall(notificationData);
    notificationOpened.setOpenedNotificationData(undefined);

    const type = notificationData?.NotiType ?? '';
    if (['Messaging', 'NotifyAdvisor'].includes(type)) {
      const isGroupChat =
        notificationData?.AdminId && notificationData?.AdminId != '0';
      if (notificationData?.fromNotificationScreen) {
        if (notificationData.SenderId) {
          navigation.reset(
            parseRouteToDynamicReset(
              {
                screen: 'DrawerRoutes',
                params: {
                  screen: 'BottomBarRoutes',
                  params: {
                    screen: 'Message',
                  },
                },
              },
              {
                screen: 'Chat',
                data: {
                  userChatData: {
                    targetUserId: parseInt(notificationData?.SenderId!),
                    targetUserName: notificationData?.SenderName,
                    userFullName: isGroupChat
                      ? notificationData.GroupName
                      : notificationData?.SenderName,
                    groupId: isGroupChat ? notificationData.GroupId : undefined,
                    groupName: notificationData.GroupName,
                  },
                  screenType: ChatScreenParent.fromNotification,
                },
              },
            ),
          );
        }
      } else {
        if (notificationData?.SenderId) {
          navigation.reset(
            parseRouteToDynamicReset(
              {
                screen: 'DrawerRoutes',
                params: {
                  screen: 'BottomBarRoutes',
                  params: {
                    screen: 'Message',
                  },
                },
              },
              {
                screen: 'Chat',
                data: {
                  userChatData: {
                    targetUserId: parseInt(notificationData?.SenderId!),
                    targetUserName: notificationData?.SenderName,
                    userFullName: isGroupChat
                      ? notificationData.GroupName
                      : notificationData?.SenderName,
                    groupId: isGroupChat ? notificationData.GroupId : undefined,
                    groupName: notificationData.GroupName,
                  },
                  screenType: ChatScreenParent.fromNotification,
                },
              },
            ),
          );
        }
      }
    } else if (type?.includes('Feed')) {
      let postId;
      let commentId;
      let replyId;

      if (notificationData?.PostType == 'C') {
        postId = notificationData.ParentPostId;
        commentId = notificationData.PostId;
      } else if (notificationData?.PostType == 'R') {
        postId = notificationData.ParentOfParentPostId;
        commentId = notificationData.ParentPostId;
        replyId = notificationData.PostId;
      } else {
        postId = notificationData?.PostId;
      }

      if (notificationData?.fromNotificationScreen) {
        if (userDetails?.isAdvisor) {
          navigation.navigate('ContactFeed', {
            navigationFrom: FeedParentScreenType.fromNotification,
            postId: postId,
            sessionId: notificationData.SessionId,
            groupId: notificationData.GroupId,
            commentId: commentId,
            replyId: replyId,
          });
        } else {
          navigation.navigate('DrawerRoutes', {
            screen: 'BottomBarRoutes',
            params: {
              screen: 'Feed',
              params: {
                navigationFrom: FeedParentScreenType.fromNotification,
                postId: postId,
                sessionId: notificationData.SessionId,
                groupId: notificationData.GroupId,
                commentId: commentId,
                replyId: replyId,
              },
            },
          });
        }
      } else {
        if (userDetails?.isAdvisor) {
          navigation.reset(
            parseRouteToDynamicReset(
              {
                screen: 'DrawerRoutes',
                params: {
                  screen: 'BottomBarRoutes',
                  params: {
                    screen: 'ContactListing',
                  },
                },
              },
              {
                screen: 'ContactFeed',
                data: {
                  navigationFrom: FeedParentScreenType.fromNotification,
                  postId: postId,
                  sessionId: notificationData?.SessionId,
                  groupId: notificationData?.GroupId,
                  commentId: commentId,
                  replyId: replyId,
                },
              },
            ),
          );
        } else {
          navigation.reset(
            parseRouteToDynamicReset({
              screen: 'DrawerRoutes',
              params: {
                screen: 'BottomBarRoutes',
                params: {
                  screen: 'Feed',
                  data: {
                    navigationFrom: FeedParentScreenType.fromNotification,
                    postId: postId,
                    sessionId: notificationData?.SessionId,
                    groupId: notificationData?.GroupId,
                    commentId: commentId,
                    replyId: replyId,
                  },
                },
              },
            }),
          );
        }
      }
    } else if (type?.includes('Document')) {
      if (notificationData?.fromNotificationScreen) {
        if (userDetails?.isAdvisor) {
          // handle for advisor when ticket get assigned
          navigation.navigate('Profile', {
            navigationFrom: ContactVaultParentScreenType.fromNotiList,
            folderID: notificationData.FolderId,
            fileIds: notificationData.FileIds,
            userId: parseInt(notificationData.SenderId!),
          });
        } else {
          navigation.navigate('DrawerRoutes', {
            screen: 'BottomBarRoutes',
            params: {
              screen: 'ContactProfile',
              params: {
                navigationFrom: ContactVaultParentScreenType.fromNotiList,
                folderID: notificationData.FolderId,
                fileId: notificationData.FileId,
              },
            },
          });
        }
      } else {
        if (userDetails?.isAdvisor) {
          // handle for advisor when ticket get assigned
          navigation.reset(
            parseRouteToDynamicReset(
              {
                screen: 'DrawerRoutes',
                params: {
                  screen: 'BottomBarRoutes',
                  params: {
                    screen: 'ContactListing',
                  },
                },
              },
              {
                screen: 'Profile',
                data: {
                  navigationFrom: ContactVaultParentScreenType.fromNotification,
                  folderID: notificationData?.FolderId,
                  fileIds: notificationData?.FileIds,
                  userId: parseInt(notificationData?.SenderId!),
                },
              },
            ),
          );
        } else {
          navigation.reset(
            parseRouteToDynamicReset({
              screen: 'DrawerRoutes',
              params: {
                screen: 'BottomBarRoutes',
                params: {
                  screen: 'ContactProfile',
                  data: {
                    navigationFrom:
                      ContactVaultParentScreenType.fromNotification,
                    folderID: notificationData?.FolderId,
                    fileId: notificationData?.FileId,
                  },
                },
              },
            }),
          );
        }
      }
    } else if (type.includes('Forum')) {
      let communityPostId;
      let communityCommentId;
      let communityReplyId;
      if (notificationData?.PostType == 'C') {
        communityPostId = notificationData.ParentPostId;
        communityCommentId = notificationData.PostId;
      } else if (notificationData?.PostType == 'R') {
        communityPostId = notificationData.ParentOfParentPostId;
        communityCommentId = notificationData.ParentPostId;
        communityReplyId = notificationData.PostId;
      } else {
        communityPostId = notificationData?.PostId;
      }

      if (notificationData?.fromNotificationScreen) {
        navigation.navigate('Community', {
          navigationFrom: CommunityParentScreenType.fromNotification,
          postId: communityPostId,
          sessionId: notificationData.SessionId,
          groupId: notificationData.GroupId,
          commentId: communityCommentId,
          replyId: communityReplyId,
        });
      } else {
        navigation.reset(
          parseRouteToDynamicReset(
            {
              screen: 'DrawerRoutes',
              params: {
                screen: 'BottomBarRoutes',
                params: { screen: 'Dashboard' },
              },
            },
            {
              screen: 'Community',
              data: {
                navigationFrom: CommunityParentScreenType.fromNotification,
                postId: communityPostId,
                sessionId: notificationData?.SessionId,
                groupId: notificationData?.GroupId,
                commentId: communityCommentId,
                replyId: communityReplyId,
              },
            },
          ),
        );
      }
    } else if (type.includes('ActionItem')) {
      if (notificationData?.fromNotificationScreen) {
        navigation.navigate('ActionItemList', {
          userId: userDetails?.isAdvisor
            ? Number(notificationData?.SenderId) // Use the SenderId from notification if advisor
            : userDetails?.userID, // Otherwise use the userID from userDetails
        });
      } else {
        navigation.reset(
          parseRouteToDynamicReset(
            {
              screen: 'DrawerRoutes',
              params: {
                screen: 'BottomBarRoutes',
                params: {
                  screen: 'Dashboard',
                },
              },
            },
            {
              screen: 'ActionItemList',
              data: {
                userId: userDetails?.isAdvisor
                  ? notificationData?.SenderId
                  : userDetails?.userID, // Pass the ID correctly here
              },
            },
          ),
        );
      }
    } else if (type.includes('Event')) {
      if (notificationData?.fromNotificationScreen) {
        navigation.navigate('ScheduleEventDetail', {
          id: notificationData.EventId,
        });
      } else {
        navigation.reset(
          parseRouteToDynamicReset(
            {
              screen: 'DrawerRoutes',
              params: {
                screen: 'BottomBarRoutes',
                params: {
                  screen: 'Dashboard',
                  params: {
                    screen: 'Notifications',
                  },
                },
              },
            },
            {
              screen: 'EventDetailScreen',
              data: {
                id: notificationData?.EventId,
              },
            },
          ),
        );
      }
    } else if (type.includes('Reminder')) {
      if (notificationData?.fromNotificationScreen) {
        navigation.navigate('DrawerRoutes', {
          screen: 'BottomBarRoutes',
          params: {
            screen: 'Dashboard',
            params: {
              remiderItemID: notificationData.ReminderId,
              fromNotification: true,
            },
          },
        });
      } else {
        navigation.reset(
          parseRouteToDynamicReset({
            screen: 'DrawerRoutes',
            params: {
              screen: 'BottomBarRoutes',
              params: {
                screen: 'Dashboard',
                data: {
                  remiderItemID: notificationData?.ReminderId,
                  fromNotification: true,
                },
              },
            },
          }),
        );
      }
    } else if (type.includes('CustomNotification')) {
      if (notificationData?.fromNotificationScreen) {
        if (notificationData.NotificationDataType == 'L') {
          navigation.navigate('Notifications', {
            url: notificationData.NotificationContent,
          });
        } else {
          navigation.navigate('CustomNotification', {
            NotificationHeader: notificationData.NotificationHeader,
            NotificationContent: notificationData.NotificationContent,
          });
        }
      } else {
        if (notificationData?.NotificationDataType == 'L') {
          navigation.reset(
            parseRouteToDynamicReset(
              {
                screen: 'DrawerRoutes',
                params: {
                  screen: 'BottomBarRoutes',
                  params: {
                    screen: 'Dashboard',
                  },
                },
              },
              {
                screen: 'Notifications',
                data: {
                  url: notificationData.NotificationContent,
                },
              },
            ),
          );
        } else {
          navigation.reset(
            parseRouteToDynamicReset(
              {
                screen: 'DrawerRoutes',
                params: {
                  screen: 'BottomBarRoutes',
                  params: {
                    screen: 'Dashboard',
                  },
                },
              },
              {
                screen: 'CustomNotification',
                data: {
                  NotificationHeader: notificationData?.NotificationHeader,
                  NotificationContent: notificationData?.NotificationContent,
                },
              },
            ),
          );
        }
      }
    } else if (type.includes('Marketing') || type.includes('Referral')) {
      if (notificationData?.fromNotificationScreen) {
        navigation.navigate('Profile', {
          userId: Number(notificationData?.UserId),
        });
      } else {
        navigation.reset(
          parseRouteToDynamicReset(
            {
              screen: 'DrawerRoutes',
              params: {
                screen: 'BottomBarRoutes',
                params: {
                  screen: 'ContactListing',
                },
              },
            },
            {
              screen: 'Profile',
              data: {
                userId: Number(notificationData?.UserId),
              },
            },
          ),
        );
      }
    } else if (type.includes('General') || type.includes('ContactInvite')) {
      if (notificationData?.fromNotificationScreen) {
        hideLoader();

        if (navigation.canGoBack()) {
          navigation.goBack(); // navigate back
        }
      } else {
        navigation.reset(
          parseRouteToDynamicReset({
            screen: 'DrawerRoutes',
            params: {
              screen: 'BottomBarRoutes',
              params: {
                screen: userDetails?.isAdvisor ? 'ContactListing' : 'Dashboard',
                data: {
                  fromNotification: true,
                },
              },
            },
          }),
        );
      }
    }
  };

  const callCreateOrEditApi = async () => {
    createOrEditApi.mutate({
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
    });
  };

  const createOrEditApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<null>({
        endpoint: ApiConstants.CreateOrEdit,
        method: HttpMethodApi.Post,
        data: sendData,
        byPassRefresh: true,
      }); // API Call
    },
    onSuccess(data, variables, onMutateResult, context) {
      sendSlientNotificationOnLoginApi.mutate({});
    },
  });

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

  return (
    <>
      <CustomPopup
        shown={showNotificationPermissionPopup}
        setShown={setShowNotificationPermissionPopup}
        title={t('AllowNotification')}
        msg={t('AllowNotificationMsg')}
        PositiveText={t('Allow')}
        NegativeText={t('Cancel')}
        onPositivePress={() => {
          setShowNotificationPermissionPopup(false);
          openNotificationSettings();
          setOpenAppSettings(true);
        }}
        onNegativePress={() => {
          setShowNotificationPermissionPopup(false);
        }}
      />
      <CustomPopup
        shown={showNotificationAlarmPermissionPopup}
        setShown={setShowNotificationAlarmPermissionPopup}
        title={t('SecurityNotification')}
        msg={t('SecurityUpdatesMsg')}
        PositiveText={t('Allow')}
        NegativeText={t('Cancel')}
        onPositivePress={() => {
          setShowNotificationAlarmPermissionPopup(false);
          notifee.openAlarmPermissionSettings();
          setOpenAlarmSettings(true);
        }}
        onNegativePress={() => {
          setShowNotificationAlarmPermissionPopup(false);
          storage.set('alarmPermission', false);
        }}
      />

      <CustomBottomPopup
        shown={showAllowNotiReminderPopup}
        setShown={setShowAllowNotiReminderPopup}
        title={t('AllowNotification')}
      >
        <View style={styles.main}>
          <CustomImage
            source={Images.notification}
            type={ImageType.svg}
            color={theme.colors.onSurfaceVariant}
            style={styles.reminderIcon}
          />
          <CustomText variant={TextVariants.bodyLarge}>
            {t('AllowNotiReminderTitle')}
          </CustomText>
          <CustomText style={styles.reminderMsg}>
            {t('AllowNotificationReminderMsg')}
          </CustomText>
          <CustomButton
            onPress={() => {
              setShowAllowNotiReminderPopup(false);
              openNotificationSettings();
              setOpenAppSettings(true);
            }}
          >
            {t('AllowNotification')}
          </CustomButton>
          <Tap
            style={styles.btn}
            onPress={() => setShowAllowNotiReminderPopup(false)}
          >
            <CustomText>{t('MaybeLater')}</CustomText>
          </Tap>
        </View>
      </CustomBottomPopup>
    </>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btn: {
      marginTop: 10,
      marginBottom: 30,
    },
    reminderMsg: {
      textAlign: 'center',
      marginTop: 20,
    },
    reminderIcon: {
      alignSelf: 'center',
      height: 100,
      width: 150,
    },
  });

export default NotificationManager;
