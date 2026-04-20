import {
  CustomFlatList,
  CustomImage,
  CustomText,
  LoadingView,
  SkeletonList,
  Tap,
} from '@/components/atoms';
import { ImageType } from '@/components/atoms/customImage/customImage';
import { TextVariants } from '@/components/atoms/customText/customText';
import { CustomHeader, EmptyView, LoadMore } from '@/components/molecules';
import { hideLoader } from '@/components/molecules/loader/loader';
import { SafeScreen } from '@/components/template';
import { notificationSeenApi } from '@/components/template/notificationManager/notificationManager';
import { ApiConstants } from '@/services/apiConstants';
import { HttpMethodApi, makeRequest } from '@/services/apiInstance';
import {
  GetNotificationListModel,
  NotificationModel,
  PushNotification,
} from '@/services/models';
import { badgesStore, userStore } from '@/store';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import Log from '@/utils/logger';
import {
  parseRouteToDynamicReset,
  useAppNavigation,
  useAppRoute,
  useReturnDataContext,
} from '@/utils/navigationUtils';
import { showSnackbar, useCustomInAppBrowser } from '@/utils/utils';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-paper';

export type NotificationProps = {
  url?: string;
};

function Notifications() {
  /** Added by @Yuvraj 09-04-2025 -> navigate to different screen (FYN-6459) */
  const navigation = useAppNavigation();

  /** Added by @Yuvraj 09-04-2025 -> get params from parent screen (FYN-6459) */
  const route = useAppRoute('Notifications');

  /** Added by @Yuvraj 09-04-2025 -> to access app theme(colors, roundness, fonts, etc) (FYN-6459) */
  const theme = useTheme();

  /** Added by @Yuvraj 09-04-2025 -> access StylesSheet with theme implemented (FYN-6459) */
  const styles = makeStyles(theme);

  /** Added by @Yuvraj 09-04-2025 -> translations for labels (FYN-6459) */
  const { t } = useTranslation();

  /** Added by @Yuvraj 09-04-2025 -> loading state for button (FYN-6459) */
  const [loading, setLoading] = useState<boolean>(false);

  const [apiLoading, setApiLoading] = useState(false);

  const [notificationIdLoading, setNotificationIdLoading] = useState<string>();

  /** Added by @Yuvraj 09-04-2025 -> loading state for button (FYN-6459) */
  const [notificationList, setNotificationList] = useState<PushNotification[]>(
    [],
  );

  /** Added by @Yuvraj 09-04-2025 -> page number for notification list (FYN-6459) */
  const [page, setPage] = useState(1);

  const [hasMoreData, setHasMoreData] = useState(true);

  const userDetails = userStore(state => state.userDetails);

  const setBadges = badgesStore(state => state.setBadges);

  const { sendDataBack } = useReturnDataContext();

  const openInAppBrowser = useCustomInAppBrowser(); // opening custom browser

  /** Added by @Yuvraj 09-04-2025 -> initial api calling (FYN-6459) */
  useEffect(() => {
    if (userDetails) {
      fetchNotifications(1);
      updateNotificationBellCountApi.mutate({});
    }
  }, []);

  useEffect(() => {
    if (route.params?.url) {
      hideLoader();
      openInAppBrowser(route.params?.url);
    }
  }, [route.params?.url]);

  /** Added by @Yuvraj 09-04-2025 -> function for calling notification list api (FYN-6459) */
  const fetchNotifications = (pageNumber: number, noLoading?: boolean) => {
    setPage(pageNumber);

    getUserNotificationsApi.mutate({
      apiPayload: {
        maxResultCount: 10,
        pageNo: pageNumber,
      },
      noLoading: noLoading,
    });
  };

  /** Added by @Yuvraj 09-04-2025 -> to get particular image (FYN-6459) */
  const getImageIcon = (notiType: string) => {
    if (notiType.indexOf('Like') != -1) {
      return { source: Images.like, type: ImageType.svg };
    } else if (notiType.indexOf('Post') != -1) {
      return { source: Images.newspaperPng, type: ImageType.png };
    } else if (notiType.indexOf('Comment') != -1) {
      return { source: Images.comment, type: ImageType.svg };
    } else if (notiType.indexOf('Reply') != -1) {
      return { source: Images.editSquare, type: ImageType.svg };
    } else if (notiType.indexOf('Messaging') != -1) {
      return { source: Images.faq, type: ImageType.svg };
    } else if (notiType.indexOf('Event') != -1) {
      return { source: Images.event, type: ImageType.png };
    } else if (notiType.indexOf('Reminder') != -1) {
      return { source: Images.reminder2, type: ImageType.png };
    } else if (notiType.indexOf('CustomNotification') != -1) {
      return { source: Images.customNotification, type: ImageType.svg };
    } else if (notiType.indexOf('Referral') != -1) {
      return { source: Images.refer, type: ImageType.svg };
    } else if (notiType.indexOf('ActionItem') != -1) {
      return { source: Images.itemList, type: ImageType.png };
    } else if (notiType.indexOf('NotifyAdvisor') != -1) {
      return { source: Images.message, type: ImageType.svg };
    } else {
      return { source: Images.newspaperPng, type: ImageType.png };
    }
  };

  const handleNavigation = (type: string) => {
    switch (type) {
      case 'Dashboard':
        navigation.reset(
          parseRouteToDynamicReset({
            screen: 'DrawerRoutes',
            params: {
              screen: 'BottomBarRoutes',
              params: {
                screen: 'Dashboard',
              },
            },
          }),
        );
        break;
      case 'Profile':
        navigation.reset(
          parseRouteToDynamicReset({
            screen: 'DrawerRoutes',
            params: {
              screen: 'BottomBarRoutes',
              params: {
                screen: 'Profile',
              },
            },
          }),
        );
        break;
      case 'Feed':
        navigation.reset(
          parseRouteToDynamicReset({
            screen: 'DrawerRoutes',
            params: {
              screen: 'BottomBarRoutes',
              params: {
                screen: 'Feed',
              },
            },
          }),
        );
        break;
      case 'Portal':
        navigation.reset(
          parseRouteToDynamicReset({
            screen: 'DrawerRoutes',
            params: {
              screen: 'BottomBarRoutes',
              params: {
                screen: 'Resources',
              },
            },
          }),
        );
        break;
      case 'Event':
        navigation.reset(
          parseRouteToDynamicReset({
            screen: 'DrawerRoutes',
            params: {
              screen: 'BottomBarRoutes',
              params: {
                screen: 'Dashboard',
                params: {
                  screen: 'EventViewAll',
                },
              },
            },
          }),
        );
        break;
      case 'Forum':
        navigation.reset(
          parseRouteToDynamicReset({
            screen: 'DrawerRoutes',
            params: {
              screen: 'BottomBarRoutes',
              params: {
                screen: 'Dashboard',
                params: {
                  screen: 'Community',
                },
              },
            },
          }),
        );
        break;
    }
  };

  /** Added by @Tarun 05-08-2025 -> api for getting notifications count (FYN-8554) */
  const callGetUserNotificationsApi = () => {
    getUserNotificationsApi.mutate({
      apiPayload: {},
      noLoading: true,
    });
  };

  /** Added by @Yuvraj 09-04-2025 -> api for getting notifications list (FYN-6459) */
  const getUserNotificationsApi = useMutation({
    mutationFn: (sendData: {
      apiPayload: Record<string, any>;
      noLoading?: boolean;
    }) => {
      return makeRequest<GetNotificationListModel>({
        endpoint: ApiConstants.GetUserNotifications,
        method: HttpMethodApi.Get,
        data: sendData.apiPayload,
      }); // API Call
    },
    onMutate(variables) {
      setApiLoading(true); // api loading true to stop multiple api calls

      if (variables.apiPayload.pageNo == 1 && !variables.noLoading) {
        // using page no from variable as it is updating more fast than state
        setLoading(true); // to show skeleton loader
      }
    },
    onSettled(data, error, variables, context) {
      setApiLoading(false); // api loading false

      if (variables.apiPayload.pageNo == 1 && !variables.noLoading) {
        setLoading(false);
      }
    },
    onSuccess(data, variables, context) {
      if (variables.noLoading) {
        setBadges(prev => ({
          ...prev,
          notificationCount:
            data.result?.unseenCount == 0 ? 0 : data.result?.unseenCount,
        }));
        return;
      }

      const handleMoreData = (
        totalCount?: number,
        items?: PushNotification[],
      ) => {
        if (totalCount && items && totalCount > items?.length) {
          setHasMoreData(true);
        } else {
          setHasMoreData(false);
        }

        if (data.result?.pushNotificationList?.length! < 10) {
          setHasMoreData(false);
        }
      };

      if (data.result) {
        const finalList = data.result.pushNotificationList.map(item => {
          const imgData = getImageIcon(item?.notificationName);
          return {
            ...item,
            imgIcon: imgData.source,
            imgType: imgData.type,
          };
        });
        if (variables.apiPayload.pageNo > 1) {
          const newList = [...notificationList, ...finalList];
          setNotificationList(newList);
          handleMoreData(data.result.totalCount, newList);
        } else {
          setNotificationList(finalList);
          handleMoreData(
            data.result.totalCount,
            data.result.pushNotificationList,
          );
        }
      }
    },
    onError(error, variables, context) {
      // Error Response
      if (!variables.noLoading) {
        setHasMoreData(false);
        if (variables.apiPayload.pageNo == 1) {
          setNotificationList([]);
        }
        showSnackbar(error.message, 'danger');
      }
    },
  });

  /** Added by @Yuvraj 09-04-2025 -> set notification as read single (FYN-6459) */
  const SetNotificationAsReadApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.SetNotificationAsRead,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setNotificationIdLoading(variables.Id);
    },
    onSettled(data, error, variables, context) {
      callGetUserNotificationsApi();
      setNotificationIdLoading(undefined);
    },
    onSuccess(data, variables, context) {
      if (data.success) {
        setNotificationList(prev =>
          prev.map(item => {
            if (item.userNotifId == variables.Id) {
              return {
                ...item,
                isUnread: false,
              };
            } else {
              return item;
            }
          }),
        );
        // GetNotificationDetailApi.mutate({
        //   NotificationId: variables.Id,
        // });
      }
    },
    onError(error, variables, context) {
      // Error Response
      setApiLoading(false);
      showSnackbar(error.message, 'danger');
    },
  });

  /** Added by @Yuvraj 09-04-2025 -> to mark all notification as read (FYN-6459) */
  const SetAllNotificationsAsReadApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<boolean>({
        endpoint: ApiConstants.SetAllNotificationsAsRead,
        method: HttpMethodApi.Post,
        data: sendData,
      }); // API Call
    },
    onMutate(variables) {
      setLoading(true);
    },
    onSettled(data, error, variables, context) {
      callGetUserNotificationsApi();
      setLoading(false);
    },
    onSuccess(data, variables, context) {
      if (data.success) {
        setNotificationList(prev =>
          prev.map(item => {
            return {
              ...item,
              isUnread: false,
            };
          }),
        );
      }
    },
    onError(error, variables, context) {
      // Error Response
      showSnackbar(error.message, 'danger');
    },
  });

  const updateNotificationBellCountApi = useMutation({
    mutationFn: (sendData: Record<string, any>) => {
      return makeRequest<number>({
        endpoint: ApiConstants.UpdateNotificationBellCount,
        method: HttpMethodApi.Put,
        data: sendData,
      }); // API Call
    },
  });

  const handleRedirection = (item: PushNotification) => {
    try {
      const notifData: NotificationModel = JSON.parse(item.customParameter);
      const notData: NotificationModel = {
        ...notifData,
        NotifId: item.userNotifId,
      };
      if (
        notData.NotiType == 'CustomNotification' &&
        notData.NotificationDataType == 'L'
      ) {
        openInAppBrowser(notData.NotificationContent);
      } else if (notData.AppType == 'General' && notData.AppSubType) {
        handleNavigation(notData.AppSubType);
      } else {
        notificationSeenApi({
          notificationData: { action: JSON.stringify(notData) },
          fromNotificationScreen: true,
        });
      }
    } catch (err) {
      Log('Notification redirection error: ' + err);
      if (navigation.canGoBack()) {
        navigation.goBack(); // navigate back
      }
    }
  };

  const renderItem = (item: PushNotification) => (
    <View>
      <Tap
        onPress={() => {
          handleRedirection(item);
          if (item.isUnread) {
            SetNotificationAsReadApi.mutate({
              Id: item.userNotifId,
            });
          }
        }}
        style={{
          ...styles.itemContainer,
          backgroundColor: item.isUnread
            ? theme.colors.surfaceVariant
            : theme.colors.surface,
        }}
      >
        <View style={styles.itemInnerContainer}>
          <CustomImage
            source={item.imgIcon}
            type={item.imgType}
            color={theme.colors.primary}
            style={styles.markedIcon}
          />
          <View style={styles.titleContainer}>
            <CustomText maxLines={2} variant={TextVariants.bodyLarge}>
              {item.message}
            </CustomText>

            <CustomText
              variant={TextVariants.labelMedium}
              color={theme.colors.outline}
              style={{ marginTop: 5 }}
            >
              {item.timeAgo}
            </CustomText>
          </View>
          <CustomText
            color={
              item.isUnread ? theme.colors.primary : theme.colors.onPrimary
            }
            variant={TextVariants.titleLarge}
          >
            {'•'}
          </CustomText>
        </View>
      </Tap>
      {item.userNotifId == notificationIdLoading && <LoadingView />}
    </View>
  );

  return (
    <SafeScreen>
      <View style={styles.main}>
        <CustomHeader
          showBack
          title={t('Notifications')}
          maxVisibleIcon={0}
          actionButton={
            notificationList.length > 0 && (
              <Tap
                onPress={() => SetAllNotificationsAsReadApi.mutate({})}
                style={styles.headerBtn}
              >
                <CustomText variant={TextVariants.labelSmall}>
                  {t('MarkAllAsRead')}
                </CustomText>
              </Tap>
            )
          }
        />

        <View style={styles.main}>
          {loading ? (
            <SkeletonList count={12}>
              <View style={styles.skeletonItemContainer}>
                <View style={styles.skeletonImage}></View>
                <View style={styles.skeletonInnerItemContainer}>
                  <View style={styles.skeletonMessage}></View>
                  <View style={styles.skeletonSubTitle}></View>
                </View>
              </View>
            </SkeletonList>
          ) : (
            <CustomFlatList
              data={notificationList}
              extraData={[notificationIdLoading]}
              keyExtractor={(item, index) =>
                `${item.userNotifId}-${item.notifId}-${item.notifTime}`
              }
              refreshing={loading}
              onRefresh={() => {
                fetchNotifications(1);
              }}
              onEndReachedThreshold={0.6}
              onEndReached={() => {
                if (hasMoreData && !apiLoading) {
                  fetchNotifications(page + 1);
                }
              }}
              ListEmptyComponent={
                <EmptyView
                  style={styles.noDataContainer}
                  imageColor={theme.colors.onSurfaceVariant}
                  label={t('NoNotification')}
                />
              }
              ListFooterComponent={
                hasMoreData ? <LoadMore /> : <View style={styles.listFooter} />
              }
              ItemSeparatorComponent={() => <Divider />}
              renderItem={({ item }) => renderItem(item)}
            />
          )}
        </View>
      </View>
    </SafeScreen>
  );
}

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    main: {
      flex: 1,
    },
    markedButtonContainer: {
      position: 'absolute',
      zIndex: 50,
      right: 2,
      borderRadius: 999,
      borderWidth: 0.5,
      borderColor: theme.colors.onPrimary,
      flexDirection: 'row',
      alignSelf: 'flex-end',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 15,
      gap: 6,
      marginHorizontal: 10,
      marginBottom: 15,
      backgroundColor: theme.colors.primary,
    },
    markedIcon: {
      height: 20,
      width: 20,
      marginTop: 5,
    },
    titleContainer: {
      flex: 1,
    },
    unreadDot: { width: 15 },
    noDataContainer: {
      height: 500,
    },
    itemContainer: {
      paddingHorizontal: 12,
    },
    itemInnerContainer: {
      padding: 5,
      flexDirection: 'row',
      //alignItems: 'center',
      gap: 10,
      justifyContent: 'space-between',
    },
    skeletonItemContainer: {
      marginHorizontal: 7,
      marginVertical: 1,
      borderRadius: theme.roundness,
      padding: 10,
      flexDirection: 'row',
      gap: 10,
      borderBottomWidth: 0.25,
    },
    skeletonImage: {
      height: 20,
      width: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
    },
    skeletonInnerItemContainer: {
      width: '90%',
      gap: 5,
    },
    skeletonMessage: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: '100%',
      height: 25,
    },
    skeletonSubTitle: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      width: '30%',
      height: 20,
    },
    unreadContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
      paddingHorizontal: 20,
      paddingVertical: 5,
    },
    unreadButton: {
      fontWeight: '600',
      fontSize: 16,
      letterSpacing: 0,
      lineHeight: 24,
    },
    listFooter: {
      height: 20,
    },
    headerBtn: {
      height: 30,
      //width: 110,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 5,
      borderWidth: 0.8,
      borderColor: theme.colors.outline,
      marginRight: 20,
      borderRadius: theme.roundness,
      padding: 0,
      paddingHorizontal: 10,
    },
  });

export default Notifications;
